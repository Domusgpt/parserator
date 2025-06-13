// Parserator Chrome Extension - Popup Interface
// Production Ready - Available Now

document.addEventListener('DOMContentLoaded', function() {
  // Initialize popup interface
  initializePopup();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load user settings
  loadUserSettings();
});

// Initialize popup interface
function initializePopup() {
  // Check if user has API key configured
  chrome.storage.sync.get(['parserator_api_key'], function(result) {
    if (!result.parserator_api_key) {
      showApiKeyPrompt();
    }
  });
  
  // Update UI based on current tab
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    updateUIForCurrentTab(tabs[0]);
  });
}

// Set up event listeners
function setupEventListeners() {
  // Parse buttons
  document.getElementById('parseSelection').addEventListener('click', handleParseSelection);
  document.getElementById('parseFullPage').addEventListener('click', handleParseFullPage);
  
  // Schema selection
  document.getElementById('schemaSelect').addEventListener('change', handleSchemaChange);
  
  // Export button
  document.getElementById('exportResults').addEventListener('click', handleExportResults);
  
  // Footer links
  document.getElementById('openSettings').addEventListener('click', openSettingsPage);
  document.getElementById('openSidePanel').addEventListener('click', openSidePanel);
}

// Load user settings
function loadUserSettings() {
  chrome.storage.sync.get([
    'parserator_api_key',
    'default_schema',
    'auto_export',
    'accuracy_threshold'
  ], function(result) {
    if (result.default_schema) {
      document.getElementById('schemaSelect').value = result.default_schema;
      handleSchemaChange();
    }
  });
}

// Handle parse selection
async function handleParseSelection() {
  try {
    showLoading('Extracting selected text...');
    
    // Get selected text from content script
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      action: 'getSelectedText'
    });
    
    if (!response.text || response.text.trim() === '') {
      showError('No text selected. Please select some text on the page first.');
      return;
    }
    
    // Parse the selected text
    const schema = getSelectedSchema();
    const result = await parseTextWithAPI(response.text, schema, 'selection_parsing');
    
    if (result.success) {
      showResults(result.data, result.confidence);
    } else {
      showError(result.error || 'Failed to parse selected text');
    }
    
  } catch (error) {
    console.error('Parse selection error:', error);
    showError('Failed to parse selection: ' + error.message);
  }
}

// Handle parse full page
async function handleParseFullPage() {
  try {
    showLoading('Extracting page content...');
    
    // Get page content from content script
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    const response = await chrome.tabs.sendMessage(tabs[0].id, {
      action: 'getPageContent'
    });
    
    if (!response.content || response.content.trim() === '') {
      showError('No content found on this page.');
      return;
    }
    
    // Parse the page content
    const schema = getSelectedSchema();
    const result = await parseTextWithAPI(response.content, schema, 'full_page_parsing');
    
    if (result.success) {
      showResults(result.data, result.confidence);
    } else {
      showError(result.error || 'Failed to parse page content');
    }
    
  } catch (error) {
    console.error('Parse full page error:', error);
    showError('Failed to parse page: ' + error.message);
  }
}

// Handle schema selection change
function handleSchemaChange() {
  const select = document.getElementById('schemaSelect');
  const customSection = document.getElementById('customSchemaSection');
  
  if (select.value === 'custom') {
    customSection.classList.remove('hidden');
  } else {
    customSection.classList.add('hidden');
  }
}

// Get selected schema
function getSelectedSchema() {
  const select = document.getElementById('schemaSelect');
  const schemaType = select.value;
  
  if (schemaType === 'custom') {
    try {
      const customSchemaText = document.getElementById('customSchema').value;
      return JSON.parse(customSchemaText);
    } catch (error) {
      throw new Error('Invalid custom schema JSON');
    }
  }
  
  // Predefined schemas
  const schemas = {
    auto: {
      title: 'string',
      content: 'string',
      entities: ['string'],
      key_points: ['string']
    },
    contact: {
      name: 'string',
      email: 'string',
      phone: 'string',
      company: 'string',
      title: 'string',
      address: 'string'
    },
    product: {
      name: 'string',
      price: 'string',
      description: 'string',
      features: ['string'],
      availability: 'string',
      rating: 'string'
    },
    article: {
      title: 'string',
      author: 'string',
      date: 'string',
      content: 'string',
      summary: 'string',
      tags: ['string']
    },
    table: {
      headers: ['string'],
      rows: [['string']],
      summary: 'string'
    }
  };
  
  return schemas[schemaType] || schemas.auto;
}

