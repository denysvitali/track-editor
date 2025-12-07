# Track Editor

A web application for editing and trimming TCX activity files. Built with Rust/WASM for high-performance parsing and React for the UI.

## Features

- **TCX File Upload** - Drag & drop or file picker
- **Activity Details** - View sport type, duration, distance, calories, heart rate stats, and elevation data
- **Interactive Map** - Visualize your GPS route with start/end markers
- **Timeline Charts** - Analyze heart rate, altitude, and pace over time
- **Track Trimming** - Select start and end points to shorten your activity
- **Export** - Download the modified TCX file
- **Privacy-First** - All processing happens locally in your browser

## Tech Stack

- **Rust + WebAssembly** - High-performance TCX parsing with `quick-xml`
- **React 19 + TypeScript** - Type-safe UI components
- **Tailwind CSS 4** - Modern styling with dark mode support
- **Leaflet** - Interactive map visualization
- **Recharts** - Beautiful timeline charts
- **Vite** - Fast development and optimized builds

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Rust](https://rustup.rs/) with `wasm32-unknown-unknown` target
- [wasm-bindgen-cli](https://rustwasm.github.io/wasm-bindgen/)

### Setup

```bash
# Install Rust WASM target
rustup target add wasm32-unknown-unknown

# Install wasm-bindgen CLI
cargo install wasm-bindgen-cli

# Install Node dependencies
pnpm install
```

### Commands

```bash
# Start development server
pnpm dev

# Build for production (includes WASM build)
pnpm build

# Preview production build
pnpm preview

# Build WASM only
pnpm build:wasm

# Lint code
pnpm lint
```

## Deployment

The app is automatically deployed to GitHub Pages when pushing to the `main` branch.

Live demo: https://denysvitali.github.io/track-editor/

## License

MIT
