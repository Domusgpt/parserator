/**
 * Background script for Parserator Chrome Extension
 * Handles context menus, keyboard shortcuts, and service worker functionality
 */

// Import services (using importScripts for service worker)
try {
  importScripts('../lib/parserator-service.js', '../lib/storage.js');
} catch (error) {
  console.error('Failed to import scripts:', error);
}

class BackgroundService {
  constructor() {
    this.init();
  }

  async init() {
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize services
    // The new services (parseratorServiceAPI, storageService) are set up when their scripts are imported.
    // parseratorServiceAPI's getApiClient is async and handles internal initialization.
    // storageService's initializeDefaultSchemas was a placeholder, can be called if it exists on self.storageManager
    if (self.storageManager && typeof self.storageManager.initializeDefaultSchemas === 'function') {
      await self.storageManager.initializeDefaultSchemas();
    }
    
    // Create context menus
    this.createContextMenus();
    
    console.log('Parserator background service initialized');
  }

  setupEventListeners() {
    // Extension installation/startup
    chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    chrome.runtime.onStartup.addListener(this.handleStartup.bind(this));

    // Context menu clicks
    chrome.contextMenus.onClicked.addListener(this.handleContextMenuClick.bind(this));

    // Keyboard commands
    chrome.commands.onCommand.addListener(this.handleCommand.bind(this));

    // Messages from content scripts and popup
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Tab updates for auto-detection
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));

    // Side panel handling
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false });
  }

  async handleInstalled(details) {
    if (details.reason === 'install') {
      // First time install
      await this.showWelcomeNotification();
      chrome.runtime.openOptionsPage();
    } else if (details.reason === 'update') {
      // Extension updated
      await this.showUpdateNotification();
    }
  }

  async handleStartup() {
    // Extension started
    // Initialization is handled by the service scripts themselves or on first use.
    // If storageManager has an init function for startup:
    if (self.storageManager && typeof self.storageManager.initializeDefaultSchemas === 'function') {
      await self.storageManager.initializeDefaultSchemas();
    }
  }

  createContextMenus() {
    // Remove existing menus
    chrome.contextMenus.removeAll(() => {
      // Main parse menu
      chrome.contextMenus.create({
        id: 'parse-with-parserator',
        title: 'Parse with Parserator',
        contexts: ['selection'],
        visible: true
      });

      // Quick parse submenu
      chrome.contextMenus.create({
        id: 'quick-parse',
        title: 'Quick Parse (Default Schema)',
        contexts: ['selection'],
        parentId: 'parse-with-parserator'
      });

      // Schema-specific parsing submenu
      chrome.contextMenus.create({
        id: 'parse-with-schema',
        title: 'Parse with Schema...',
        contexts: ['selection'],
        parentId: 'parse-with-parserator'
      });

      // Separator
      chrome.contextMenus.create({
        id: 'separator1',
        type: 'separator',
        contexts: ['selection'],
        parentId: 'parse-with-parserator'
      });

      // Auto-detect and parse
      chrome.contextMenus.create({
        id: 'auto-detect-parse',
        title: 'Auto-detect and Parse',
        contexts: ['selection'],
        parentId: 'parse-with-parserator'
      });

      // Open side panel
      chrome.contextMenus.create({
        id: 'open-sidepanel',
        title: 'Open Parserator Panel',
        contexts: ['page', 'selection']
      });

      // Add dynamic schema menus
      this.addSchemaMenus();
    });
  }

  async addSchemaMenus() {
    const schemas = await self.storageService.listSchemas(); // Use storageService
    const maxMenuItems = 5; // Limit menu items to avoid clutter

    schemas.slice(0, maxMenuItems).forEach((schema, index) => {
      chrome.contextMenus.create({
        id: `schema-${schema.id}`,
        title: schema.name,
        contexts: ['selection'],
        parentId: 'parse-with-schema'
      });
    });

    if (schemas.length > maxMenuItems) {
      chrome.contextMenus.create({
        id: 'more-schemas',
        title: `... and ${schemas.length - maxMenuItems} more`,
        contexts: ['selection'],
        parentId: 'parse-with-schema'
      });
    }
  }

  async handleContextMenuClick(info, tab) {
    const selectedText = info.selectionText;

    switch (info.menuItemId) {
      case 'quick-parse':
        await this.quickParse(selectedText, tab);
        break;

      case 'auto-detect-parse':
        await this.autoDetectAndParse(selectedText, tab);
        break;

      case 'open-sidepanel':
        await this.openSidePanel(tab.id);
        break;

      case 'more-schemas':
        await this.openPopupForSchemaSelection(tab);
        break;

      default:
        if (info.menuItemId.startsWith('schema-')) {
          const schemaId = info.menuItemId.replace('schema-', '');
          await this.parseWithSchema(selectedText, schemaId, tab);
        }
        break;
    }
  }

  async handleCommand(command) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    switch (command) {
      case 'parse-selection':
        await this.parseCurrentSelection(tab);
        break;

      case 'quick-parse':
        await this.quickParseCurrentSelection(tab);
        break;

      case 'toggle-sidepanel':
        await this.toggleSidePanel(tab.id);
        break;
    }
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      switch (message.action) {
        case 'parse-text':
          // message.data should be { text, schema, schemaId?, model?, instructions?, tabUrl?, schemaName? }
          // The handleParseTextMessage was created to encapsulate this logic
          const result = await this.handleParseTextMessage(message.data);
          sendResponse(result); // result is already a ParseResponse like {success, data/error}
          break;

        case 'get-schemas':
          const schemas = await self.storageService.listSchemas();
          sendResponse({ success: true, data: schemas });
          break;

        case 'save-schema':
          // message.data should be UpsertSchemaRequest
          const savedSchema = await self.storageService.saveSchema(message.data);
          await this.updateContextMenus();
          sendResponse({ success: true, data: savedSchema });
          break;

        case 'delete-schema':
          await self.storageService.deleteSchema(message.data.id);
          await this.updateContextMenus();
          sendResponse({ success: true });
          break;

        case 'get-parsed-data':
          // This was not part of the new storageService spec, assuming it's local only for now
          // self.storageManager might still have this from the placeholder storage.js
          const parsedData = await (self.storageManager?.getParsedData ? self.storageManager.getParsedData() : Promise.resolve([]));
          sendResponse({ success: true, data: parsedData });
          break;

        case 'open-sidepanel':
          await this.openSidePanel(sender.tab?.id);
          sendResponse({ success: true });
          break;

        case 'test-connection':
          const isConnected = await self.parseratorServiceAPI.testConnection();
          sendResponse({ success: true, data: isConnected });
          break;

        case 'get-usage':
          // parseratorServiceAPI.getUsage() is mocked in the conceptual service.js
          const usage = await self.parseratorServiceAPI.getUsage();
          sendResponse({ success: true, data: usage });
          break;

        case 'auto-detect-content':
          const detectedData = await this.autoDetectPageContent(sender.tab);
          sendResponse({ success: true, data: detectedData });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Background message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }

    return true; // Keep message channel open for async response
  }

  async handleTabUpdated(tabId, changeInfo, tab) {
    if (changeInfo.status === 'complete' && tab.url) {
      // Assuming general settings are stored under a single 'settings' key or similar by storageService
      const settings = await self.storageService.loadSetting('settings', { autoDetect: false });
      
      if (settings.autoDetect) {
        // Inject content script if needed and trigger auto-detection
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['src/content/content.js']
          });
        } catch (error) {
          // Content script might already be injected
          console.debug('Content script injection skipped:', error);
        }
      }
    }
  }

  async parseCurrentSelection(tab) {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => window.getSelection().toString()
      });

      const selectedText = result.result;
      if (!selectedText) {
        await this.showNotification('No text selected', 'Please select some text to parse.');
        return;
      }

      // Open popup for schema selection
      await this.openPopupForParsing(tab, selectedText);
    } catch (error) {
      await this.showNotification('Error', 'Failed to get selected text: ' + error.message);
    }
  }

  async quickParseCurrentSelection(tab) {
    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => window.getSelection().toString()
      });

      const selectedText = result.result;
      if (!selectedText) {
        await this.showNotification('No text selected', 'Please select some text to parse.');
        return;
      }

      await this.quickParse(selectedText, tab);
    } catch (error) {
      await this.showNotification('Error', 'Failed to parse selection: ' + error.message);
    }
  }

  async quickParse(text, tab) {
    try {
      // Load default schema settings using storageService
      const defaultSchemaSetting = await self.storageService.loadSetting('defaultSchema', { name: 'Default', schema: { text: 'string' } });
      const schemaToUse = defaultSchemaSetting.schema || defaultSchemaSetting; // Ensure we get the schema object
      const schemaName = defaultSchemaSetting.name || 'Default Quick Parse';

      // Call the new parseratorServiceAPI
      const parseResponse = await self.parseratorServiceAPI.parseText(text, schemaToUse); // schemaId and model are undefined
      
      if (parseResponse.success) {
        // Save result using storageManager (if it exists and has saveParsedData)
        if (self.storageManager?.saveParsedData) {
            await self.storageManager.saveParsedData({
            url: tab.url,
            inputData: text,
            outputSchema: schemaToUse,
            parsedData: parseResponse.result, // Use .result from ParseResponse
            schemaUsed: schemaName
          });
        }
        await this.showParseResult(parseResponse, tab, schemaName);
      } else {
        await this.showNotification('Parse Error', parseResponse.error || 'Quick parse failed');
      }
    } catch (error) {
      await this.showNotification('Parse Error', error.message);
    }
  }

  async parseWithSchema(text, schemaId, tab) {
    try {
      const schemaRecord = await self.storageService.getSchema(schemaId);
      if (!schemaRecord || !schemaRecord.schema) {
        throw new Error('Schema not found or is invalid.');
      }

      // Call the new parseratorServiceAPI
      const parseResponse = await self.parseratorServiceAPI.parseText(text, schemaRecord.schema, schemaId);
      
      if (parseResponse.success) {
        if (self.storageManager?.saveParsedData) {
            await self.storageManager.saveParsedData({
            url: tab.url,
            inputData: text,
            outputSchema: schemaRecord.schema,
            parsedData: parseResponse.result, // Use .result
            schemaUsed: schemaRecord.name
          });
        }
        await this.showParseResult(parseResponse, tab, schemaRecord.name);
      } else {
         await this.showNotification('Parse Error', parseResponse.error || `Failed to parse with ${schemaRecord.name}`);
      }
    } catch (error) {
      await this.showNotification('Parse Error', error.message);
    }
  }

  async autoDetectAndParse(text, tab) {
    try {
      let detectedSchemaObject;
      let schemaName = 'Auto-Detected';
      const schemas = await self.storageService.listSchemas();

      // Simplified auto-detection logic (assumes specific schema names or keywords in names)
      if (this.detectContactInfo(text)) {
        const s = schemas.find(s => s.name.toLowerCase().includes('contact'));
        if(s) { detectedSchemaObject = s.schema; schemaName = s.name; }
      } else if (this.detectProductInfo(text)) {
        const s = schemas.find(s => s.name.toLowerCase().includes('product'));
        if(s) { detectedSchemaObject = s.schema; schemaName = s.name; }
      } else if (this.detectEventInfo(text)) {
        const s = schemas.find(s => s.name.toLowerCase().includes('event'));
        if(s) { detectedSchemaObject = s.schema; schemaName = s.name; }
      }
      if (!detectedSchemaObject) { // Fallback if no specific schema was found by keywords
          const defaultSchemaSetting = await self.storageService.loadSetting('defaultSchema', { name: 'Default', schema: { text: 'string' } });
          detectedSchemaObject = defaultSchemaSetting.schema || defaultSchemaSetting;
          schemaName = `Auto-Detect (${defaultSchemaSetting.name || 'Default'})`;
      }

      const parseResponse = await self.parseratorServiceAPI.parseText(text, detectedSchemaObject);
      
      if(parseResponse.success) {
        if (self.storageManager?.saveParsedData) {
            await self.storageManager.saveParsedData({
            url: tab.url,
            inputData: text,
            outputSchema: detectedSchemaObject,
            parsedData: parseResponse.result, // Use .result
            schemaUsed: schemaName
          });
        }
        await this.showParseResult(parseResponse, tab, schemaName);
      } else {
        await this.showNotification('Parse Error', parseResponse.error || 'Auto-detect parse failed');
      }
    } catch (error) {
      await this.showNotification('Parse Error', error.message);
    }
  }

  // This is the direct message handler for 'parse-text' from handleMessage
  async handleParseTextMessage(data) {
    // data = { text, schema, schemaId?, model?, instructions?, tabUrl?, schemaName? }
    // `data.instructions` is not used by parseratorServiceAPI.parseText directly.
    // It should be part of the schema object if needed by the API/model.
    const parseResponse = await self.parseratorServiceAPI.parseText(
      data.text || data.inputData,
      data.schema || data.outputSchema,
      data.schemaId,
      data.model
    );

    if (parseResponse.success && data.tabUrl) {
      if (self.storageManager?.saveParsedData) { // Retain compatibility if saveParsedData exists
        await self.storageManager.saveParsedData({
          url: data.tabUrl,
          inputData: data.text || data.inputData,
          outputSchema: data.schema || data.outputSchema,
          parsedData: parseResponse.result, // Use .result
          // metadata: parseResponse.usage, // Store usage
          schemaUsed: data.schemaName || (data.schemaId ? `SchemaID: ${data.schemaId}` : 'Custom Schema')
        });
      }
    }
    return parseResponse; // This is ParseResponse {success, result?, error?, usage?}
  }

  async showParseResult(parseResp, tab, schemaName = 'Parse') {
    // parseResp is ParseResponse = { success: boolean, result?: object, error?: string, usage?: object }
    const settings = await self.storageService.loadSetting('settings', { autoOpenResults: true, showNotifications: true });
    
    if (settings.autoOpenResults && parseResp.success) {
      await this.openSidePanel(tab.id);
    }
    
    if (settings.showNotifications) {
      if (parseResp.success) {
        const fieldsExtracted = Object.keys(parseResp.result || {}).length;
        await this.showNotification(
          `${schemaName} Complete`,
          `Successfully parsed ${fieldsExtracted} fields. Tokens: ${parseResp.usage?.total_tokens || 'N/A'}.`
        );
      } else {
        await this.showNotification(
          `${schemaName} Failed`,
          parseResp.error || 'An unknown error occurred.'
        );
      }
    }
  }

  async openSidePanel(tabId) {
    try {
      await chrome.sidePanel.open({ tabId });
    } catch (error) {
      console.error('Failed to open side panel:', error);
    }
  }

  async toggleSidePanel(tabId) {
    // Chrome doesn't have a direct toggle, so we'll just open it
    await this.openSidePanel(tabId);
  }

  async openPopupForParsing(tab, selectedText) {
    // Store selected text for popup to access
    await chrome.storage.local.set({
      tempSelectedText: selectedText,
      tempTabUrl: tab.url
    });
    
    // Open popup by simulating action click
    chrome.action.openPopup();
  }

  async openPopupForSchemaSelection(tab) {
    chrome.action.openPopup();
  }

  async updateContextMenus() {
    this.createContextMenus();
  }

  async autoDetectPageContent(tab) {
    // This would analyze the page content for structured data
    // Implementation would depend on specific detection algorithms
    return {
      detectedStructures: [],
      confidence: 0,
      suggestions: []
    };
  }

  // Content detection helpers
  detectContactInfo(text) {
    const emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/;
    const phonePattern = /[\+]?[1-9][\d\s\-\(\)]{8,}/;
    return emailPattern.test(text) || phonePattern.test(text);
  }

  detectProductInfo(text) {
    const pricePattern = /\$[\d,]+\.?\d*/;
    const productKeywords = /\b(product|item|price|buy|purchase|sale)\b/i;
    return pricePattern.test(text) || productKeywords.test(text);
  }

  detectEventInfo(text) {
    const datePattern = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\w+\s+\d{1,2},?\s+\d{2,4}\b/;
    const timePattern = /\b\d{1,2}:\d{2}\s*(AM|PM|am|pm)?\b/;
    const eventKeywords = /\b(event|meeting|conference|workshop|seminar)\b/i;
    return datePattern.test(text) || timePattern.test(text) || eventKeywords.test(text);
  }

  // Notification helpers
  async showNotification(title, message) {
    const settings = await storageManager.getSettings();
    if (settings.showNotifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: '/assets/icons/icon-48.png',
        title: title,
        message: message
      });
    }
  }

  async showWelcomeNotification() {
    await this.showNotification(
      'Welcome to Parserator!',
      'Click the extension icon to get started or configure your API key in settings.'
    );
  }

  async showUpdateNotification() {
    await this.showNotification(
      'Parserator Updated',
      'New features and improvements are now available!'
    );
  }
}

// Initialize background service
const backgroundService = new BackgroundService();