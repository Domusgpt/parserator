# Contributing to Parserator

We love your input! We want to make contributing to Parserator as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## 🎯 Our Philosophy: EMA First

Parserator is built on **Exoditical Moral Architecture** principles. Every contribution should advance:
- **Digital Sovereignty**: User ownership of data and workflows
- **Portability**: Seamless migration and export capabilities
- **Universal Standards**: Open protocols and formats
- **Transparent Competition**: Honest comparison and integration

## 🚀 Quick Start for Contributors

### 1. Set Up Development Environment
```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/parserator.git
cd parserator

# Install dependencies
npm install

# Set up your development API key
cp .env.example .env
# Add your development API key to .env
```

### 2. Run Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:examples
```

### 3. Make Your Changes
```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... code changes ...

# Test your changes
npm test
npm run lint
npm run build

# Commit your changes
git commit -m "feat: add your feature description"
```

## 🐛 Bug Reports

Great bug reports are extremely helpful! Use our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

### Before You Submit
- Check if the bug has already been reported
- Try to isolate the issue to a minimal test case
- Include specific version information

### What to Include
- **Clear description** of the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Environment details** (OS, Node version, etc.)
- **Sample data** that demonstrates the issue
- **Error messages** and stack traces

## 💡 Feature Requests

We actively welcome feature suggestions! Use our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md).

### EMA-Aligned Features
Priority is given to features that enhance:
- **User autonomy** and control
- **Data portability** and export
- **Framework interoperability**
- **Transparent operations**

### Include in Your Request
- **Clear use case** description
- **Expected behavior** and benefits
- **Alternative solutions** considered
- **Framework compatibility** requirements
- **EMA compliance** considerations

## 🔧 Code Contributions

### Pull Request Process

1. **Fork the repository** and create your branch from `main`
2. **Add tests** for any new functionality
3. **Update documentation** for any changes
4. **Ensure all tests pass** and linting is clean
5. **Update CHANGELOG.md** with your changes
6. **Submit your pull request**

### Code Style

We use automated formatting and linting:

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run type-check
```

### Commit Messages

We follow [Conventional Commits](https://conventionalcommits.org/):

```
feat: add support for new schema validation
fix: resolve parsing error with nested objects
docs: update integration guide for LangChain
test: add unit tests for batch processing
```

### Testing Requirements

- **Unit tests** for all new functions
- **Integration tests** for API endpoints
- **Example tests** for framework integrations
- **Documentation tests** to ensure examples work

## 📚 Documentation

### What Needs Documentation
- **API changes** and new endpoints
- **Integration guides** for new frameworks
- **Example code** with working samples
- **Configuration options** and their effects
- **Migration guides** for breaking changes

### Documentation Standards
- **Clear examples** with copy-paste code
- **Real-world use cases** not toy examples
- **Error handling** and troubleshooting
- **Performance considerations** when relevant
- **EMA compliance** explanations

## 🔐 Security

### Reporting Security Issues
**DO NOT** open public issues for security vulnerabilities.

Email security issues to: [Gen-rl-millz@parserator.com](mailto:Gen-rl-millz@parserator.com)

Include:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact assessment
- Suggested fixes (if any)

### Security Guidelines
- **Never commit** API keys, tokens, or credentials
- **Sanitize user input** in all examples
- **Follow OWASP** security best practices
- **Document security** considerations for integrations

## 🌍 Community

### Code of Conduct
- **Be respectful** and inclusive
- **Focus on what's best** for the community
- **Use welcoming** and inclusive language
- **Be collaborative** and constructive
- **Respect different viewpoints** and experiences

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community chat
- **Discord**: [Join our community](https://discord.gg/parserator) for real-time chat
- **Email**: [Gen-rl-millz@parserator.com](mailto:Gen-rl-millz@parserator.com) for direct contact

## 🏷️ Integration Contributions

### New Framework Integrations
We welcome integrations for:
- **AI agent frameworks** (LangChain, CrewAI, AutoGPT, etc.)
- **Development environments** (IDEs, editors, CLI tools)
- **Data processing platforms** (Apache Airflow, Databricks, etc.)
- **Business applications** (Zapier, Microsoft Power Platform, etc.)

### Integration Requirements
- **Complete working example** with real use cases
- **Comprehensive documentation** with setup instructions
- **Error handling** and edge case coverage
- **EMA compliance** - no vendor lock-in features
- **Automated tests** to ensure continued compatibility

### Browser Extension Contributions
- **Chrome Extension**: UI/UX improvements, new features
- **VS Code Extension**: Developer experience enhancements
- **Firefox Extension**: Mozilla-specific adaptations
- **Edge Extension**: Microsoft-specific features

## 🎖️ Recognition

### Contributors
All contributors are recognized in:
- **CONTRIBUTORS.md** file with links to contributions
- **GitHub Contributors** section
- **Release notes** for significant contributions
- **Community highlights** in announcements

### Maintainer Opportunities
Active contributors may be invited to become maintainers based on:
- **Quality contributions** over time
- **Community engagement** and helpfulness
- **EMA philosophy alignment** and understanding
- **Technical expertise** in relevant areas

## 📋 Development Guidelines

### Architecture Principles
- **Two-stage processing** (Architect-Extractor pattern)
- **Token efficiency** optimization
- **Framework agnostic** design
- **Error resilience** and graceful degradation
- **Performance monitoring** and optimization

### Performance Standards
- **Sub-3 second** response times for typical requests
- **95%+ accuracy** on well-structured data
- **70%+ token efficiency** vs single-LLM approaches
- **Minimal memory footprint** for client libraries

### Compatibility Requirements
- **Node.js 16+** for JavaScript/TypeScript
- **Python 3.8+** for Python integrations
- **Modern browsers** for extensions (Chrome 88+, Firefox 78+)
- **VS Code 1.60+** for editor extensions

## 🚀 Release Process

### Version Numbering
We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Schedule
- **Patch releases**: As needed for critical fixes
- **Minor releases**: Monthly feature releases
- **Major releases**: Quarterly with significant new capabilities

### Beta Program
- **Early access** to new features
- **Feedback collection** and iteration
- **Stability testing** before public release
- **Community input** on feature design

---

## 🙏 Thank You!

Your contributions make Parserator better for everyone. Whether you're fixing a typo, adding a feature, or helping other users, you're helping build the future of data liberation and digital sovereignty.

**Together, we're creating tools that empower users rather than trap them.**

---

### License
By contributing, you agree that your contributions will be licensed under the same MIT License that covers the project.

### Questions?
Feel free to reach out:
- **GitHub**: Open an issue or discussion
- **Discord**: [Join our community](https://discord.gg/parserator)
- **Email**: [Gen-rl-millz@parserator.com](mailto:Gen-rl-millz@parserator.com)