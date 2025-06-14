# Chrome Extension - Claude Guidelines

## Current Status: READY FOR SUBMISSION ✅

### Built Files
- `parserator-chrome-extension-v1.0.0.zip` (ready for Chrome Web Store)
- `parserator-chrome-extension-v1.0.1.zip` (latest version)
- Complete manifest.json with Manifest V3 compliance
- All required icons and screenshots generated

### Store Submission Status
- **Packaging**: ✅ Complete
- **Screenshots**: ✅ 4 professional screenshots ready
- **Icons**: ✅ All sizes (16x16, 32x32, 48x48, 128x128)
- **Documentation**: ✅ Complete submission guide ready
- **Privacy Policy**: ✅ Available at parserator.com/privacy

## Technical Architecture

### Manifest V3 Compliance
- Service worker background script (not background page)
- Content scripts for page interaction
- Popup interface for primary functionality
- Side panel for advanced features
- Context menus for right-click parsing

### Key Features
- **Right-click parsing**: Parse selected text from any webpage
- **Popup interface**: Manual text input and parsing
- **Side panel**: Advanced schema management
- **Keyboard shortcuts**: Ctrl+Shift+P for quick parsing
- **Settings page**: API key configuration

### Security & Permissions
- **Storage**: Save user preferences and API keys
- **ActiveTab**: Access current page content
- **ContextMenus**: Right-click functionality
- **Scripting**: Content script injection
- **Host permissions**: API calls to Parserator backend

## Submission Requirements

### Chrome Web Store Information
```
Name: Parserator - AI-Powered Text Parser
Category: Productivity
Website: https://parserator.com
Support Email: Gen-rl-millz@parserator.com
Privacy Policy: https://parserator.com/privacy
```

### Description Template (Ready)
Complete store description emphasizing:
- Revolutionary Architect-Extractor pattern
- 95% accuracy with 70% cost reduction
- EMA compliance and data sovereignty
- Right-click parsing functionality
- Developer and data team focus

### Files Ready for Upload
- Extension package: Latest .zip file
- Screenshots: 4 professional images
- Promotional images: Icon sets and marketing tiles

## Development Guidelines

### Code Standards
- **Manifest V3**: Use service workers, not background pages
- **Security**: Never expose API keys in content scripts
- **Performance**: Minimize content script weight
- **Privacy**: Local processing where possible

### Testing Checklist
- Right-click context menu appears
- Popup parsing works with various inputs
- Side panel opens and functions
- Settings save and persist
- API calls work with valid keys
- Error handling for invalid keys/network issues

### EMA Compliance Features
- **Export functionality**: Users can export all parsed data
- **Settings export**: Configuration backup capability
- **No data retention**: Clear privacy practices
- **Migration tools**: Easy switching to competitors

## Immediate Actions Needed

### Chrome Web Store Submission
1. Go to: https://chrome.google.com/webstore/devconsole
2. Upload: `parserator-chrome-extension-v1.0.1.zip`
3. Use prepared description and screenshots
4. Set category: Productivity
5. Submit for review

### Post-Submission
- Monitor review status (1-3 business days)
- Respond to any reviewer feedback
- Plan marketing launch when approved
- Update documentation with store link

## Success Metrics
- **Week 1**: 100+ installs
- **Month 1**: 1,000+ installs
- **Rating**: Maintain 4.5+ stars
- **Reviews**: Active user feedback and support

## Common Issues to Avoid
- Overly broad permissions (already optimized)
- Unclear value proposition (description is clear)
- Missing privacy policy (already created)
- Poor screenshots (professional ones ready)

## Remember
- Extension is production-ready NOW
- All submission materials are prepared
- EMA principles are integrated throughout
- Focus on developer and data team users