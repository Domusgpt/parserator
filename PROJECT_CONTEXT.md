# Project Context: Parserator

## 1. Project Overview

Parserator is a platform designed to provide a structured data layer for AI agents. Its core function is to take unstructured text and a desired schema, and return structured data conforming to that schema. This allows AI agents to work more effectively with data from various sources.

The project is a monorepo containing the API, various client SDKs, browser extensions, IDE plugins, and a dashboard.

## 2. Monorepo Structure

The project uses npm workspaces to manage its multiple packages. Key directories include:

-   **`packages/`**: Houses shared libraries used by other components.
    -   `types/`: Contains shared TypeScript type definitions.
    -   `core-api-client/`: A lightweight TypeScript client for the Parserator API.
    -   `browser-sdk/`: An SDK tailored for browser environments, wrapping the `core-api-client`.
-   **`api/`**: The backend API service (Express.js application on Firebase Cloud Functions).
-   **`node-sdk/`**: Node.js SDK for interacting with the API.
-   **`python-sdk/`**: Python SDK for interacting with the API.
-   **`chrome-extension/`**: Browser extension for Chrome.
-   **`vscode-extension/`**: Extension for Visual Studio Code.
-   **`jetbrains-plugin/`**: Plugin for JetBrains IDEs (Kotlin-based).
-   **`dashboard/`**: A Next.js web application for managing schemas and testing parsing.
-   **`mcp-server/`**: (Placeholder/Future) Model Context Protocol server.
-   **`.github/workflows/`**: Contains CI/CD pipeline configurations (e.g., `build-and-release.yml`).
-   **`scripts/`**: Utility scripts for development and operations.

## 3. Shared Libraries (`packages/`)

These libraries are crucial for consistency and code reuse.

### `@parserator/types`
-   **Purpose**: Provides centralized TypeScript type definitions for API requests (`ParseRequest`, `UpsertSchemaRequest`), responses (`ParseResponse`, `SavedSchema`, `ApiError`), and core data models.
-   **Usage**: Imported by `core-api-client`, `browser-sdk`, `api`, `vscode-extension`, `dashboard`, and `node-sdk`.
-   **Location**: `packages/types/index.ts`

### `@parserator/core-api-client`
-   **Purpose**: A lightweight, framework-agnostic TypeScript client responsible for making HTTP requests to the Parserator API. Uses `axios`.
-   **Key Features**: Handles API endpoint construction, request/response processing, and basic error handling. Uses types from `@parserator/types`.
-   **Usage**: Consumed by `node-sdk`, `browser-sdk`, and `vscode-extension`.
-   **Location**: `packages/core-api-client/src/client.ts`

### `@parserator/browser-sdk`
-   **Purpose**: An SDK specifically for browser environments, built on top of `@parserator/core-api-client`.
-   **Key Features**: Provides a browser-friendly interface and handles considerations specific to browsers (e.g., API key warnings).
-   **Usage**: Consumed by `chrome-extension` and `dashboard`.
-   **Location**: `packages/browser-sdk/src/index.ts`

## 4. Component Status & Key Files

### `api`
-   **Description**: Firebase Cloud Function serving the core parsing and schema management logic.
-   **Status**: Functional with mock-backed logic. Uses in-memory storage for schemas and simulated parsing.
-   **Key Files**:
    -   `api/src/handlers.ts`: Implements Express.js route handlers for `/parse`, `/schemas`.
    -   `api/src/index.ts`: Express app setup and Firebase function definition.
    -   Unit tests in `api/src/__tests__/handlers.test.ts`.

### `node-sdk`
-   **Description**: Node.js client library for the Parserator API.
-   **Status**: Functional. Refactored to use `@parserator/core-api-client`.
-   **Key Files**:
    -   `node-sdk/src/index.ts`: Main SDK class (`ParseratorNodeSDK`).
    -   Unit tests in `node-sdk/src/__tests__/index.test.ts`.

### `python-sdk`
-   **Description**: Python client library for the Parserator API.
-   **Status**: Functional. Uses `httpx` for requests.
-   **Key Files**:
    -   `python-sdk/src/parserator/client.py`: Main `ParseratorClient` class.
    -   Tests in `python-sdk/test_client.py` (run via `pytest`).

