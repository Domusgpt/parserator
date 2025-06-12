// Simple API Key Manager for Parserator
const crypto = require('crypto');
const admin = require('firebase-admin');

class ParseOperatorAPIKeyManager {
  constructor() {
    this.db = admin.firestore();
  }

  // Generate new API key
  generateApiKey(userId, tier = 'free') {
    const prefix = tier === 'production' ? 'pk_live_' : 'pk_test_';
    const keyId = crypto.randomBytes(8).toString('hex');
    const secret = crypto.randomBytes(24).toString('hex');
    const apiKey = prefix + keyId + secret;
    
    return {
      keyId,
      apiKey,
      userId,
      tier,
      createdAt: new Date(),
      active: true,
      usageCount: 0,
      lastUsed: null
    };
  }

  // Save API key to database
  async createApiKey(userId, tier = 'free') {
    const keyData = this.generateApiKey(userId, tier);
    
    await this.db.collection('api_keys').doc(keyData.keyId).set(keyData);
    
    return keyData.apiKey;
  }

  // Validate API key
  async validateApiKey(apiKey) {
    if (!apiKey || !apiKey.startsWith('pk_')) {
      return { valid: false, error: 'Invalid API key format' };
    }

    const keyId = apiKey.substring(8, 24); // Extract key ID
    const keyDoc = await this.db.collection('api_keys').doc(keyId).get();
    
    if (!keyDoc.exists) {
      return { valid: false, error: 'API key not found' };
    }

    const keyData = keyDoc.data();
    
    if (!keyData.active) {
      return { valid: false, error: 'API key deactivated' };
    }

    // Update usage stats
    await this.db.collection('api_keys').doc(keyId).update({
      usageCount: admin.firestore.FieldValue.increment(1),
      lastUsed: new Date()
    });

    return { 
      valid: true, 
      userId: keyData.userId,
      tier: keyData.tier,
      keyData 
    };
  }

  // Create initial API key for CrystalGrimoire
  async createCrystalGrimoireKey() {
    const crystalGrimoireUserId = 'crystal_grimoire_production';
    const apiKey = await this.createApiKey(crystalGrimoireUserId, 'production');
    
    console.log('🔮 CrystalGrimoire API Key Generated:');
    console.log('PARSERATOR_API_KEY=' + apiKey);
    console.log('');
    console.log('Add this to your environment variables:');
    console.log('export PARSERATOR_API_KEY="' + apiKey + '"');
    
    return apiKey;
  }
}

// Usage
const keyManager = new ParseOperatorAPIKeyManager();

// Generate key for CrystalGrimoire
keyManager.createCrystalGrimoireKey()
  .then(key => {
    console.log('✅ API Key created successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Error creating API key:', error);
    process.exit(1);
  });

module.exports = ParseOperatorAPIKeyManager;