/**
 * Parserator API Key Generation System
 * Generates secure API keys for test and live environments
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class ParseatorAPIKeyGenerator {
    constructor() {
        this.keyDatabase = new Map();
        this.loadExistingKeys();
    }

    /**
     * Generate a new API key
     * @param {string} type - 'test' or 'live'
     * @param {string} userId - User identifier
     * @param {object} metadata - Additional key metadata
     * @returns {object} Generated key information
     */
    generateAPIKey(type = 'test', userId = null, metadata = {}) {
        // Validate type
        if (!['test', 'live'].includes(type)) {
            throw new Error('API key type must be "test" or "live"');
        }

        // Generate key components
        const prefix = type === 'test' ? 'pk_test_' : 'pk_live_';
        const randomBytes = crypto.randomBytes(32);
        const keyBody = randomBytes.toString('base64url').substring(0, 32);
        const fullKey = prefix + keyBody;

        // Generate key ID and secret
        const keyId = crypto.randomBytes(16).toString('hex');
        const keySecret = crypto.randomBytes(24).toString('base64url');

        // Create key record
        const keyRecord = {
            id: keyId,
            key: fullKey,
            secret: keySecret,
            type: type,
            userId: userId,
            created: new Date().toISOString(),
            lastUsed: null,
            usageCount: 0,
            rateLimits: this.getDefaultRateLimits(type),
            active: true,
            metadata: {
                ...metadata,
                ipWhitelist: [],
                permissions: this.getDefaultPermissions(type)
            }
        };

        // Store in database
        this.keyDatabase.set(fullKey, keyRecord);
        this.saveKeys();

        return {
            success: true,
            apiKey: fullKey,
            keyId: keyId,
            type: type,
            rateLimits: keyRecord.rateLimits,
            permissions: keyRecord.metadata.permissions,
            created: keyRecord.created
        };
    }

    /**
     * Validate an API key
     * @param {string} apiKey - API key to validate
     * @returns {object} Validation result
     */
    validateAPIKey(apiKey) {
        if (!apiKey || typeof apiKey !== 'string') {
            return { valid: false, error: 'Invalid API key format' };
        }

        // Check format
        if (!apiKey.startsWith('pk_test_') && !apiKey.startsWith('pk_live_')) {
            return { valid: false, error: 'Invalid API key prefix' };
        }

        // Check if key exists
        const keyRecord = this.keyDatabase.get(apiKey);
        if (!keyRecord) {
            return { valid: false, error: 'API key not found' };
        }

        // Check if key is active
        if (!keyRecord.active) {
            return { valid: false, error: 'API key is deactivated' };
        }

        // Update usage
        keyRecord.lastUsed = new Date().toISOString();
        keyRecord.usageCount += 1;
        this.saveKeys();

        return {
            valid: true,
            keyInfo: {
                id: keyRecord.id,
                type: keyRecord.type,
                userId: keyRecord.userId,
                rateLimits: keyRecord.rateLimits,
                permissions: keyRecord.metadata.permissions,
                usageCount: keyRecord.usageCount
            }
        };
    }

    /**
     * Revoke an API key
     * @param {string} apiKey - API key to revoke
     * @returns {object} Revocation result
     */
    revokeAPIKey(apiKey) {
        const keyRecord = this.keyDatabase.get(apiKey);
        if (!keyRecord) {
            return { success: false, error: 'API key not found' };
        }

        keyRecord.active = false;
        keyRecord.revokedAt = new Date().toISOString();
        this.saveKeys();

        return { success: true, message: 'API key revoked successfully' };
    }

    /**
     * List API keys for a user
     * @param {string} userId - User identifier
     * @returns {array} List of user's API keys
     */
    listUserKeys(userId) {
        const userKeys = [];
        
        for (const [key, record] of this.keyDatabase) {
            if (record.userId === userId) {
                userKeys.push({
                    keyId: record.id,
                    type: record.type,
                    created: record.created,
                    lastUsed: record.lastUsed,
                    usageCount: record.usageCount,
                    active: record.active,
                    // Don't expose the actual key for security
                    keyPreview: key.substring(0, 12) + '...'
                });
            }
        }

        return userKeys;
    }

    /**
     * Get usage statistics for an API key
     * @param {string} apiKey - API key
     * @returns {object} Usage statistics
     */
    getKeyStats(apiKey) {
        const keyRecord = this.keyDatabase.get(apiKey);
        if (!keyRecord) {
            return { error: 'API key not found' };
        }

        return {
            keyId: keyRecord.id,
            type: keyRecord.type,
            created: keyRecord.created,
            lastUsed: keyRecord.lastUsed,
            usageCount: keyRecord.usageCount,
            rateLimits: keyRecord.rateLimits,
            active: keyRecord.active
        };
    }

    /**
     * Update rate limits for an API key
     * @param {string} apiKey - API key
     * @param {object} newLimits - New rate limits
     * @returns {object} Update result
     */
    updateRateLimits(apiKey, newLimits) {
        const keyRecord = this.keyDatabase.get(apiKey);
        if (!keyRecord) {
            return { success: false, error: 'API key not found' };
        }

        keyRecord.rateLimits = { ...keyRecord.rateLimits, ...newLimits };
        this.saveKeys();

        return { success: true, rateLimits: keyRecord.rateLimits };
    }

    /**
     * Get default rate limits based on key type
     * @param {string} type - Key type
     * @returns {object} Default rate limits
     */
    getDefaultRateLimits(type) {
        const limits = {
            test: {
                requestsPerMinute: 100,
                requestsPerHour: 1000,
                requestsPerDay: 10000,
                requestsPerMonth: 100000
            },
            live: {
                requestsPerMinute: 1000,
                requestsPerHour: 10000,
                requestsPerDay: 100000,
                requestsPerMonth: 1000000
            }
        };

        return limits[type] || limits.test;
    }

    /**
     * Get default permissions based on key type
     * @param {string} type - Key type
     * @returns {array} Default permissions
     */
    getDefaultPermissions(type) {
        const permissions = {
            test: [
                'parse:basic',
                'parse:email',
                'parse:document',
                'export:json',
                'export:csv'
            ],
            live: [
                'parse:basic',
                'parse:email',
                'parse:document',
                'parse:advanced',
                'template:create',
                'template:use',
                'export:json',
                'export:csv',
                'export:xml',
                'webhook:configure',
                'analytics:view'
            ]
        };

        return permissions[type] || permissions.test;
    }

    /**
     * Load existing keys from storage
     */
    loadExistingKeys() {
        const keysFile = path.join(__dirname, 'api-keys-database.json');
        
        try {
            if (fs.existsSync(keysFile)) {
                const data = fs.readFileSync(keysFile, 'utf8');
                const keysArray = JSON.parse(data);
                
                this.keyDatabase.clear();
                keysArray.forEach(([key, record]) => {
                    this.keyDatabase.set(key, record);
                });
            }
        } catch (error) {
            console.warn('Could not load existing keys:', error.message);
        }
    }

    /**
     * Save keys to storage
     */
    saveKeys() {
        const keysFile = path.join(__dirname, 'api-keys-database.json');
        
        try {
            const keysArray = Array.from(this.keyDatabase.entries());
            fs.writeFileSync(keysFile, JSON.stringify(keysArray, null, 2));
        } catch (error) {
            console.error('Could not save keys:', error.message);
        }
    }

    /**
     * Generate a quick test key for development
     * @returns {object} Generated test key
     */
    generateQuickTestKey() {
        return this.generateAPIKey('test', 'dev-user', {
            purpose: 'development',
            autoGenerated: true
        });
    }

    /**
     * Bulk generate keys for multiple users
     * @param {array} users - Array of user objects
     * @param {string} type - Key type
     * @returns {array} Generated keys
     */
    bulkGenerateKeys(users, type = 'test') {
        const results = [];
        
        users.forEach(user => {
            try {
                const result = this.generateAPIKey(type, user.id, user.metadata || {});
                results.push({
                    userId: user.id,
                    success: true,
                    ...result
                });
            } catch (error) {
                results.push({
                    userId: user.id,
                    success: false,
                    error: error.message
                });
            }
        });

        return results;
    }
}