// Parse text with Parserator API
async function parseTextWithAPI(text, schema, context) {
  try {
    const apiKey = await getApiKey();
    
    const response = await fetch('https://app-5108296280.us-central1.run.app/v1/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputData: text,
        outputSchema: schema,
        context: context
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        data: result.parsedData,
        confidence: result.metadata?.confidence || 0.95,
        tokensUsed: result.metadata?.tokensUsed || 0
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: `API Error ${response.status}: ${errorText}`
      };
    }
    
  } catch (error) {
    return {
      success: false,
      error: 'Network error: ' + error.message
    };
  }
}

// Get API key from storage
function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['parserator_api_key'], function(result) {
      if (result.parserator_api_key) {
        resolve(result.parserator_api_key);
      } else {
        reject(new Error('No API key configured'));
      }
    });
  });
}

// Show loading state
function showLoading(message) {
  hideAllSections();
  document.getElementById('loadingSection').classList.remove('hidden');
  if (message) {
    document.querySelector('#loadingSection p').textContent = message;
  }
}

// Show results
function showResults(data, confidence) {
  hideAllSections();
  
  const resultsSection = document.getElementById('resultsSection');
  const accuracyBadge = document.getElementById('accuracyScore');
  const resultsOutput = document.getElementById('resultsOutput');
  
  resultsSection.classList.remove('hidden');
  
  // Update accuracy badge
  const accuracyPercent = Math.round(confidence * 100);
  accuracyBadge.textContent = `${accuracyPercent}% Accuracy`;
  
  // Color code accuracy
  if (accuracyPercent >= 90) {
    accuracyBadge.style.background = '#48bb78'; // Green
  } else if (accuracyPercent >= 75) {
    accuracyBadge.style.background = '#ed8936'; // Orange
  } else {
    accuracyBadge.style.background = '#e53e3e'; // Red
  }
  
  // Display results
  resultsOutput.textContent = JSON.stringify(data, null, 2);
  
  // Store results for export
  window.currentResults = data;
}

// Show error
function showError(message) {
  hideAllSections();
  
  const errorSection = document.getElementById('errorSection');
  const errorText = document.getElementById('errorText');
  
  errorSection.classList.remove('hidden');
  errorText.textContent = message;
}

// Hide all sections
function hideAllSections() {
  document.getElementById('loadingSection').classList.add('hidden');
  document.getElementById('resultsSection').classList.add('hidden');
  document.getElementById('errorSection').classList.add('hidden');
}

// Handle export results
function handleExportResults() {
  if (!window.currentResults) {
    showError('No results to export');
    return;
  }
  
  const dataStr = JSON.stringify(window.currentResults, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `parserator-results-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Open settings page
function openSettingsPage() {
  chrome.runtime.openOptionsPage();
}

// Open side panel
function openSidePanel() {
  chrome.sidePanel.open({windowId: chrome.windows.WINDOW_ID_CURRENT});
}

// Update UI for current tab
function updateUIForCurrentTab(tab) {
  // Check if we can access this tab
  if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
    showError('Cannot parse Chrome internal pages');
    return;
  }
  
  // Inject content script if needed
  chrome.scripting.executeScript({
    target: {tabId: tab.id},
    files: ['content/content.js']
  }).catch(error => {
    console.log('Content script already injected or failed:', error);
  });
}

// Show API key prompt
function showApiKeyPrompt() {
  const apiKey = prompt('Please enter your Parserator API key:\n\nGet your free key at https://parserator.com');
  
  if (apiKey && apiKey.trim()) {
    chrome.storage.sync.set({
      parserator_api_key: apiKey.trim()
    }, function() {
      console.log('API key saved');
    });
  }
}

// Check if API key is valid
async function validateApiKey(apiKey) {
  try {
    const response = await fetch('https://app-5108296280.us-central1.run.app/v1/parse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputData: 'test',
        outputSchema: {test: 'string'},
        context: 'validation'
      })
    });
    
    return response.status !== 401;
  } catch (error) {
    return false;
  }
}

// Initialize context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'parseSelection',
    title: 'Parse with Parserator',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'parseSelection') {
    // Open popup or side panel for parsing
    chrome.action.openPopup();
  }
});