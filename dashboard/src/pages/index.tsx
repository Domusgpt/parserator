import Head from 'next/head';
import React, { useState, useEffect, FormEvent } from 'react';
import '../styles/globals.css'; // Import global styles
import * as api from '../../lib/api'; // Assuming api.ts is in dashboard/lib/
import { SavedSchema, ParseResponse, SchemaObject, UpsertSchemaRequest } from '@parserator/types';

// --- Helper: ApiKeyInput Component (Basic) ---
const ApiKeyInput: React.FC = () => {
    const [key, setKey] = useState<string>('');
    const [savedKeyDisplay, setSavedKeyDisplay] = useState<string>('');

    useEffect(() => {
        const loadedKey = localStorage.getItem('parserator_api_key');
        if (loadedKey) {
            setKey(loadedKey);
            setSavedKeyDisplay(loadedKey.substring(0, 5) + '...');
            api.setApiKey(loadedKey);
        }
    }, []);

    const handleSetKey = () => {
        api.setApiKey(key);
        setSavedKeyDisplay(key ? key.substring(0, 5) + '...' : '');
        alert('API Key set!');
    };

    return (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <h4>API Key Management</h4>
            <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter API Key"
                style={{ marginRight: '10px', minWidth: '300px' }}
            />
            <button onClick={handleSetKey}>Set API Key</button>
            {savedKeyDisplay && <p>Current key: {savedKeyDisplay}</p>}
        </div>
    );
};

// --- Helper: SchemaList Component ---
interface SchemaListProps {
    schemas: SavedSchema[];
    onSelectSchema: (id: string) => void;
    selectedSchemaId?: string | null;
}
const SchemaList: React.FC<SchemaListProps> = ({ schemas, onSelectSchema, selectedSchemaId }) => (
    <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
        <h4>Available Schemas</h4>
        {schemas.length === 0 && <p>No schemas loaded. Create one or check API connection.</p>}
        <ul style={{ listStyle: 'none', padding: 0 }}>
            {schemas.map(s => (
                <li key={s.id}
                    onClick={() => onSelectSchema(s.id)}
                    style={{
                        padding: '5px',
                        cursor: 'pointer',
                        backgroundColor: selectedSchemaId === s.id ? '#e0e0e0' : 'transparent'
                    }}>
                    {s.name} (ID: {s.id})
                </li>
            ))}
        </ul>
    </div>
);

// --- Helper: SchemaDetail Component ---
interface SchemaDetailProps {
    schema: SavedSchema | null;
}
const SchemaDetail: React.FC<SchemaDetailProps> = ({ schema }) => {
    if (!schema) return <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}><h4>Schema Details</h4><p>No schema selected.</p></div>;
    return (
        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <h4>Schema Details: {schema.name}</h4>
            <p>ID: {schema.id}</p>
            <p>Description: {schema.description || 'N/A'}</p>
            <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '10px' }}>
                {JSON.stringify(schema.schema, null, 2)}
            </pre>
        </div>
    );
};

// --- Helper: TestParseForm Component ---
interface TestParseFormProps {
    selectedSchema: SavedSchema | null;
    onSubmit: (text: string, schemaId?: string, schemaObject?: SchemaObject) => void;
    isLoading: boolean;
}
const TestParseForm: React.FC<TestParseFormProps> = ({ selectedSchema, onSubmit, isLoading }) => {
    const [text, setText] = useState<string>('');
    const [useCustomSchema, setUseCustomSchema] = useState<boolean>(false);
    const [customSchemaJson, setCustomSchemaJson] = useState<string>('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (useCustomSchema) {
            try {
                const schemaObj = JSON.parse(customSchemaJson);
                onSubmit(text, undefined, schemaObj);
            } catch (err) {
                alert('Invalid custom schema JSON.');
            }
        } else {
            onSubmit(text, selectedSchema?.id);
        }
    };

    useEffect(() => { // If selected schema changes, clear custom schema
        setUseCustomSchema(false);
        setCustomSchemaJson('');
    }, [selectedSchema]);

    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <h4>Test Parse</h4>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter text to parse..."
                rows={5}
                style={{ width: '100%', marginBottom: '10px' }}
            />
            <div>
                <label>
                    <input
                        type="checkbox"
                        checked={useCustomSchema}
                        onChange={(e) => setUseCustomSchema(e.target.checked)}
                    />
                    Use Custom Schema JSON
                </label>
            </div>
            {useCustomSchema ? (
                <textarea
                    value={customSchemaJson}
                    onChange={(e) => setCustomSchemaJson(e.target.value)}
                    placeholder='Enter schema as JSON (e.g., {"name": "string"})'
                    rows={5}
                    style={{ width: '100%', marginTop: '10px', marginBottom: '10px' }}
                />
            ) : (
                <p>Using selected schema: {selectedSchema ? selectedSchema.name : "None (select a schema or provide custom JSON)"}</p>
            )}
            <button type="submit" disabled={isLoading || (!selectedSchema && !useCustomSchema) || (useCustomSchema && !customSchemaJson.trim())}>
                {isLoading ? 'Parsing...' : 'Parse'}
            </button>
        </form>
    );
};

