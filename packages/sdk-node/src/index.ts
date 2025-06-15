/**
 * Parserator Node.js SDK
 * Thin wrapper around @parserator/core with Node.js-specific conveniences
 */

import { ParseClient, ParseRequest, ParseResponse, ClientConfig } from '@parserator/core';
import { readFile, writeFile } from 'fs/promises';
import { createReadStream, createWriteStream, ReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import * as path from 'path';

export interface NodeParseOptions {
  /** Encoding for file operations (default: 'utf8') */
  encoding?: BufferEncoding;
  
  /** Whether to create output directory if it doesn't exist */
  createDir?: boolean;
  
  /** Batch size for processing multiple files */
  batchSize?: number;
}

/**
 * Node.js-optimized Parserator client
 * Extends the shared core with file system operations and Node.js conveniences
 */
export class Parserator extends ParseClient {
  constructor(config: Partial<ClientConfig> & { apiKey?: string } = {}) {
    super(config);
  }

  /**
   * Parse text content from a file
   */
  async parseFile(
    filePath: string, 
    schema: Record<string, any>, 
    options: NodeParseOptions = {}
  ): Promise<ParseResponse> {
    const { encoding = 'utf8' } = options;
    
    try {
      const content = await readFile(filePath, encoding);
      
      return this.parse({
        inputData: content,
        outputSchema: schema,
        instructions: `Parsing content from file: ${path.basename(filePath)}`
      });
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to parse file ${filePath}: ${message}`);
    }
  }

  /**
   * Parse multiple files and return results array
   */
  async parseFiles(
    filePaths: string[],
    schema: Record<string, any>,
    options: NodeParseOptions = {}
  ): Promise<ParseResponse[]> {
    const { batchSize = 5 } = options;
    const results: ParseResponse[] = [];
    
    // Process files in batches to avoid overwhelming the API
    for (let i = 0; i < filePaths.length; i += batchSize) {
      const batch = filePaths.slice(i, i + batchSize);
      
      const batchPromises = batch.map(filePath => 
        this.parseFile(filePath, schema, options)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Add error as failed response
          const message = result.reason instanceof Error ? result.reason.message : 'Unknown error';
          results.push({
            success: false,
            error: {
              code: 'FILE_PROCESSING_ERROR',
              message,
              name: 'ApiError'
            }
          });
        }
      }
    }
    
    return results;
  }

  /**
   * Parse text and save results to JSON file
   */
  async parseAndSave(
    inputText: string,
    schema: Record<string, any>,
    outputPath: string,
    options: NodeParseOptions = {}
  ): Promise<ParseResponse> {
    const { createDir = true, encoding = 'utf8' } = options;
    
    const result = await this.parse({
      inputData: inputText,
      outputSchema: schema
    });
    
    if (result.success && result.parsedData) {
      // Create directory if needed
      if (createDir) {
        const dir = path.dirname(outputPath);
        await import('fs').then(fs => fs.promises.mkdir(dir, { recursive: true }));
      }
      
      // Save parsed data to file
      const output = {
        parsedData: result.parsedData,
        metadata: result.metadata,
        timestamp: new Date().toISOString()
      };
      
      await writeFile(outputPath, JSON.stringify(output, null, 2), encoding);
    }
    
    return result;
  }

  /**
   * Parse from a readable stream (useful for large files)
   */
  async parseStream(
    stream: ReadStream,
    schema: Record<string, any>,
    options: { chunkSize?: number } = {}
  ): Promise<ParseResponse> {
    const { chunkSize = 1024 * 1024 } = options; // 1MB chunks
    
    let content = '';
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: string | Buffer) => {
        content += chunk.toString();
        
        // Prevent memory issues with extremely large files
        if (content.length > chunkSize * 10) {
          stream.destroy();
          reject(new Error('File too large for stream parsing'));
        }
      });
      
      stream.on('end', async () => {
        try {
          const result = await this.parse({
            inputData: content,
            outputSchema: schema,
            instructions: 'Parsing content from stream'
          });
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      stream.on('error', reject);
    });
  }

  /**
   * Batch process directory of files with same schema
   */
  async parseDirectory(
    dirPath: string,
    schema: Record<string, any>,
    options: NodeParseOptions & { 
      pattern?: RegExp;
      recursive?: boolean;
      outputDir?: string;
    } = {}
  ): Promise<{ 
    successful: ParseResponse[];
    failed: Array<{ file: string; error: string }>;
    summary: { total: number; successful: number; failed: number };
  }> {
    const { 
      pattern = /\.(txt|md|json|csv)$/i,
      recursive = false,
      outputDir,
      batchSize = 3
    } = options;
    
    const fs = await import('fs');
    const files: string[] = [];
    
    // Get all matching files
    const getFiles = async (dir: string): Promise<void> => {
      const entries = await fs.promises.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && recursive) {
          await getFiles(fullPath);
        } else if (entry.isFile() && pattern.test(entry.name)) {
          files.push(fullPath);
        }
      }
    };
    
    await getFiles(dirPath);
    
    // Process files
    const results = await this.parseFiles(files, schema, { batchSize });
    
    // Separate successful and failed results
    const successful: ParseResponse[] = [];
    const failed: Array<{ file: string; error: string }> = [];
    
    results.forEach((result, index) => {
      if (result.success) {
        successful.push(result);
        
        // Save individual results if output directory specified
        if (outputDir) {
          const fileName = path.basename(files[index], path.extname(files[index]));
          const outputPath = path.join(outputDir, `${fileName}_parsed.json`);
          
          writeFile(outputPath, JSON.stringify({
            originalFile: files[index],
            parsedData: result.parsedData,
            metadata: result.metadata,
            timestamp: new Date().toISOString()
          }, null, 2)).catch(console.error);
        }
      } else {
        failed.push({
          file: files[index],
          error: result.error?.message || 'Unknown error'
        });
      }
    });
    
    return {
      successful,
      failed,
      summary: {
        total: files.length,
        successful: successful.length,
        failed: failed.length
      }
    };
  }

  /**
   * Create a reusable parser function for a specific schema
   */
  createParser(schema: Record<string, any>, instructions?: string) {
    return (text: string) => this.parse({
      inputData: text,
      outputSchema: schema,
      instructions
    });
  }

  /**
   * Validate that a parsed result matches the expected schema
   */
  validateParsedData(data: any, schema: Record<string, any>): boolean {
    // Simple validation - in production you might want to use a library like Joi or Zod
    for (const [key, type] of Object.entries(schema)) {
      if (!(key in data)) {
        return false;
      }
      
      const actualType = typeof data[key];
      const expectedType = typeof type === 'string' ? type : 'object';
      
      if (actualType !== expectedType) {
        return false;
      }
    }
    
    return true;
  }
}

// Export types from core for convenience
export * from '@parserator/core';

// Default export
export default Parserator;