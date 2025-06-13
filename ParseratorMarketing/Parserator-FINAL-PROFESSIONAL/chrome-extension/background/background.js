// Parserator Chrome Extension - Background Service Worker
// Handles extension lifecycle, context menus, and keyboard shortcuts

// Extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Parserator extension installed/updated:', details.reason);
  
  // Create context menus
  createContextMenus();
  
  // Set up default settings
  if (details.reason === 'install') {
    setDefaultSettings();
  }
  
  // Open welcome page on first install
  if (details.reason === 'install') {
    chrome.tabs.create({
      url: 'https://parserator.com/chrome-extension-welcome'
    });
  }
});

// Create context menus
function createContextMenus() {
  // Remove existing menus
  chrome.contextMenus.removeAll(() => {
    // Parse selection menu
    chrome.contextMenus.create({
      id: 'parseSelection',
      title: 'Parse with Parserator',
      contexts: ['selection'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
    
    // Parse page menu
    chrome.contextMenus.create({
      id: 'parsePage',
      title: 'Parse entire page',
      contexts: ['page'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
    
    // Parse element menu
    chrome.contextMenus.create({
      id: 'parseElement',
      title: 'Parse this element',
      contexts: ['all'],
      documentUrlPatterns: ['http://*/*', 'https://*/*']
    });
    
    // Separator
    chrome.contextMenus.create({
      id: 'separator1',
      type: 'separator',
      contexts: ['all']
    });
    
    // Template submenu
    chrome.contextMenus.create({
      id: 'useTemplate',
      title: 'Use template',
      contexts: ['selection', 'page']
    });
    
    // Open side panel menu
    chrome.contextMenus.create({
      id: 'openSidePanel',
      title: 'Open Parserator panel',
      contexts: ['all']
    });
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  try {
    switch (info.menuItemId) {
      case 'parseSelection':
        await handleParseSelection(info, tab);
        break;
        
      case 'parsePage':
        await handleParsePage(info, tab);
        break;
        
      case 'parseElement':
        await handleParseElement(info, tab);
        break;
        
      case 'openSidePanel':
        await openSidePanel(tab);
        break;
        
      default:
        if (info.menuItemId.startsWith('template_')) {
          await handleUseTemplate(info, tab);
        }
    }
  } catch (error) {
    console.error('Context menu action failed:', error);
    showNotification('Parsing failed', error.message);
  }
});

// Handle parse selection
async function handleParseSelection(info, tab) {
  if (!info.selectionText) {
    showNotification('No selection', 'Please select some text first');
    return;
  }
  
  // Open side panel with selection data
  await openSidePanel(tab);
  
  // Send selection to side panel
  setTimeout(() => {
    chrome.runtime.sendMessage({
      action: 'parseText',
      text: info.selectionText,
      context: 'context_menu_selection',
      url: tab.url
    });
  }, 500);
}

// Handle parse page
async function handleParsePage(info, tab) {
  // Get page content
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      return document.body.innerText || document.body.textContent || '';
    }
  });
  
  if (!result.result) {
    showNotification('No content', 'No content found on this page');
    return;
  }
  
  // Open side panel with page data
  await openSidePanel(tab);
  
  // Send page content to side panel
  setTimeout(() => {
    chrome.runtime.sendMessage({
      action: 'parseText',
      text: result.result,
      context: 'context_menu_page',
      url: tab.url,
      title: tab.title
    });
  }, 500);
}

// Handle parse element
async function handleParseElement(info, tab) {
  // This would require more complex element detection
  // For now, open the popup for manual selection
  chrome.action.openPopup();
}

// Handle use template
async function handleUseTemplate(info, tab) {
  const templateId = info.menuItemId.replace('template_', '');
  
  // Get content based on context
  let content = '';
  if (info.selectionText) {
    content = info.selectionText;
  } else {
    // Get page content
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => document.body.innerText || ''
    });
    content = result.result;
  }
  
  if (!content) {
    showNotification('No content', 'No content to parse');
    return;
  }
  
  // Use template to parse content
  try {
    const result = await parseWithTemplate(content, templateId);
    
    // Show results in side panel
    await openSidePanel(tab);
    
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'showResults',
        results: result,
        templateId: templateId
      });
    }, 500);
    
  } catch (error) {
    showNotification('Template parsing failed', error.message);
  }
}

// Open side panel
async function openSidePanel(tab) {
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (error) {
    console.error('Failed to open side panel:', error);
    // Fallback to popup
    chrome.action.openPopup();
  }
}