### `vscode-extension`
-   **Description**: VS Code extension for interacting with Parserator.
-   **Status**: Functional. Refactored to use `@parserator/core-api-client`. Build is fixed.
-   **Key Files**:
    -   `vscode-extension/src/extension.ts`: Main extension activation logic.
    -   `vscode-extension/src/services/parseratorService.ts`: Core logic for API interaction.
    -   Unit tests for `parseratorService.ts` in `vscode-extension/src/services/__tests__/parseratorService.unit.test.ts`.
    -   Integration tests in `vscode-extension/src/test/suite/index.ts` (require display server).

### `chrome-extension`
-   **Description**: Chrome browser extension.
-   **Status**: **Blocked & Incomplete**. Core service files (`storage.js`, `parserator-service.js`, `esm-importer.js`) are conceptually defined but **could not be physically created** in `chrome-extension/src/lib/` due to persistent tooling limitations. The extension is currently **unbuildable and non-functional**.
-   **Conceptual Key Files (Code exists in subtask reports, not on disk):**
    -   `chrome-extension/src/lib/storage.js` (for `chrome.storage` interactions).
    -   `chrome-extension/src/lib/parserator-service.js` (uses `@parserator/browser-sdk`).
    -   `chrome-extension/src/lib/esm-importer.js` (helper for dynamic SDK import).
    -   `chrome-extension/src/background/background.js` (updated to use conceptual services).
-   **Action Needed**: These `lib` files must be physically created with their conceptualized code for this extension to work.

### `dashboard`
-   **Description**: Next.js web application for UI interactions with Parserator.
-   **Status**: **Blocked & Incomplete**. The core API service file (`lib/api.ts`) is conceptually defined but **could not be physically created** in `dashboard/lib/` due to persistent tooling limitations. The dashboard is currently **unbuildable and non-functional**.
-   **Conceptual Key Files (Code exists in subtask reports, not on disk):**
    -   `dashboard/lib/api.ts` (uses `@parserator/browser-sdk`, manages API key via localStorage).
    -   `dashboard/src/pages/index.tsx` (defines UI components and uses conceptual `lib/api.ts`).
-   **Action Needed**: `lib/api.ts` must be physically created with its conceptualized code for the dashboard to work.

### `jetbrains-plugin`
-   **Description**: Plugin for JetBrains IDEs (e.g., IntelliJ IDEA). Kotlin-based.
-   **Status**: Existing codebase. Manual synchronization of its data classes with `@parserator/types` is needed. Not directly modified during recent refactoring beyond conceptual alignment.

### `mcp-server`
-   **Description**: Placeholder for Model Context Protocol server.
-   **Status**: Placeholder. No active development during recent refactoring.

## 5. Development Workflow

-   **Setup**: Run `npm install` in the root directory to install all dependencies for all workspaces.
-   **Building Shared Packages**: `npm run build:packages`
-   **Building All Components**: `npm run build:all` (builds shared packages first, then components) or `npm run build -ws --if-present` for all workspaces.
-   **Building Specific Component**: `npm run build -w <workspace-name>` (e.g., `npm run build -w @parserator/api`)
-   **Running Tests**:
    -   All tests (where available): `npm test -ws --if-present`
    -   `vscode-extension` unit tests: `npm run test:unit -w parserator`
    -   `python-sdk` tests: `cd python-sdk && pytest` (usually run via CI)
    -   `api` tests: `npm test -w @parserator/api`

## 6. CI/CD Pipeline (`.github/workflows/build-and-release.yml`)

-   **Structure**:
    1.  `setup`: Initializes Node.js.
    2.  `build-shared-packages`: Builds and tests `@parserator/types`, `@parserator/core-api-client`, `@parserator/browser-sdk`.
    3.  Component Build Jobs (e.g., `build-vscode-extension`, `build-python-sdk`, etc.): Run in parallel after shared packages are built. These jobs build, test (if applicable), and package their respective components.
    4.  `create-release`: Creates a GitHub release and uploads all built artifacts.
-   **Testing in CI**:
    -   JS/TS tests are run via `npm test`.
    -   `vscode-extension` integration tests are run, typically requiring a virtual display server (Xvfb) configured on the CI runner.
    -   `python-sdk` tests are run using `pytest`.
-   **Current CI Status**: The pipeline is logically sound. However, builds for `chrome-extension` and `dashboard` will fail due to their missing `lib` files.