// --- Helper: ParseResult Component ---
interface ParseResultProps {
    parseResult: ParseResponse | null;
}
const ParseResultDisplay: React.FC<ParseResultProps> = ({ parseResult }) => {
    if (!parseResult) return null;
    return (
        <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc' }}>
            <h4>Parse Result</h4>
            {parseResult.success ? (
                <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', padding: '10px' }}>
                    {JSON.stringify(parseResult.result, null, 2)}
                </pre>
            ) : (
                <p style={{ color: 'red' }}>Error: {parseResult.error} (Code: {parseResult.code || 'N/A'})</p>
            )}
            {parseResult.usage && (
                <p>Usage: {parseResult.usage.total_tokens} tokens</p>
            )}
        </div>
    );
};


// --- Main Page Component ---
export default function DashboardPage() {
    const [schemas, setSchemas] = useState<SavedSchema[]>([]);
    const [selectedSchema, setSelectedSchema] = useState<SavedSchema | null>(null);
    const [parseResult, setParseResult] = useState<ParseResponse | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    // Initialize with conceptual api.getCurrentBaseUrl() or a default
    const [baseUrlInput, setBaseUrlInput] = useState<string>(() => {
        // This function will only run client-side if api.ts relies on localStorage for initial base URL
        if (typeof window !== 'undefined' && api.getCurrentBaseUrl) {
            return api.getCurrentBaseUrl() || 'http://localhost:5001/parserator-monorepo/us-central1/api_entry';
        }
        return 'http://localhost:5001/parserator-monorepo/us-central1/api_entry';
    });


    const fetchSchemas = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const loadedSchemas = await api.listSchemas();
            setSchemas(loadedSchemas);
        } catch (err: any) {
            console.error("Error fetching schemas:", err);
            const currentUrl = api.getCurrentBaseUrl ? api.getCurrentBaseUrl() : baseUrlInput;
            setError(`Failed to load schemas: ${err.message}. Ensure API is running and reachable at ${currentUrl}.`);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSchemas();
    }, []);

    const handleSelectSchema = async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const schema = await api.getSchema(id);
            setSelectedSchema(schema);
        } catch (err: any) {
            console.error("Error fetching schema details:", err);
            setError(`Failed to load schema details: ${err.message}`);
            setSelectedSchema(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleParseSubmit = async (text: string, schemaId?: string, schemaObject?: SchemaObject) => {
        setIsLoading(true);
        setError(null);
        setParseResult(null);
        try {
            const result = await api.parseText(text, schemaObject, schemaId);
            setParseResult(result);
        } catch (err: any) {
            console.error("Error parsing:", err);
            setError(`Parsing failed: ${err.message}`);
            setParseResult({ success: false, error: err.message, code: err.code });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSetBaseUrl = () => {
        api.setBaseUrl(baseUrlInput);
        fetchSchemas(); // Re-fetch schemas from new URL
    };


    return (
        <>
            <Head>
                <title>Parserator Dashboard</title>
            </Head>
            <main style={{ fontFamily: 'sans-serif', padding: '20px' }}>
                <h1>Parserator Dashboard (Minimal)</h1>
                <p>Base API URL: <input type="text" value={baseUrlInput} onChange={e => setBaseUrlInput(e.target.value)} style={{width: '400px'}}/> <button onClick={handleSetBaseUrl}>Set & Refresh Schemas</button></p>

                <ApiKeyInput />
                {error && <p style={{ color: 'red' }}><strong>Error: {error}</strong></p>}
                {isLoading && <p>Loading...</p>}

                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <SchemaList schemas={schemas} onSelectSchema={handleSelectSchema} selectedSchemaId={selectedSchema?.id} />
                    </div>
                    <div style={{ flex: 2 }}>
                        <SchemaDetail schema={selectedSchema} />
                        <TestParseForm selectedSchema={selectedSchema} onSubmit={handleParseSubmit} isLoading={isLoading} />
                        <ParseResultDisplay parseResult={parseResult} />
                    </div>
                </div>
            </main>
        </>
    );
}