// Parse with template
async function parseWithTemplate(content, templateId) {
  const apiKey = await getApiKey();
  
  const response = await fetch(`https://app-5108296280.us-central1.run.app/v1/run/${templateId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      inputData: content
    })
  });
  
  if (!response.ok) {
    throw new Error(`Template parsing failed: ${response.status}`);
  }
  
  const result = await response.json();
  return result.parsedData;
}

// Get API key from storage
async function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['parserator_api_key'], (result) => {
      if (result.parserator_api_key) {
        resolve(result.parserator_api_key);
      } else {
        reject(new Error('No API key configured'));
      }
    });
  });
}

// Handle keyboard commands
chrome.commands.onCommand.addListener(async (command, tab) => {
  try {
    switch (command) {
      case 'parse-selection':
        await handleKeyboardParseSelection(tab);
        break;
        
      case 'open-sidepanel':
        await openSidePanel(tab);
        break;
        
      case 'quick-parse':
        await handleQuickParse(tab);
        break;
    }
  } catch (error) {
    console.error('Keyboard command failed:', error);
    showNotification('Command failed', error.message);
  }
});

// Handle keyboard parse selection
async function handleKeyboardParseSelection(tab) {
  // Get selected text
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => window.getSelection().toString()
  });
  
  if (!result.result) {
    showNotification('No selection', 'Please select some text first');
    return;
  }
  
  // Open side panel and parse
  await openSidePanel(tab);
  
  setTimeout(() => {
    chrome.runtime.sendMessage({
      action: 'parseText',
      text: result.result,
      context: 'keyboard_selection',
      url: tab.url
    });
  }, 500);
}

// Handle quick parse (auto-detect best content)
async function handleQuickParse(tab) {
  // Get main content using content script
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content/content.js']
  });
  
  // Send message to get page content
  const response = await chrome.tabs.sendMessage(tab.id, {
    action: 'getPageContent'
  });
  
  if (!response.content) {
    showNotification('No content', 'No content found on this page');
    return;
  }
  
  // Open side panel and parse with auto schema
  await openSidePanel(tab);
  
  setTimeout(() => {
    chrome.runtime.sendMessage({
      action: 'parseText',
      text: response.content,
      context: 'quick_parse',
      url: tab.url,
      title: tab.title,
      autoSchema: true
    });
  }, 500);
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'pageLoaded':
      handlePageLoaded(message, sender);
      break;
      
    case 'parseSelectedElement':
      handleParseSelectedElement(message, sender);
      break;
      
    case 'getTemplates':
      getAvailableTemplates().then(sendResponse);
      return true; // Keep channel open for async response
      
    case 'updateBadge':
      updateBadge(message.text, sender.tab.id);
      break;
      
    case 'showNotification':
      showNotification(message.title, message.message);
      break;
  }
});

// Handle page loaded
function handlePageLoaded(message, sender) {
  // Update badge based on page content
  if (message.structuredDataTypes.length > 0) {
    updateBadge(message.structuredDataTypes.length.toString(), sender.tab.id);
  }
  
  // Update context menus with page-specific options
  updateContextMenusForPage(message, sender.tab);
}

// Handle parse selected element
async function handleParseSelectedElement(message, sender) {
  try {
    // Open side panel
    await openSidePanel(sender.tab);
    
    // Send element data to side panel
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'parseText',
        text: message.content,
        context: 'element_selection',
        url: message.url,
        selector: message.selector
      });
    }, 500);
    
  } catch (error) {
    console.error('Failed to parse selected element:', error);
    showNotification('Element parsing failed', error.message);
  }
}

// Get available templates
async function getAvailableTemplates() {
  try {
    const apiKey = await getApiKey();
    
    const response = await fetch('https://app-5108296280.us-central1.run.app/v1/templates', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      const templates = await response.json();
      return templates;
    } else {
      return [];
    }
  } catch (error) {
    console.error('Failed to get templates:', error);
    return [];
  }
}

// Update context menus for specific page
async function updateContextMenusForPage(pageInfo, tab) {
  // Add template-specific menus if templates are available
  try {
    const templates = await getAvailableTemplates();
    
    if (templates.length > 0) {
      // Remove existing template menus
      chrome.contextMenus.removeAll(() => {
        createContextMenus();
        
        // Add template options
        templates.slice(0, 5).forEach((template, index) => {
          chrome.contextMenus.create({
            id: `template_${template.id}`,
            title: template.name || `Template ${index + 1}`,
            parentId: 'useTemplate',
            contexts: ['selection', 'page']
          });
        });
      });
    }
  } catch (error) {
    console.error('Failed to update context menus:', error);
  }
}

// Update extension badge
function updateBadge(text, tabId) {
  chrome.action.setBadgeText({
    text: text,
    tabId: tabId
  });
  
  chrome.action.setBadgeBackgroundColor({
    color: '#667eea'
  });
}

// Show notification
function showNotification(title, message) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-48.png',
    title: title,
    message: message
  });
}

// Set default settings on install
function setDefaultSettings() {
  const defaultSettings = {
    auto_export: false,
    accuracy_threshold: 0.8,
    default_schema: 'auto',
    notifications_enabled: true,
    keyboard_shortcuts_enabled: true
  };
  
  chrome.storage.sync.set(defaultSettings, () => {
    console.log('Default settings applied');
  });
}

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
  console.log('Parserator extension started');
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Inject content script if needed
    if (tab.url.startsWith('http')) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content/content.js']
      }).catch(() => {
        // Content script already injected or failed
      });
    }
  }
});

// Cleanup on extension suspend
chrome.runtime.onSuspend.addListener(() => {
  console.log('Parserator extension suspended');
});