// CLI Interface
function main() {
    const generator = new ParseatorAPIKeyGenerator();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log(`
Parserator API Key Generator

Usage:
  node api-key-generator.js generate [test|live] [userId]
  node api-key-generator.js validate <apiKey>
  node api-key-generator.js revoke <apiKey>
  node api-key-generator.js list <userId>
  node api-key-generator.js stats <apiKey>
  node api-key-generator.js quick-test

Examples:
  node api-key-generator.js generate test user123
  node api-key-generator.js validate pk_test_abc123...
  node api-key-generator.js quick-test
        `);
        return;
    }

    const command = args[0];

    switch (command) {
        case 'generate':
            const type = args[1] || 'test';
            const userId = args[2] || `user_${Date.now()}`;
            const result = generator.generateAPIKey(type, userId);
            console.log(JSON.stringify(result, null, 2));
            break;

        case 'validate':
            const keyToValidate = args[1];
            if (!keyToValidate) {
                console.error('Please provide an API key to validate');
                return;
            }
            const validation = generator.validateAPIKey(keyToValidate);
            console.log(JSON.stringify(validation, null, 2));
            break;

        case 'revoke':
            const keyToRevoke = args[1];
            if (!keyToRevoke) {
                console.error('Please provide an API key to revoke');
                return;
            }
            const revocation = generator.revokeAPIKey(keyToRevoke);
            console.log(JSON.stringify(revocation, null, 2));
            break;

        case 'list':
            const userIdToList = args[1];
            if (!userIdToList) {
                console.error('Please provide a user ID');
                return;
            }
            const keys = generator.listUserKeys(userIdToList);
            console.log(JSON.stringify(keys, null, 2));
            break;

        case 'stats':
            const keyForStats = args[1];
            if (!keyForStats) {
                console.error('Please provide an API key');
                return;
            }
            const stats = generator.getKeyStats(keyForStats);
            console.log(JSON.stringify(stats, null, 2));
            break;

        case 'quick-test':
            const quickKey = generator.generateQuickTestKey();
            console.log(JSON.stringify(quickKey, null, 2));
            break;

        default:
            console.error('Unknown command:', command);
    }
}

// Export for use as module
module.exports = ParseatorAPIKeyGenerator;

// Run CLI if called directly
if (require.main === module) {
    main();
}