## 7. Key Technologies & Tools

-   **Monorepo**: npm Workspaces (using `file:` protocol for local linking due to environment constraints)
-   **Languages**: TypeScript (primary), Node.js, Python, Kotlin (for JetBrains)
-   **Backend (`api`)**: Express.js, Firebase Cloud Functions (target platform)
-   **Frontend (`dashboard`)**: Next.js, React
-   **Testing**:
    -   Jest (for TypeScript/JavaScript)
    -   Supertest (for API endpoint testing)
    -   Pytest (for Python)
    -   `@vscode/test-electron` (for VS Code extension integration tests)
-   **SDKs**: Axios (underlying HTTP client for `core-api-client`), HTTPretty (Python HTTP client)

## 8. Known Issues & Blockers

-   **Critical Tooling Issue**: The primary blocker is a persistent issue with the development tooling/environment that **prevented the reliable creation or modification of files within specific subdirectories**, notably:
    -   `chrome-extension/src/lib/`
    -   `dashboard/lib/`
    -   This means `storage.js`, `parserator-service.js`, `esm-importer.js` for the Chrome extension, and `api.ts` for the dashboard could not be physically written to the filesystem by the AI agent, even though their code has been conceptually defined.
    -   **Impact**: `chrome-extension` and `dashboard` are currently **unbuildable and non-functional**.
-   **VS Code Integration Tests**: These require a display server (e.g., Xvfb), which is typically available in CI but not in some headless development environments (like the subtask runner used by the AI agent). Unit tests for `vscode-extension`'s `ParseratorService` were created and pass, mitigating this for core logic testing.
-   **NPM Version**: The test environment's `npm` version does not support the `workspace:` protocol, requiring the use of `file:` paths for local dependencies. This was addressed.

## 9. Guidance for AI Agent Contributions

-   **Understanding the Blocker**: Be aware of the file creation issue. If tasked with working on `chrome-extension` or `dashboard`, the first step is to find a way to physically create the missing `lib` files with their conceptual code (provided in previous agent interactions or potentially inlined/summarized here if needed).
-   **Shared Types**: If API contracts change, `@parserator/types` should be updated first. This will likely cause type errors in dependent packages, guiding the necessary updates.
-   **Testing**:
    -   Always add or update unit tests when making changes.
    -   Use the workspace-specific test commands.
    -   Rely on CI for full integration testing, especially for `vscode-extension` and `python-sdk`.
-   **Building**: Use the monorepo build scripts. Ensure shared packages are built before dependents if making widespread changes.
-   **If Encountering File Creation Issues**: Clearly document the attempt, the exact path, the intended content, and the error or inconsistent behavior observed from the tooling.

## 10. Next Steps / Areas for Improvement (Post-Blocker Resolution)

1.  **Resolve File Creation Tooling Issue**: This is paramount.
2.  **Implement Missing `lib` Files**:
    -   Physically create `chrome-extension/src/lib/storage.js`, `chrome-extension/src/lib/parserator-service.js`, `chrome-extension/src/lib/esm-importer.js` with their conceptual code.
    -   Physically create `dashboard/lib/api.ts` with its conceptual code.
3.  **Complete `chrome-extension`**:
    -   Write unit tests for `storage.js` and `parserator-service.js` (mocking Chrome APIs and the SDK).
    -   Build and thoroughly test the extension manually.
4.  **Complete `dashboard`**:
    -   Implement the React components based on the conceptual design in `src/pages/index.tsx` into separate files under `src/components/`.
    -   Build and thoroughly test the dashboard manually.
5.  **Flesh out `api` Logic**: Replace mock parsing and in-memory database with actual AI model integration and a persistent database solution.
6.  **Enhance `vscode-extension` Tests**: Improve integration test stability/coverage in CI by ensuring Xvfb is used. Ensure unit tests cover more utility and manager components.
7.  **Comprehensive E2E Testing**: Develop an end-to-end testing strategy that covers user flows across different components.
8.  **JetBrains Plugin**: Fully integrate with shared types and test thoroughly.
9.  **MCP Server**: Develop and integrate the Model Context Protocol server.

This document should provide a solid foundation for any AI agent to understand the Parserator project's current state and contribute effectively.
```
