// Parserator Chrome Extension - Content Script
// Handles page content extraction and selection detection

(function() {
  'use strict';
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case 'getSelectedText':
        sendResponse({
          text: getSelectedText(),
          url: window.location.href
        });
        break;
        
      case 'getPageContent':
        sendResponse({
          content: getPageContent(),
          url: window.location.href,
          title: document.title
        });
        break;
        
      case 'highlightElement':
        highlightElement(request.selector);
        sendResponse({success: true});
        break;
        
      case 'parseElement':
        const elementContent = getElementContent(request.selector);
        sendResponse({
          content: elementContent,
          selector: request.selector
        });
        break;
        
      default:
        sendResponse({error: 'Unknown action'});
    }
    
    return true; // Keep message channel open for async response
  });
  
  // Get currently selected text
  function getSelectedText() {
    const selection = window.getSelection();
    return selection.toString().trim();
  }
  
  // Get main page content (intelligently extracted)
  function getPageContent() {
    // Try to find main content areas
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      '#main',
      '.post-content',
      '.entry-content',
      '.article-content'
    ];
    
    let content = '';
    
    // Try each selector to find main content
    for (const selector of contentSelectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = extractTextContent(element);
        if (content.length > 100) { // Must have substantial content
          break;
        }
      }
    }
    
    // Fallback to body content if no main content found
    if (!content || content.length < 100) {
      content = extractTextContent(document.body);
    }
    
    return cleanText(content);
  }
  
  // Extract text content from element
  function extractTextContent(element) {
    if (!element) return '';
    
    // Clone element to avoid modifying original
    const clone = element.cloneNode(true);
    
    // Remove unwanted elements
    const unwantedSelectors = [
      'script',
      'style',
      'nav',
      'header',
      'footer',
      '.advertisement',
      '.ads',
      '.sidebar',
      '.menu',
      '.navigation',
      '.breadcrumb',
      '.social-share',
      '.comments',
      '.related-posts'
    ];
    
    unwantedSelectors.forEach(selector => {
      const elements = clone.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Extract text with some structure preservation
    return extractStructuredText(clone);
  }
  
  // Extract structured text with basic formatting
  function extractStructuredText(element) {
    let text = '';
    
    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const textContent = node.textContent.trim();
        if (textContent) {
          text += textContent + ' ';
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        // Add line breaks for block elements
        if (['div', 'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tagName)) {
          if (text && !text.endsWith('\n')) {
            text += '\n';
          }
        }
        
        // Process child nodes
        for (const child of node.childNodes) {
          processNode(child);
        }
        
        // Add line breaks after block elements
        if (['div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'ul', 'ol'].includes(tagName)) {
          text += '\n';
        }
      }
    }
    
    processNode(element);
    return text;
  }
  
  // Clean extracted text
  function cleanText(text) {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n') // Remove multiple line breaks
      .trim();
  }
  
  // Get content from specific element
  function getElementContent(selector) {
    try {
      const element = document.querySelector(selector);
      if (element) {
        return extractTextContent(element);
      }
      return '';
    } catch (error) {
      console.error('Error getting element content:', error);
      return '';
    }
  }
  
  // Highlight element on page
  function highlightElement(selector) {
    try {
      // Remove previous highlights
      document.querySelectorAll('.parserator-highlight').forEach(el => {
        el.classList.remove('parserator-highlight');
      });
      
      // Add highlight to target element
      const element = document.querySelector(selector);
      if (element) {
        element.classList.add('parserator-highlight');
        element.scrollIntoView({behavior: 'smooth', block: 'center'});
      }
    } catch (error) {
      console.error('Error highlighting element:', error);
    }
  }
  
  // Add CSS for highlighting
  function addHighlightStyles() {
    if (!document.getElementById('parserator-styles')) {
      const style = document.createElement('style');
      style.id = 'parserator-styles';
      style.textContent = `
        .parserator-highlight {
          outline: 3px solid #667eea !important;
          outline-offset: 2px !important;
          background-color: rgba(102, 126, 234, 0.1) !important;
          transition: all 0.3s ease !important;
        }
        
        .parserator-selector-hint {
          position: absolute;
          background: #667eea;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-family: monospace;
          z-index: 10000;
          pointer-events: none;
          transform: translate(-50%, -100%);
          margin-top: -8px;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  // Smart element selection for parsing
  function initializeSmartSelection() {
    let isSelectionMode = false;
    let hoverElement = null;
    
    // Listen for keyboard shortcut to enter selection mode
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+S to enter selection mode
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        toggleSelectionMode();
      }
      
      // Escape to exit selection mode
      if (e.key === 'Escape' && isSelectionMode) {
        exitSelectionMode();
      }
    });
    
    function toggleSelectionMode() {
      isSelectionMode = !isSelectionMode;
      
      if (isSelectionMode) {
        document.body.style.cursor = 'crosshair';
        showSelectionHint('Click an element to parse its content');
      } else {
        exitSelectionMode();
      }
    }
    
    function exitSelectionMode() {
      isSelectionMode = false;
      document.body.style.cursor = '';
      hideSelectionHint();
      
      if (hoverElement) {
        hoverElement.classList.remove('parserator-highlight');
        hoverElement = null;
      }
    }
    
    // Mouse events for element selection
    document.addEventListener('mouseover', (e) => {
      if (!isSelectionMode) return;
      
      if (hoverElement) {
        hoverElement.classList.remove('parserator-highlight');
      }
      
      hoverElement = e.target;
      hoverElement.classList.add('parserator-highlight');
    });
    
    document.addEventListener('click', (e) => {
      if (!isSelectionMode) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      const selector = generateSelector(e.target);
      const content = getElementContent(selector);
      
      // Send to popup for parsing
      chrome.runtime.sendMessage({
        action: 'parseSelectedElement',
        selector: selector,
        content: content,
        url: window.location.href
      });
      
      exitSelectionMode();
    });
  }
  
  // Generate unique CSS selector for element
  function generateSelector(element) {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.trim());
      if (classes.length > 0) {
        return `.${classes.join('.')}`;
      }
    }
    
    // Fallback to tag + position
    const parent = element.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(element);
      return `${element.tagName.toLowerCase()}:nth-child(${index + 1})`;
    }
    
    return element.tagName.toLowerCase();
  }
  
  // Show selection hint
  function showSelectionHint(message) {
    const hint = document.createElement('div');
    hint.id = 'parserator-selection-hint';
    hint.textContent = message;
    hint.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #667eea;
      color: white;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 14px;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      z-index: 10000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    `;
    document.body.appendChild(hint);
  }
  
  // Hide selection hint
  function hideSelectionHint() {
    const hint = document.getElementById('parserator-selection-hint');
    if (hint) {
      hint.remove();
    }
  }
  
  // Detect if page has structured data
  function detectStructuredData() {
    const structuredDataTypes = [];
    
    // Check for common data patterns
    if (document.querySelector('table')) {
      structuredDataTypes.push('table');
    }
    
    if (document.querySelector('[itemtype]')) {
      structuredDataTypes.push('microdata');
    }
    
    if (document.querySelector('script[type="application/ld+json"]')) {
      structuredDataTypes.push('json-ld');
    }
    
    if (document.querySelector('.product, .listing, .recipe')) {
      structuredDataTypes.push('product');
    }
    
    if (document.querySelector('article, .post, .blog-post')) {
      structuredDataTypes.push('article');
    }
    
    return structuredDataTypes;
  }
  
  // Extract structured data from page
  function extractStructuredData() {
    const data = {};
    
    // Extract JSON-LD
    const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
    if (jsonLdScripts.length > 0) {
      data.jsonLd = [];
      jsonLdScripts.forEach(script => {
        try {
          data.jsonLd.push(JSON.parse(script.textContent));
        } catch (e) {
          console.warn('Invalid JSON-LD:', e);
        }
      });
    }
    
    // Extract meta tags
    data.meta = {};
    document.querySelectorAll('meta[property], meta[name]').forEach(meta => {
      const key = meta.getAttribute('property') || meta.getAttribute('name');
      const value = meta.getAttribute('content');
      if (key && value) {
        data.meta[key] = value;
      }
    });
    
    // Extract microdata
    const microdataElements = document.querySelectorAll('[itemtype]');
    if (microdataElements.length > 0) {
      data.microdata = [];
      microdataElements.forEach(element => {
        data.microdata.push({
          type: element.getAttribute('itemtype'),
          properties: extractMicrodataProperties(element)
        });
      });
    }
    
    return data;
  }
  
  // Extract microdata properties
  function extractMicrodataProperties(element) {
    const properties = {};
    
    element.querySelectorAll('[itemprop]').forEach(propElement => {
      const propName = propElement.getAttribute('itemprop');
      let propValue = propElement.getAttribute('content') || 
                     propElement.getAttribute('datetime') ||
                     propElement.textContent.trim();
      
      if (properties[propName]) {
        if (!Array.isArray(properties[propName])) {
          properties[propName] = [properties[propName]];
        }
        properties[propName].push(propValue);
      } else {
        properties[propName] = propValue;
      }
    });
    
    return properties;
  }
  
  // Initialize content script
  function initialize() {
    addHighlightStyles();
    initializeSmartSelection();
    
    // Send page info to extension
    chrome.runtime.sendMessage({
      action: 'pageLoaded',
      url: window.location.href,
      title: document.title,
      structuredDataTypes: detectStructuredData(),
      hasSelection: getSelectedText().length > 0
    });
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
  
})();