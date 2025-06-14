import express from 'express';
import supertest from 'supertest';
import cors from 'cors';
import {
    parseHandler,
    upsertSchemaHandler,
    getSchemaHandler,
    listSchemasHandler
} from '../handlers'; // Adjust path if your handlers are structured differently
import { SavedSchema, ParseRequest, UpsertSchemaRequest } from '@parserator/types';

// Mock uuidv4 to return predictable IDs
jest.mock('uuid', () => ({
    v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substring(2, 8))
}));


// Setup Express app for testing
const app = express();
app.use(cors());
app.use(express.json());

app.post('/parse', parseHandler);
app.post('/schemas', upsertSchemaHandler);
app.get('/schemas', listSchemasHandler);
app.get('/schemas/:schemaId', getSchemaHandler);
app.put('/schemas/:schemaId', upsertSchemaHandler);

const request = supertest(app);

describe('API Handlers', () => {

    describe('Schema Handlers', () => {
        let createdSchemaId: string;

        it('should create a new schema via POST /schemas', async () => {
            const newSchema: UpsertSchemaRequest = {
                name: 'Test Schema',
                description: 'A schema for testing',
                schema: { type: 'object', properties: { field1: { type: 'string' } } }
            };
            const res = await request.post('/schemas').send(newSchema);
            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBeDefined();
            expect(res.body.data.name).toBe(newSchema.name);
            expect(res.body.data.schema).toEqual(newSchema.schema);
            createdSchemaId = res.body.data.id; // Save for next tests
        });

        it('should get the created schema via GET /schemas/:id', async () => {
            const res = await request.get(`/schemas/${createdSchemaId}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.id).toBe(createdSchemaId);
            expect(res.body.data.name).toBe('Test Schema');
        });

        it('should list all schemas via GET /schemas', async () => {
            const res = await request.get('/schemas');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
            const found = res.body.data.find((s: SavedSchema) => s.id === createdSchemaId);
            expect(found).toBeDefined();
        });

        it('should update an existing schema via PUT /schemas/:id', async () => {
            const updatedSchemaData: UpsertSchemaRequest = {
                name: 'Updated Test Schema',
                description: 'Updated description',
                schema: { type: 'object', properties: { field1: { type: 'number' } } }
            };
            const res = await request.put(`/schemas/${createdSchemaId}`).send(updatedSchemaData);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.name).toBe(updatedSchemaData.name);
            expect(res.body.data.schema).toEqual(updatedSchemaData.schema);
            expect(res.body.data.description).toBe(updatedSchemaData.description);
        });

        it('should return 404 for a non-existent schema ID on GET', async () => {
            const res = await request.get('/schemas/non-existent-id');
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.error).toContain('not found');
        });

        it('should return 404 for a non-existent schema ID on PUT', async () => {
            const res = await request.put('/schemas/non-existent-id').send({ name: 'test', schema: {} });
            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false); // Assuming ApiResponse format for errors too
            expect(res.body.error).toContain('not found');
        });

        it('should return 400 on POST /schemas if name is missing', async () => {
            const res = await request.post('/schemas').send({ schema: { type: "string"} });
            expect(res.status).toBe(400);
            expect(res.body.code).toBe('validation_error');
        });

        it('should return 400 on POST /schemas if schema content is missing', async () => {
            const res = await request.post('/schemas').send({ name: "Test Name" });
            expect(res.status).toBe(400);
            expect(res.body.code).toBe('validation_error');
        });
    });

    describe('Parse Handler', () => {
        it('should parse text with an inline schema', async () => {
            const parsePayload: ParseRequest = {
                text: 'Extract this: value1',
                schema: { properties: { data: { type: 'string' } } }
            };
            const res = await request.post('/parse').send(parsePayload);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.result).toBeDefined();
            expect(res.body.result.data).toBe('parsed: Extract th for data'); // Based on mock logic
            expect(res.body.usage).toBeDefined();
        });

        it('should parse text with a saved schemaId', async () => {
            // First, create a schema to get a valid ID
            const schemaPayload: UpsertSchemaRequest = { name: 'Parse Test Schema', schema: { properties: { item: { type: 'string' } } } };
            const schemaRes = await request.post('/schemas').send(schemaPayload);
            const schemaId = schemaRes.body.data.id;

            const parsePayload: ParseRequest = {
                text: 'Sample item data',
                schemaId: schemaId
            };
            const res = await request.post('/parse').send(parsePayload);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.result.item).toBe('parsed: Sample ite for item');
        });

        it('should return 400 if text is missing', async () => {
            const parsePayload = { schema: { type: 'string' } };
            const res = await request.post('/parse').send(parsePayload);
            expect(res.status).toBe(400);
            expect(res.body.code).toBe('validation_error');
        });

        it('should return 400 if neither schema nor schemaId is provided', async () => {
            const parsePayload = { text: 'some text' };
            const res = await request.post('/parse').send(parsePayload);
            expect(res.status).toBe(400);
            expect(res.body.code).toBe('validation_error');
        });

        it('should return 404 if schemaId is provided but not found and no inline schema', async () => {
            const parsePayload: ParseRequest = { text: 'some text', schemaId: 'non-existent-schema-id' };
            const res = await request.post('/parse').send(parsePayload);
            expect(res.status).toBe(404);
            expect(res.body.code).toBe('not_found');
        });
    });
});
