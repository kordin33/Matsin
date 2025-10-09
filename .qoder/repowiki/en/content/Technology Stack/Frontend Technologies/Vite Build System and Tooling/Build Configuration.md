# Build Configuration

<cite>
**Referenced Files in This Document**  
- [vite-env.d.ts](file://excalidraw/excalidraw-app/vite-env.d.ts)
- [package.json](file://excalidraw/package.json)
- [tsconfig.json](file://excalidraw/tsconfig.json)
- [vite.config.ts](file://excalidraw/vite.config.ts)
- [scripts/woff2/woff2-vite-plugins.js](file://excalidraw/scripts/woff2/woff2-vite-plugins.js)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Vite Environment Type Definitions](#vite-environment-type-definitions)
3. [Package Scripts Integration](#package-scripts-integration)
4. [TypeScript Configuration Alignment](#typescript-configuration-alignment)
5. [Environment Modes and Conditional Configuration](#environment-modes-and-conditional-configuration)
6. [Development Server Configuration](#development-server-configuration)
7. [Build and Asset Handling](#build-and-asset-handling)
8. [Preview and Production Workflow](#preview-and-production-workflow)
9. [Custom Aliases and Path Resolution](#custom-aliases-and-path-resolution)
10. [Conclusion](#conclusion)

## Introduction
This document provides a comprehensive overview of the Vite-based build configuration used in the Excalidraw project. It details how Vite is integrated into the development and production workflows, covering environment typing, script orchestration, TypeScript alignment, server configuration, and build optimizations. The documentation focuses on key files and patterns that enable efficient frontend development, asset handling, and deployment readiness.

## Vite Environment Type Definitions

The `vite-env.d.ts` file plays a critical role in defining global types for Vite's environment variable system. It ensures type safety when accessing `import.meta.env` throughout the codebase by extending the `ImportMetaEnv` interface with project-specific environment variables. This file is located in the `excalidraw-app` directory and is automatically referenced by TypeScript due to its placement in the source tree and inclusion in the `tsconfig.json` type references.

By declaring custom environment variables such as `VITE_APP_VERSION`, `VITE_SENTRY_DSN`, or `VITE_BACKEND_URL`, developers gain autocomplete and compile-time validation when using these values in the application. This prevents runtime errors caused by misspelled or undefined environment keys and enhances developer experience during local development and CI/CD processes.

**Section sources**
- [vite-env.d.ts](file://excalidraw/excalidraw-app/vite-env.d.ts)

## Package Scripts Integration

The `package.json` file in the root of the Excalidraw repository defines a suite of npm scripts that interface directly with Vite commands. These scripts standardize common development tasks such as starting the dev server, building for production, previewing builds, and running tests. Key scripts include:

- `dev`: Starts the Vite development server with hot module replacement (HMR)
- `build`: Compiles the application for production using Vite’s build command
- `preview`: Serves the built assets locally to simulate production behavior
- `lint`: Runs ESLint across the codebase
- `test`: Executes unit and integration tests

These scripts are designed to work seamlessly with Vite’s CLI, allowing developers to run `npm run dev` and immediately begin coding with fast refresh capabilities. The scripts also integrate with other tools like ESLint, Prettier, and testing frameworks to form a cohesive development pipeline.

**Section sources**
- [package.json](file://excalidraw/package.json)

## TypeScript Configuration Alignment

The `tsconfig.json` file in the Excalidraw root directory is configured to align with Vite’s expectations for module resolution, JSX handling, and path mapping. It enables modern TypeScript features while ensuring compatibility with Vite’s native ES module handling. Key compiler options include:

- `"target": "ESNext"` – Targets the latest JavaScript features supported by modern browsers
- `"module": "ESNext"` – Uses ES modules for better tree-shaking and compatibility with Vite
- `"jsx": "react-jsx"` – Enables automatic JSX runtime for React components
- `"strict": true` – Enforces strict type checking
- `"paths"` – Defines custom module aliases for cleaner imports

The configuration also includes references to types from React, Vite, and project-specific declarations in `vite-env.d.ts`. This ensures that TypeScript can resolve all module imports correctly during both development and build phases.

**Section sources**
- [tsconfig.json](file://excalidraw/tsconfig.json)

## Environment Modes and Conditional Configuration

Excalidraw leverages Vite’s environment mode system to apply different configurations for development, staging, and production environments. Environment variables are loaded from `.env`, `.env.local`, `.env.development`, and `.env.production` files based on the current mode. Variables prefixed with `VITE_` are exposed to the client-side code via `import.meta.env`.

Conditional logic in the Vite configuration allows for environment-specific behaviors, such as enabling debug logging in development or configuring different API endpoints per environment. This pattern supports secure handling of secrets (which should never be exposed client-side) while providing flexibility for feature flags and service URLs.

**Section sources**
- [vite-env.d.ts](file://excalidraw/excalidraw-app/vite-env.d.ts)
- [package.json](file://excalidraw/package.json)

## Development Server Configuration

The Vite development server is configured to optimize the developer experience in Excalidraw. Custom server options include:

- Port assignment via `server.port` to avoid conflicts
- Proxy configuration for API requests to backend services
- CORS settings for local development with external APIs
- HMR (Hot Module Replacement) for instant component updates

Proxy rules redirect specific routes (e.g., `/api`) to a backend server during development, enabling seamless integration between the frontend and backend without CORS issues. This setup allows developers to work on the UI independently while still interacting with real API data.

**Section sources**
- [vite.config.ts](file://excalidraw/vite.config.ts)

## Build and Asset Handling

During the build process, Vite optimizes assets for production by:

- Minifying JavaScript and CSS
- Code-splitting for lazy-loaded modules
- Inlining small assets as base64 data URLs
- Preserving source maps for debugging
- Generating hashed filenames for cache busting

Custom plugins, such as those in `scripts/woff2/woff2-vite-plugins.js`, handle specialized asset transformations like WOFF2 font compression. These plugins integrate into Vite’s build pipeline to ensure fonts are efficiently processed and delivered. The output is placed in the `dist` directory, ready for deployment.

**Section sources**
- [vite.config.ts](file://excalidraw/vite.config.ts)
- [scripts/woff2/woff2-vite-plugins.js](file://excalidraw/scripts/woff2/woff2-vite-plugins.js)

## Preview and Production Workflow

The `preview` script serves the built application using Vite’s built-in static server, allowing developers to test production-like behavior locally before deployment. This includes checking route fallbacks, asset loading performance, and service worker functionality.

In production, the built assets are deployed via CI/CD pipelines triggered by GitHub Actions. Workflows such as `build-docker.yml` and `publish-docker.yml` automate containerized builds and deployments, ensuring consistency across environments. The `nginx.conf` file defines routing rules and MIME types for optimal delivery.

**Section sources**
- [package.json](file://excalidraw/package.json)
- [vite.config.ts](file://excalidraw/vite.config.ts)
- [.github/workflows/build-docker.yml](file://excalidraw/.github/workflows/build-docker.yml)

## Custom Aliases and Path Resolution

To improve import readability and maintainability, Excalidraw uses path aliases defined in `tsconfig.json`. These aliases allow developers to import modules using absolute paths instead of relative paths (e.g., `@components/Button` instead of `../../components/Button`).

Vite respects these aliases through its resolver configuration, ensuring that both development and build processes can locate modules correctly. This setup reduces the risk of broken imports when refactoring and improves code navigation in IDEs.

**Section sources**
- [tsconfig.json](file://excalidraw/tsconfig.json)
- [vite.config.ts](file://excalidraw/vite.config.ts)

## Conclusion

The Vite build configuration in Excalidraw is designed to support a fast, scalable, and maintainable frontend development workflow. Through proper typing with `vite-env.d.ts`, alignment with TypeScript, environment-aware builds, and optimized asset handling, the setup enables efficient iteration and reliable deployments. The integration of custom plugins, aliases, and CI/CD automation further enhances developer productivity and application performance.