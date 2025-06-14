/**
 * Utilities for handling and cleaning LLM responses.
 */

/**
 * Cleans a string presumed to be a JSON response from an LLM.
 * It removes common markdown code block formatting (```json ... ``` or ``` ... ```)
 * and trims whitespace.
 *
 * @param content - The raw string content from the LLM.
 * @returns The cleaned string, hopefully a valid JSON string.
 */
export function cleanLLMJsonString(content: string): string {
  let cleanContent = content.trim();

  // Remove markdown code blocks if present
  // Handles ```json\n{...}\n``` or ```\n{...}\n```
  if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
  }
  return cleanContent.trim();
}
