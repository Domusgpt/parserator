# Project Manifest

## Directory Structure Assessment
Based on the analysis of `Parserator/` and `ParseratorMarketing/`, and the top-level directory listing:

**Clarity of Separation:**
- The separation between `Parserator/` (development) and `ParseratorMarketing/` (marketing) is clear and logical. This is a good practice, as it separates the core engineering work from the go-to-market strategies and assets.

**Other Top-Level Directories:**
- **`parserator-main/`**: This directory appears to be a significant area, possibly representing the primary or most current stable version of the project. It contains `.github` (suggesting it's linked to the main GitHub repository), `docs/`, `examples/`, and its own `packages/` (including `mcp-server` and `mvep-kernel`). Its role needs to be clarified in relation to `Parserator/`. It could be the actual root of the version-controlled project, with `Parserator/` being a working development copy or an older version.
- **`parserator-development-post-launch/`**: This directory, especially with its `active-development` sub-folder that mirrors `Parserator/`'s structure, suggests a forking or versioning strategy that might be managed by copying entire directory trees. This could indicate a specific phase of development (post-initial launch) or perhaps a staging area for ongoing work before merging into `parserator-main/` or `Parserator/`.

**Overall Logical Structure:**
- The existence of multiple top-level directories (`Parserator/`, `parserator-main/`, `parserator-development-post-launch/`) that contain similar sub-structures (e.g., `packages/`, `chrome-extension/`) raises questions about redundancy and the source of truth for development.
- For a project of this scale, having distinct top-level directories for completely separate concerns like `dev` (`Parserator/` or `parserator-main/`) and `marketing` (`ParseratorMarketing/`) is reasonable.
- However, the presence of what appear to be multiple, potentially overlapping, development roots (`Parserator/`, `parserator-main/packages/`, `parserator-development-post-launch/active-development/`) could lead to confusion, maintenance overhead, and synchronization issues. It's not immediately clear which directory holds the canonical source code or how changes are propagated between them.

**High-Level Assessment:**
- The separation of marketing materials into `ParseratorMarketing/` is good.
- The primary development efforts seem to be split or duplicated across `Parserator/`, `parserator-main/`, and `parserator-development-post-launch/`. Ideally, there would be a single, clear root directory for all current software development (e.g., `parserator-main/` or simply `src/` or `source/` at the true project root if `parserator-main` is indeed the main project folder).
- If these directories represent different versions, branches, or modules, their naming and organization could be clearer to reflect their specific purpose (e.g., using actual version control branches, or more descriptive names like `parserator-v1-legacy/`, `parserator-v2-dev/`).

Without more context on the project's history and branching strategy, it's hard to make definitive statements, but there's an apparent complexity in the top-level organization of development-related code that could likely be simplified or clarified. The current structure might be a result of organic growth or specific versioning/backup strategies rather than a deliberately designed clean top-level layout for all project facets. A more conventional approach would be a single primary source code directory (monorepo or otherwise) and clearer distinctions for different project phases or significant versions if not handled by version control.

## Development Files (`Parserator/`)
- **Category:** Development
- **Primary Location:** `Parserator/`
- **Purpose:** Contains the core application code, including API, core logic, dashboard, SDKs, and extensions.
- **Key Sub-directories & Their Purpose:**
    ### 1. `Parserator/PARSERATOR_AI_BRIEFING/`
       - **Purpose**: Contains master briefing documents and supporting materials for AI development agents tasked with building Parserator.
       - **Key Files**: `1_claude_briefing.md` outlines the project, its hybrid SaaS API + SDK/Tools model, and a detailed development task queue.
       - **Output**: Guidance and specifications for building the Parserator application.

    ### 2. `Parserator/packages/`
       - **Purpose**: A monorepo (likely managed with Turbo or similar) containing various JavaScript/TypeScript packages that make up the Parserator ecosystem.
       - **Output**: Published NPM packages, deployable services.

       #### a. `packages/api/`
          - **Purpose**: Houses the primary SaaS API backend, implemented as a Firebase Cloud Function. It uses a two-stage LLM (Architect-Extractor) pattern for parsing.
          - **Key Files**:
             - `src/index.ts`: Main entry point for the Firebase Cloud Function, handling HTTP requests, routing, and basic parsing orchestration.
             - `src/services/parse.service.ts`: Contains the `ParseService` class, which manages the detailed logic of the Architect-Extractor workflow, including communication with LLM services (Gemini), data validation, and result aggregation.
             - `src/services/architect.service.ts` (inferred from briefing): Generates a `SearchPlan` based on input schema and data sample.
             - `src/services/extractor.service.ts` (inferred from briefing): Executes the `SearchPlan` on the full input data.
          - **Output**: A deployable Google Cloud Function that serves the `/v1/parse` API endpoint.

       #### b. `packages/core/`
          - **Purpose**: Defines the fundamental data structures, interfaces (like `SearchPlan`, `SearchStep`), and potentially a core, reusable implementation of the Parserator's Architect-Extractor parsing logic.
          - **Key Files**: `src/index.ts` exports TypeScript interfaces and a `ParseratorCore` class.
          - **Output**: Core parsing logic and type definitions, likely consumed by other packages (e.g., API, SDKs).

       #### c. `packages/dashboard/`
          - **Purpose**: Contains the frontend code for the Parserator web dashboard.
          - **Key Files**: `src/app/page.tsx` (redirects to `/dashboard`), indicating a Next.js application. Other files would build out the UI for managing parsing tasks, viewing results, API keys, etc.
          - **Output**: A web application providing a user interface for the Parserator service.

       #### d. `packages/email-parser/`
          - **Purpose**: Provides functionality to parse data sent via email. It can suggest a schema based on email content and then use the main Parserator API to parse it.
          - **Key Files**: `index.js` (Firebase Function triggered by email/webhook), `gmail-webhook.js`, `simple-email-service.js`.
          - **Output**: A service (likely a Firebase Function) that processes incoming emails and returns structured data.

       #### e. `packages/sdk-node/`
          - **Purpose**: Provides a Node.js SDK for developers to easily integrate Parserator's parsing capabilities into their JavaScript/TypeScript applications.
          - **Key Files**: `README.md` (usage instructions, API reference), `src/index.ts` (main SDK class `ParseratorClient`).
          - **Output**: An NPM package (`@parserator/node-sdk` or similar) for Node.js developers.

       #### f. `packages/sdk-python/`
          - **Purpose**: Provides a Python SDK for developers, particularly targeting data science workflows, to integrate Parserator.
          - **Key Files**: `pyproject.toml` (project metadata), `src/parserator/__init__.py` (main SDK class, inferred from briefing).
          - **Output**: A Python package (e.g., `parserator-python`) for Python developers.

    ### 3. `Parserator/vscode-extension/`
       - **Purpose**: Contains the source code for a Visual Studio Code extension that allows users to utilize Parserator's functionality directly within the editor.
       - **Key Files**: `README.md` (features, setup, usage), `package.json` (extension manifest), `src/extension.ts` (main extension logic).
       - **Features**: Parsing selected text, schema management, built-in templates, syntax highlighting for Parserator schemas.
       - **Output**: A VS Code extension package (`.vsix` file).

    ### 4. Other notable root files/directories in `Parserator/`:
       - `Parserator/README.md`: Main README for the entire Parserator project.
       - `Parserator/turbo.json`: Likely configuration for Turborepo, managing the monorepo structure in `packages/`.
       - `Parserator/setup-repository.sh`: A shell script for initial repository setup.
       - `Parserator/templates/`: Contains JSON templates for common parsing tasks (e.g., `email_parser.json`, `invoice_processor.json`).
       - Various test files (e.g., `test-comprehensive-suite.js`, `test-api-live.sh`): Scripts for testing different parts of the system.
       - Deployment/Launch guides (e.g., `PRODUCTION_LAUNCH_GUIDE.md`, `QUICK_DEPLOY_NOW.md`).

## Marketing Files (`ParseratorMarketing/`)
- **Category:** Marketing
- **Primary Location:** `ParseratorMarketing/`
- **Purpose:** Contains materials related to project marketing, launch, branding, and communication.
- **Key Sub-directories/File Groupings & Their Purpose:**
    ### 1. Root `.md` Strategy Documents
       - **Content**: Numerous Markdown files directly in the root.
       - **Purpose**: These files define overarching strategies for marketing, community engagement, specific platform launches (e.g., Product Hunt), technical content, and more. They lay out the foundational plans for Parserator's market penetration and growth.
       - **Examples**: `MARKETING_MASTER_PLAN.md`, `COMMUNITY_ENGAGEMENT_STRATEGY.md`, `PRODUCT_HUNT_LAUNCH.md`, `TECHNICAL_BLOG_POSTS.md`, `EMAIL_LAUNCH_CAMPAIGNS.md`.

    ### 2. `Parserator-2025-06-11-BUILD-REFERENCE-FILES/`
       - **Content**: A snapshot of files that seem to be a reference build or a collection of materials for a specific launch or development phase dated June 11, 2025. It includes a `README.md`, marketing content templates (`LAUNCH_MARKETING_CONTENT.md`), technical documents, and even a nested `PARSERATOR_AI_BRIEFING` and `packages` structure similar to the main `Parserator/` dev directory.
       - **Purpose**: Appears to be a comprehensive package of code, documentation, and marketing materials prepared for a specific milestone, possibly a launch or a major update. The marketing content includes detailed social media posts, email templates, and demo scripts.

    ### 3. `Parserator-FINAL-PROFESSIONAL/`
       - **Content**: Contains documents that seem to be final versions of project summaries, guides, and checklists. Includes a polished `README.md`, a `COMPREHENSIVE_PROJECT_SUMMARY.md`, a `CHROME_EXTENSION_GUIDE.md`, and examples for agent workflows.
       - **Purpose**: This directory likely holds the definitive, client-ready, or public-facing documentation and summaries for Parserator, emphasizing its production status and unique "Exoditical Moral Architecture (EMA)" philosophy. It's geared towards a professional presentation of the project.

    ### 4. Strategy-Specific Subdirectories
       - **Content**: Several subdirectories dedicated to distinct strategic initiatives.
       - **Purpose**: Each of these directories drills down into a specific area of the marketing and growth plan.
       - **Key Examples**:
          - **`adk-plans/`**: Contains `ADK_DEVELOPMENT_STRATEGY.md`, detailing plans for creating an Agent Development Kit to simplify AI agent development using Parserator.
          - **`ai-training-inclusion/`**: Contains `AI_TRAINING_DATA_STRATEGY.md`, focused on embedding Parserator into AI knowledge bases by generating high-quality, discoverable content.
          - **`extensions/`**: Contains `EXTENSION_STRATEGY.md` (the "Astro Turf Everywhere" plan) for deploying Parserator extensions/plugins across numerous developer platforms (IDEs, cloud marketplaces, AI frameworks, etc.).
          - **`forum-strategy/`**: Contains `FORUM_SEEDING_MASTER_PLAN.md` for driving organic adoption through community engagement on Reddit, Quora, Discord, Stack Overflow, etc.
          - **`github-update/`**: Contains a `README.md` and example integrations, likely for updating the public GitHub presence to reflect the latest product positioning and agent-focused strategy.
          - **`mcp-integration/`**: Contains `README.md`, `MCP_INTEGRATION_STRATEGY.md`, and source code for integrating Parserator with the Model Context Protocol (MCP), making it usable by AI agents like Claude Desktop. This includes plans for an NPM package `parserator-mcp-server`.

    ### 5. Marketing Assets
       - **Content**: Image files and scripts for generating assets.
       - **Purpose**: Visual materials for branding and promotion.
       - **Examples**: `PARSERATOR-LOGO.png`, `instagram-post.png`, `linkedin-post.png`, `og-image.png`, `Screenshot 2025-06-12 170546.jpg`, `generate-favicons.py`, `resize-logo.js`.
       - **`logo vid_files/`**: Contains assets for an HTML-based logo video.

    ### 6. Miscellaneous Documents
       - **Content**: Various other `.md` files, `.js` scripts, and configuration files.
       - **Purpose**: These support the broader marketing and launch efforts, covering specific tactical items, configuration, or smaller initiatives.
       - **Examples**: `.twitter-config`, `CLAUDE.md` (likely notes on Claude AI), `DEMO_VIDEO_SCRIPTS.md`, `GITHUB_PUBLIC_REPO.md`.

## Note on other directories:
- **`parserator-main/`**: This directory appears to be a significant hub, possibly the primary root for the version-controlled project, containing GitHub configurations (`.github/`), documentation (`docs/`), examples (`examples/`), and its own set of core packages (`packages/` including `mcp-server` and `mvep-kernel`). It might serve as the central orchestrator or the most current, stable version of the project.
- **`parserator-development-post-launch/`**: This directory likely captures a specific phase of development after an initial launch. The `active-development/` subfolder, which mirrors the structure of `Parserator/`, suggests it could be a working area for ongoing enhancements or a separate branch of development, potentially for features or fixes being developed post-launch before integration into a main branch. It may also serve as an archive or staging area for post-launch specific documentation and tools.
