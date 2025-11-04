# Document Manager

A document management web application built with vanilla TypeScript and Web Components.

## Features

- Document display with list and grid view modes
- Real-time updates via WebSocket integration
- Client-side document creation
- Sorting by name, version, or creation date
- Responsive design

## Technical Implementation

- Pure TypeScript without frameworks
- Native Web Components with Shadow DOM
- Observer pattern for state management
- Service layer architecture
- Comprehensive error handling
- Accessibility features

## Architecture

### Project Structure
```
src/
├── core/                   # Business logic layer
│   ├── models/            # Domain models (Document, etc.)
│   ├── services/          # API, WebSocket, and business services
│   └── state/             # State management (Observer pattern)
├── ui/
│   ├── components/        # Web Components (Custom Elements)
│   └── utils/             # DOM helpers, formatters, utilities
├── types/                 # Shared TypeScript interfaces
└── main.ts                # Application entry point

public/
├── index.html             # Main HTML file
└── styles/                # Global CSS
```

### Design Patterns
- Observer pattern for state management
- Service layer for business logic separation
- Component-based architecture using Web Components
- Event-driven communication

## Setup

### Prerequisites
- Node.js 18+
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Mock server running on port 3001

### Development Setup

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start development server
npm run serve
# Server runs on http://localhost:8080

# Or start everything together
npm run dev
```

### Mock Server Setup
The mock server is required for full functionality:

```bash
cd server
npm install
npm start
# Server runs on http://localhost:8080
```

## Testing

```bash
# Check TypeScript compilation
npm run build

# Manual testing
# 1. Open http://localhost:8080
# 2. Test document creation, sorting, view modes
# 3. Check real-time notifications (requires mock server)
```

## Browser Compatibility

Supports modern browsers (Chrome, Firefox, Safari, Edge) with:
- Web Components
- Shadow DOM
- ES Modules
- WebSocket

## Technical Decisions

### Vanilla TypeScript
- Deep understanding of web fundamentals
- No framework overhead, optimized bundle size
- Proper architecture without framework abstractions
- Based on web standards

### Web Components
- Native browser API with no polyfills needed
- Shadow DOM provides style and logic isolation
- Component reusability across contexts
- Web standards compliance

### State Management
- Observer pattern implementation
- Minimal dependencies
- Full TypeScript support
- Simple debugging and testing

## Performance

- Bundle size: ~15KB gzipped
- Fast initial load with minimal JavaScript
- Direct DOM manipulation
- Efficient memory management

## Development Commands

```bash
npm run build      # Compile TypeScript
npm run watch      # Watch mode for development
npm run serve      # Start HTTP server
npm run dev        # Build + watch + serve
```

## Production Features

### Security
- Input sanitization for user-generated content
- XSS prevention in DOM manipulation
- CSP-friendly code structure

### Code Quality
- TypeScript strict mode
- Modular architecture
- Clean, consistent code style
- Self-documenting code with clear naming

## Requirements Fulfilled

- Display documents in list and grid views
- Real-time notifications via WebSocket integration
- Document creation with contributor support
- Sort functionality with multiple criteria
- Pure TypeScript implementation without frameworks
- Modern browser support with ES2020 target
- Clean, testable architecture

Oscar Lozano, 2025
