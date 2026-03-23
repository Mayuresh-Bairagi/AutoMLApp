# My React App

A React application built with TypeScript, Vite, and Tailwind CSS.

## Features

- React 19 with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- ESLint for code quality
- React Router for navigation
- Framer Motion for animations
- Heroicons and Lucide React for icons

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Development

Start the development server:
```bash
npm run dev
```

### Backend Integration (Recommended)

This frontend uses proxy-based API routing in development, so backend host details are not exposed in the UI.

1. Set backend target via environment variable:
   ```bash
   VITE_BACKEND_URL=http://localhost:8000
   ```
2. Frontend calls use `/api/*` internally.
3. Vite proxy forwards these to your backend server.

This avoids hard-coding backend host values in user-facing screens.

### Building

Build for production:
```bash
npm run build
```

### Linting

Run ESLint:
```bash
npm run lint
```

### Preview

Preview the production build:
```bash
npm run preview
```
