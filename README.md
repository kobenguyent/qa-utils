# QA Utils 🚀

[![Donate with PayPal](https://img.shields.io/badge/Donate-PayPal-blue.svg)](https://paypal.me/peternguyentr?country.x=DE&locale.x=en_US)
[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/peternguyew)

A comprehensive collection of quality assurance tools and utilities designed to enhance your testing workflow. Built with modern React, TypeScript, and optimized for performance with comprehensive test coverage.

🌐 **[Live Demo](https://kobenguyent.github.io/qa-utils/#/)** | 📊 **62 Tests** | 🎯 **Mobile-First Design**

![QA Utils Homepage](https://github.com/user-attachments/assets/ba5c6fd8-efe8-4dc3-921a-9accbe53690b)

## ✨ Features

### 🛠️ Utility Tools

#### 🌐 JWT Debugger
Decode and analyze JSON Web Tokens with enhanced features:
- **Multi-line textarea** for handling long JWT tokens
- **📋 Paste from Clipboard** button for easy token input
- **🗑️ Clear functionality** to reset input quickly
- **Real-time validation** with expiration status
- **Syntax-highlighted decoded payload** display
- **Copy to clipboard** functionality for decoded data

![JWT Debugger](https://github.com/user-attachments/assets/5346ad83-e80a-414c-a563-cd33e9645c70)

#### 🚀 CI/CD Workflow Generator
Professional workflow generator supporting multiple platforms:
- **5 CI/CD Platforms**: GitHub Actions, GitLab CI, Azure DevOps, Jenkins, Bitbucket Pipelines
- **API & E2E Testing**: Configurable test types with multiple runners
- **Test Runner Support**: Playwright, Puppeteer, WebDriverIO, Cypress
- **Node.js Versions**: 16, 18, 20, 21 support
- **NPM Publishing**: Automated package publishing workflows
- **Real-time Preview**: Live preview with syntax highlighting
- **One-click Download**: Generate and download workflow files instantly
- **Comprehensive Instructions**: Detailed setup guidance for each platform

![CI/CD Workflow Generator](https://github.com/user-attachments/assets/84580edc-ab15-432c-a016-a26ea00f13d8)

#### 🛸 Base64 Encode/Decode
Simple and efficient Base64 operations:
- **Bidirectional conversion** (encode/decode)
- **Clean interface** with instant results
- **Error handling** for invalid inputs
- **Copy functionality** for results

![Base64 Tool](https://github.com/user-attachments/assets/04c7fedc-0a31-4dd1-9acd-3d2751255ba0)

#### ﹛ JSON Formatter ﹜
Advanced JSON processing capabilities:
- **Pretty-print JSON** with syntax highlighting
- **Collapsible tree view** for large objects
- **Error detection** and validation
- **Copy to clipboard** functionality
- **Real-time formatting** as you type

#### ⏰ Unix Timestamp Converter
Convert between Unix timestamps and human-readable dates:
- **Bidirectional conversion** (timestamp ↔ date)
- **Multiple format support** (seconds/milliseconds)
- **Timezone handling** with local time display
- **Real-time conversion** with validation

#### 🌠 Additional Tools
- **UUID Generator**: Generate UUIDs v1, v4 with copy functionality
- **JIRA Comment Generator**: Format comments for JIRA with markdown support
- **🌠 OTP Generator**: Generate time-based and counter-based OTP codes
- **🔐 Encryption/Decryption**: Multiple encryption algorithms support
- **🤖 Playwright to CodeceptJS**: Convert Playwright tests to CodeceptJS format

### 📚 Educational Resources

#### 💡 Hints
- **🔥💡 CodeceptJS Hints**: Best practices and tips for CodeceptJS testing

#### 📚 Technical Terms
- **Interactive Voice Response (IVR)**: Comprehensive guide
- **Busy Lamp Field (BLF)**: Technical specifications
- **Session Initiation Protocol (SIP)**: Protocol documentation

#### 📚 ISTQB Certification
- **CTFL v4 Practice Exams**: Interactive practice tests for certification preparation

## 🏗️ Technical Architecture

### 🎯 Performance Optimizations
- **Code splitting** with React.lazy for reduced bundle size
- **Lazy loading** of route components for faster initial load
- **Bundle optimization** with separate chunks
- **Performance monitoring** with Web Vitals
- **Mobile-first responsive design** with Bootstrap

### 🧪 Comprehensive Testing
- **62 test cases** across 8 test files
- **Component testing** with React Testing Library
- **Utility function testing** with comprehensive coverage
- **CI/CD integration** with automated testing on PRs
- **Coverage reporting** with detailed metrics

### 🔒 Security Features
- **XSS protection** with input sanitization
- **Content Security Policy** headers
- **Input validation** across all forms
- **Secure clipboard operations** with fallback support

### 📱 Mobile Experience
- **Mobile-first design** with responsive layouts
- **Touch-friendly interfaces** with proper target sizes
- **Progressive enhancement** for all devices
- **Accessibility compliance** with ARIA attributes

## 🚀 Getting Started

### Prerequisites
- **Bun** (recommended) or **Node.js 16+**
- Modern web browser with ES6+ support

### Installation & Development

#### With Bun (Recommended)

```bash
bun install && bun run dev
```

#### Alternative: With Node.js

```bash
npm install && npm run dev
```

The application will be available at: **http://localhost:5173/**

### Available Scripts

```bash
# Development server
bun run dev          # Start development server with hot reload

# Building
bun run build        # Build for production
bun run build:github # Build for GitHub Pages deployment

# Testing
bun test            # Run all tests
bun run test:ui     # Run tests with UI
bun run test:coverage # Generate coverage report

# Code Quality
bun run lint        # Run ESLint with TypeScript support
bun run preview     # Preview production build
```

## 🏗️ Technology Stack

- **Frontend**: React 18, TypeScript, Bootstrap 5
- **Build System**: Vite with SWC for fast builds
- **Testing**: Vitest + React Testing Library (62 tests)
- **Package Manager**: Bun (with npm fallback)
- **Code Quality**: ESLint, TypeScript strict mode
- **CI/CD**: GitHub Actions with automated testing
- **Deployment**: GitHub Pages with automated workflows

## 🤝 Contributing

We welcome contributions! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Guidelines
1. **Write tests** for new features (maintain 100% coverage goal)
2. **Follow TypeScript strict mode** guidelines
3. **Use semantic commit messages** for clear change tracking
4. **Ensure mobile responsiveness** for all new components
5. **Add proper accessibility** attributes and keyboard navigation

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 💝 Support

If you find this project helpful, consider:
- ⭐ **Starring the repository**
- 🐛 **Reporting bugs** or requesting features
- 💰 **[Donating via PayPal](https://paypal.me/peternguyentr?country.x=DE&locale.x=en_US)**
- ☕ **[Buying me a coffee](https://www.buymeacoffee.com/peternguyew)**

Built with ❤️ for the testing community by [KobeT](https://github.com/kobenguyent)
