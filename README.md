# Applyo – React + TypeScript + Vite Template

A minimal, production-ready starter kit that combines **React**, **TypeScript**, and **Vite** with hot-module replacement, ESLint, and optional Fast Refresh plugins.

## Features

- Vite development server with lightning-fast HMR
- TypeScript support out of the box
- ESLint + type-aware rules (tseslint)
- Two Fast Refresh options:
  - `@vitejs/plugin-react` (Babel-based)
  - `@vitejs/plugin-react-swc` (SWC-based, even faster)
- Ready for building a modern SPA or PWA

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9 (or Yarn / pnpm)

## Getting Started

```bash
# Clone the repository
git clone https://github.com/yourname/applyo.git
cd applyo

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open <http://localhost:5173> in your browser – the app will reload automatically as you edit source files.

## Building for Production

```bash
npm run build   # creates a production-ready bundle in `dist/`
npm run preview # preview the built app locally
```

## Linting & Type-aware ESLint

The default ESLint config works out of the box, but for a real-world app you’ll want the **type-checked** rules.

1. Edit `eslint.config.js` (or `eslint.config.ts`) and enable the parser options:

```js
export default tseslint.config({
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

2. Switch to a type‑aware config set:

```js
import { tseslint } from 'typescript-eslint';
export default tseslint.config({
  ...tseslint.configs.recommendedTypeChecked,
  // optional stylistic rules
  ...tseslint.configs.stylisticTypeChecked,
});
```

3. (Optional) Add React‑specific linting:

```bash
npm i -D eslint-plugin-react
```

```js
import react from 'eslint-plugin-react';
export default tseslint.config({
  settings: { react: { version: '18.3' } },
  plugins: { react },
  rules: {
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
});
```

## Scripts Overview

| Script | Description |
| ------ | ----------- |
| `dev` | Starts Vite in development mode |
| `build` | Produces an optimized production bundle |
| `preview` | Serves the `dist/` folder locally |
| `lint` | Runs ESLint |
| `format` | Formats code with Prettier (if configured) |

## License

This starter template is licensed under the MIT License – feel free to use it for personal or commercial projects.

---

Happy coding! 🚀
