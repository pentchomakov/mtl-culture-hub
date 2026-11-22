---
title: "Application Development — Coding Standards & Guides"
source: https://github.com/compassanalytics/compass-standards/blob/176af68a7bea4e470dfac9fb88e93aa658c3057e/standards/application-development/general/coding-standards.md
repo: compassanalytics/compass-standards
path: standards/application-development/general/coding-standards.md
ref: 176af68a7bea4e470dfac9fb88e93aa658c3057e
retrieved: '2026-11-22'
docType: reference
group: Reference
---

> **Mirrored from `compassanalytics/compass-standards` at `176af68`, retrieved 2026-11-22.** The standard is the source of truth; edit it there and run `/standards-sync`. Reference, not evidence: cite it for how Compass builds things, never as a fact about the client.
# Application Development — Coding Standards & Guides

> **Status:** Draft
> **Owner:** Ethan Pirso
> **Last updated:** 2026-07-21
> **Source:** [Application Development Best Practices and Standards](../../../Compass%20Analytics/Compass%20Analytics%20Home/Engineering%20&%20IT/Best%20Practices,%20Standards%20and%20Guides/Application%20Development%20Best%20Practices%20and%20Standards.md) _(imported Confluence mirror)_
> **Applies to:** Application Development (Full Stack) — languages, design, frontend, backend, testing, security, observability

---

## Table of Contents

- [Overview & Scope](#overview--scope)
- [1. Programming Languages & Tooling](#1-programming-languages--tooling)
- [2. Design Standards](#2-design-standards)
- [3. Frontend Standards](#3-frontend-standards)
- [4. Backend Standards](#4-backend-standards)
- [5. Testing Standards](#5-testing-standards)
- [6. Security Standards](#6-security-standards)
- [7. Error Handling, Logging & Observability](#7-error-handling-logging--observability)
- [8. Reference Examples](#8-reference-examples)
- [Related Standards](#related-standards)
- [Change Log](#change-log)

---

## Overview & Scope

Cross-platform coding standards for application development: programming languages and tooling, design systems, frontend, backend, testing, security, and error handling / observability. These apply on every platform; see the [general standards](application-development-standards.md) for process and the platform docs for deployment specifics.


This section ensures consistent, high-quality, and maintainable codebases.

## 1. Programming Languages & Tooling

Compass standardizes on a small set of languages to maintain consistency across projects and enable developers to move between engagements efficiently. Each language has a specific role in the stack, and teams should follow the tooling and configuration standards described below.

### 1.1 Python

Python is the primary backend language at Compass. It powers APIs (Flask, FastAPI), data processing pipelines, and all development on Dataiku and Databricks platforms.

**Version.** As of this writing, Python 3.14.2 is the latest available version. However, 3.14 is still very new and may have compatibility issues with key libraries. For maximum compatibility—especially with machine learning, deep learning, and AI frameworks like PyTorch that depend on CUDA (which updates slowly)—we recommend staying 1-2 versions behind the latest release. Python 3.12.12 is the current recommended version for most projects.

**Dependency Management.** Use pip for dependency management. While tools like Poetry and uv offer additional features, pip provides maximum compatibility and simplicity across different environments, including Dataiku and Databricks runtimes. Pin dependencies in a `requirements.txt` file for reproducibility.

**Formatting and Linting.** Use Black for code formatting. Black enforces a consistent style with minimal configuration, eliminating debates about code formatting. Run Black as part of CI to ensure all committed code follows the standard style.

```bash
# Install Black
pip install black

# Format code
black .

# Check formatting without changes
black --check .
```

**PEP 8 Compliance.** All Python code should follow PEP 8, the Python style guide. Black handles most formatting concerns automatically, but developers should also be aware of these conventions:

- Maximum line length: 88 characters (Black's default, slightly longer than PEP 8's 79)
- Use 4 spaces for indentation (never tabs)
- Surround top-level functions and classes with two blank lines
- Use blank lines sparingly inside functions to indicate logical sections

**Type Hints.** Use type hints for all function signatures. Type hints improve code readability, enable better IDE support, and catch errors before runtime. While not enforced by the Python interpreter, they serve as documentation and can be validated with tools like mypy.

```py
from typing import Optional

def calculate_total(items: list[dict], discount: Optional[float] = None) -> float:
    """Calculate the total price of items with optional discount."""
    subtotal = sum(item["price"] * item["quantity"] for item in items)
    if discount:
        return subtotal * (1 - discount)
    return subtotal
```

**Naming Conventions.** Python uses different naming conventions for different constructs:

- `snake_case` for functions, methods, variables, and module names
- `PascalCase` (also called CapWords) for class names
- `SCREAMING_SNAKE_CASE` for constants
- `_single_leading_underscore` for internal/private attributes
- `__double_leading_underscore` for name mangling (rare, use sparingly)

```py
# Constants
MAX_RETRIES = 3
DEFAULT_TIMEOUT = 30

# Classes use PascalCase
class DatasetService:
    def __init__(self, dataset_name: str):
        self._dataset_name = dataset_name  # Internal attribute

    # Methods use snake_case
    def get_dataframe(self) -> pd.DataFrame:
        return self._fetch_data()

    def _fetch_data(self) -> pd.DataFrame:
        """Private method for internal use."""
        pass
```

**Documentation and Comments.** Write docstrings for all public modules, classes, and functions. Use the Google style for docstrings:

```py
def process_records(
    records: list[dict],
    batch_size: int = 100,
    validate: bool = True
) -> tuple[int, list[str]]:
    """Process a list of records in batches.

    Args:
        records: List of record dictionaries to process.
        batch_size: Number of records to process per batch.
        validate: Whether to validate records before processing.

    Returns:
        A tuple containing:
            - The number of successfully processed records
            - A list of error messages for failed records

    Raises:
        ValueError: If records is empty or batch_size is less than 1.
    """
    pass
```

Use inline comments sparingly—prefer self-documenting code with clear variable and function names. When comments are necessary, explain *why* something is done, not *what* is being done.

**Data Processing Libraries.** pandas and NumPy are the current standard libraries for data processing at Compass. Most existing projects use these libraries, and they integrate well with Dataiku and Databricks.

However, for new projects—especially those involving large datasets—teams should evaluate Polars as an alternative to pandas. Polars is a high-performance DataFrame library written in Rust that offers significant advantages:

- **Performance:** Polars is optimized for multithreaded execution and can be 10-100x faster than pandas on large datasets
- **Memory efficiency:** Uses Apache Arrow's columnar memory format, reducing memory overhead
- **Lazy evaluation:** LazyFrame API enables query optimization before execution
- **Consistent API:** Stricter API that avoids pandas' gotchas around mutability and indexing

```py
import polars as pl

# Create DataFrame from dictionary
df = pl.DataFrame({
    "name": ["Alice", "Ben", "Chloe"],
    "score": [85, 92, 78],
})

# Chain operations with expression API
result = df.select(
    pl.col("name"),
    (pl.col("score") * 1.1).alias("adjusted_score"),
).filter(pl.col("adjusted_score") > 80)

# Lazy evaluation for large datasets
lazy_df = pl.scan_csv("large_file.csv")
grouped = lazy_df.group_by("category").agg(pl.sum("value")).collect()
```

When choosing between pandas and Polars, consider:

- Use **pandas** when working with existing codebases, Dataiku integrations, or when team familiarity is a concern
- Use **Polars** for new projects with large datasets, performance-critical processing, or when building from scratch

### 1.2 TypeScript

TypeScript is the primary frontend language at Compass. All React applications must use TypeScript—JavaScript-only projects are not permitted for new development.

**Configuration.** Compass maintains a standard Vite + React + TypeScript boilerplate that provides pre-configured TypeScript settings, ESLint rules, and Prettier formatting. This boilerplate is available at

<https://github.com/compassanalytics/Vite-React-Typescript-Boiler>

(maintained by Julien Hovan). All new frontend projects should start from this template.

The boilerplate includes:

- TypeScript with strict mode enabled
- ESLint for code quality enforcement
- Prettier for consistent formatting
- Path aliases (`@/` prefix) for clean imports

**Type Safety.** Leverage TypeScript's type system fully. Avoid `any` types except in rare cases where dynamic typing is truly necessary. Define interfaces and types in a dedicated `types/` directory and export them via index files for clean imports.

**Formatting and Linting.** The boilerplate includes ESLint and Prettier configurations. Run these tools before committing:

```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format
```

### 1.3 Bash

Bash (or Zsh on macOS) is useful for scripting, build processes, and task automation. Shell scripts excel at orchestrating other tools and automating repetitive tasks.

**When to Use Shell Scripts.** Shell scripts are appropriate for:

- Build and compilation scripts
- Test runners and CI/CD task orchestration
- Cleanup and setup tasks
- Small automation scripts that primarily invoke other commands

AI assistants like Claude Code are particularly effective at writing shell scripts, making Bash a productive choice for automation tasks.

**Developer Preference.** Shell scripting is optional—use it if you're comfortable with it. Developers on macOS can use Bash or Zsh directly; Windows developers should use Windows Subsystem for Linux (WSL) for shell scripting. Python is always an acceptable alternative for scripting tasks, especially for more complex logic or cross-platform requirements.

**Style Guidelines.** For scripts that will be shared or maintained long-term, consider using ShellCheck to catch common issues. Keep scripts simple and well-commented—if a script grows complex, consider rewriting it in Python.

## 2. Design Standards

Visual and interaction consistency across applications is essential for delivering a cohesive user experience and enabling efficient development. This section establishes the design standards that all Compass applications should follow.

*This section requires input from the Design team.* Jerry Zhu *(Design Lead) should complete the following.*

### 2.1 Shadcn

Shadcn/ui is the standard component library for all Compass frontend applications. It provides accessible, customizable components built on Radix UI primitives and styled with Tailwind CSS.

**Questions to address:**

1. How should Shadcn components be customized? Are there restrictions on modifications to base components?
2. Is there a default theme or color palette that all projects should use as a starting point?
3. Should developers copy components into their project (the default shadcn approach) or use a shared internal package?
4. What is the process for adding new components that don't exist in the shadcn library?
5. Are there specific components that should always be used for certain UI patterns (e.g., always use Dialog for modals, Sheet for side panels)?

### 2.2 True North Design System

True North is Compass's enterprise design system, intended to provide a complete component library with Figma assets linked directly to React/TypeScript components.

**Questions to address:**

1. What is the current state of True North? Is it in active use, planned, or in development?
2. Where do design tokens, color palettes, and typography definitions live (Figma, GitHub, both)?
3. How does True North relate to Shadcn—is it built on top of Shadcn, or a separate system?

   1. True North is built on top of Shadcn, the Figma part of the design system → the other part will be the frontend components which are also built using Shadcn
4. What is the timeline for True North availability, and what should teams use in the meantime?
5. Who owns True North, and what is the process for contributing or requesting changes?
6. Where are the Figma files located, and how should developers reference them during implementation?

### 2.3 Design Driven Development

Aligned with the App Building Process outlined in [App Building Process](application-development-standards.md#2-app-building-process), all frontend development at Compass should be design driven. Backend development is requirements-driven, following the User Requirements Specification (URS) established in [Requirements & Discovery](application-development-standards.md#21-requirements--discovery). For frontend work, designs are created, reviewed, and approved before implementation begins, and the Figma design file remains the source of truth for how an application looks and functions throughout the development lifecycle.

**Design as the Source of Truth.** The Figma design file should always be kept up to date and accurately describe the application's appearance and behavior. When requirements change or new features are added, the design is updated first. Frontend developers reference the design during implementation and should raise questions if the design is unclear or incomplete.

**Designer-Developer Collaboration.** Effective handoff between designers and frontend developers is critical to maintaining design fidelity. Designers communicate functionality and behavior through two primary mechanisms:

- **Prototypes.** For complex interactions, designers create interactive prototypes in Figma that demonstrate user flows, transitions, and dynamic behavior. Developers can click through these prototypes to understand intended functionality.
- **Annotations.** For behavior that cannot be captured in a prototype—such as edge cases, conditional logic, or detailed specifications—designers add annotations directly to the design. Use `Shift + T` in Figma to add annotation text that describes frontend behavior, validation rules, or other implementation details.

**Communication in Figma.** Questions and discussions about a design should happen directly in Figma using comments. Press `C` in Figma to add a comment at a specific location. This keeps conversations contextual and creates a record of design decisions. Avoid using Teams or email for design questions when a Figma comment would be more appropriate.

**Frontend Developer Workflow.** When implementing a design:

1. Review the Figma design and any associated prototypes or annotations
2. Use the Figma MCP (see [Figma MCP](#33-figma-mcp)) to capture design specifications for AI-assisted implementation
3. Use the Shadcn MCP (see [Shadcn MCP](#32-shadcn-mcp)) to ensure correct component usage
4. If the design is unclear or incomplete, add a comment in Figma requesting clarification
5. Once implementation is complete, verify against the design and note any intentional deviations

**Keeping Designs Current.** Designs should reflect the current state of the application. When implementation reveals that a design doesn't work as intended, or when stakeholder feedback leads to changes, the design must be updated to match. Outdated designs lead to confusion and inconsistent implementations.

**Resources.** For Figma keyboard shortcuts and UI/UX workflow tips, see the internal documentation: [Figma Shortcuts](https://compassdataanalytics.atlassian.net/wiki/spaces/CA/pages/871956482/Figma+Shortcuts).

## 3. Frontend Standards

Frontend development at Compass follows a consistent stack: Vite as the build tool, React as the UI framework, TypeScript for type safety, and Shadcn for UI components. This combination provides fast development cycles, strong type checking, and a cohesive design system.

AI-assisted development is a key part of the frontend workflow, grounded in the Design Driven Development philosophy ([Design Driven Development](#23-design-driven-development)). Developers use Claude Code with two MCP integrations—Figma MCP for capturing design specifications and Shadcn MCP for ensuring correct component usage. This combination prevents common mistakes (such as implementing the wrong component library) and accelerates design-to-code translation.

### 3.1 Vite + React

All Compass frontend applications use Vite as the build tool and React as the UI framework. The standard boilerplate is available at

<https://github.com/compassanalytics/Vite-React-Typescript-Boiler>

(maintained by Julien Hovan).

**Getting Started.** Clone the boilerplate and install dependencies:

```bash
git clone https://github.com/compassanalytics/Vite-React-Typescript-Boiler.git my-project
cd my-project
npm install
npm run dev
```

The development server runs at `<http://localhost:5173`> with hot module replacement enabled.

**Project Structure.** The boilerplate establishes a standard folder structure that all projects should follow:

```java
src/
├── assets/           # Static assets (images, icons, etc.)
├── components/       # Reusable UI components
├── constants/        # Application constants and config
├── features/         # Feature-based modules (optional)
├── hooks/            # Custom React hooks
├── layouts/          # Layout components
├── pages/            # Page components
├── services/         # API services and external integrations
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
├── App.tsx           # Root application component
├── main.tsx          # Application entry point
└── index.css         # Global styles
```

**Component Organization.** Each component should be in its own folder with an index file for exports:

```java
// components/Button/Button.tsx
export function Button() { ... }

// components/Button/index.ts
export { Button } from './Button';
```

**Path Aliases.** Use the `@/` prefix for clean imports instead of relative paths:

```java
import { Button } from '@/components';
import { apiService } from '@/services';
import { ROUTES } from '@/constants';
```

**Environment Variables.** Store environment-specific configuration in `.env` files. Prefix all variables with `VITE_` to expose them to the application:

```bash
VITE_API_BASE_URL=http://localhost:3000/api
```

Access variables in code using `import.meta.env`:

```java
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

**State Management.** The boilerplate does not include state management by default. For projects that need it, recommended options include Zustand (minimal and modern), TanStack Query (for server state and data fetching), or React Context (for simple shared state).

**Available Scripts.** The boilerplate includes standard npm scripts:

- `npm run dev` — Start development server
- `npm run build` — Build for production (outputs to `dist/`)
- `npm run preview` — Preview production build locally
- `npm run lint` / `npm run lint:fix` — Run ESLint
- `npm run format` / `npm run format:check` — Run Prettier

### 3.2 Shadcn MCP

The Shadcn MCP server provides Claude Code with access to Shadcn component documentation, examples, and implementation patterns. This integration ensures that AI-generated code uses the correct components from the Shadcn library rather than substituting components from other libraries (such as MUI or Chakra).

**Why This Matters.** Without explicit component context, AI assistants may implement designs using whichever component library they are most familiar with. This has caused issues in the past—for example, a developer captured a Figma design using Shadcn components but Claude implemented it using MUI, requiring rework. The Shadcn MCP prevents this by giving Claude direct access to Shadcn's component catalog.

**Installation.** Install the Shadcn MCP server using the Claude Code CLI.

Basic usage (60 requests/hour):

```bash
npx @jpisnice/shadcn-ui-mcp-server
```

With GitHub token (5000 requests/hour) — recommended for heavy usage:

```bash
npx @jpisnice/shadcn-ui-mcp-server --github-api-key ghp_your_token_here
```

For persistent setup with Claude Code, use SSE transport:

```bash
# Start the server in SSE mode
node build/index.js --mode sse --port 7423

# Add to Claude Code (user scope for global availability)
claude mcp add --scope user --transport sse shadcn-mcp-server http://localhost:7423/sse
```

Manage your MCP servers with these commands:

```bash
claude mcp list              # List all configured servers
claude mcp get shadcn-mcp-server    # Get details for a specific server
claude mcp remove shadcn-mcp-server # Remove a server
```

The GitHub Personal Access Token is optional but recommended to avoid rate limiting. Create a token at

<https://github.com/settings/tokens>

with no special scopes required (public repository access is sufficient).

**Usage.** When working on frontend code, prompt Claude to use Shadcn components explicitly:

- "Implement this form using Shadcn components"
- "Use the Shadcn Button and Dialog components for this interaction"
- "Check the Shadcn documentation for the correct Select component API"

Claude will query the MCP server to retrieve accurate component documentation, props, and usage patterns. This ensures implementations match the actual Shadcn API rather than hallucinated or outdated information.

**Available Tools.** The Shadcn MCP server provides Claude with tools to:

- List all available Shadcn components
- Retrieve detailed documentation for specific components
- Access code examples and demos
- Get block templates (pre-built component compositions)

**Best Practice.** Always use Shadcn MCP together with Figma MCP during design implementation. The workflow is:

1. Use Figma MCP to capture design specifications and styles
2. Use Shadcn MCP to ensure correct component selection and implementation
3. Review generated code against both the design and component documentation

### 3.3 Figma MCP

The Figma MCP server connects Claude Code directly to Figma designs, enabling AI-assisted design-to-code translation. When a developer selects elements in Figma, Claude can read the design specifications—colors, spacing, typography, layout—and generate corresponding React code.

**Prerequisites.** Figma MCP requires the Figma desktop application (not the web version). The MCP server communicates with the desktop app to read the current selection.

**Installation.** Compass recommends the **Dev Server** setup, which provides real-time access to design selections. Follow the official setup instructions at <https://developers.figma.com/docs/figma-mcp-server/local-server-installation/>

1. Open the Figma desktop app
2. Enable Dev Mode (press `Shift+D` or use the toggle in the toolbar)
3. The MCP server runs locally at `<http://127.0.0.1:3845/mcp`>

Add the server to Claude Code using the terminal:

```bash
# Add to current project
claude mcp add --transport http figma-desktop http://127.0.0.1:3845/mcp

# Or add globally (recommended for all projects)
claude mcp add --scope user --transport sse figma-dev-mode-mcp-server http://127.0.0.1:3845/sse
```

Manage your MCP servers with these commands:

```bash
claude mcp list              # List all configured servers
claude mcp get figma-desktop # Get details for a specific server
claude mcp remove figma-desktop # Remove a server
```

**How It Works.** The Figma MCP operates using selection-based context:

1. Open your design file in Figma desktop
2. Select the frame, component, or element you want to implement
3. In Claude Code, ask Claude to implement the selected design
4. Claude reads the selection's properties (dimensions, colors, fonts, spacing, children) and generates code

Example prompt: "Implement the currently selected Figma component as a React component using Shadcn"

**Workflow: Figma + Shadcn MCP Together.** The recommended workflow combines both MCPs:

1. **Design Capture (Figma MCP).** Select elements in Figma to give Claude access to:

   - Visual specifications (colors, spacing, typography)
   - Layout structure (flex, grid, positioning)
   - Component hierarchy (parent-child relationships)
   - Design tokens and styles
2. **Component Implementation (Shadcn MCP).** With the design context established, Claude uses Shadcn MCP to:

   - Map design elements to the correct Shadcn components
   - Apply proper props and variants
   - Follow Shadcn patterns for composition
3. **Review and Refine.** Developer reviews the generated code against:

   - Visual fidelity to the Figma design
   - Correct Shadcn component usage
   - Accessibility and responsiveness

**Why Both MCPs Are Needed.** Figma MCP provides the "what" (visual specifications) while Shadcn MCP provides the "how" (correct implementation). Without Shadcn MCP, Claude might recognize a button in Figma but implement it using a different component library. Without Figma MCP, Claude lacks precise design specifications and must work from descriptions alone.

**Common Issues.**

- **Selection not detected.** Ensure you're using the Figma desktop app with Dev Mode enabled, not the browser version.
- **Server not responding.** Check that the MCP server is running at `<http://127.0.0.1:3845/mcp`.> Restart Figma if needed.
- **Missing design details.** Select more specific elements rather than entire frames for detailed specifications.

## 4. Backend Standards

Backend development at Compass uses Python as the primary language, with Flask and FastAPI as the two supported web frameworks. The choice between them depends on the platform, project requirements, and team preferences. This section provides guidance on when to use each framework, standard project structure, and patterns for building maintainable backend services.

Tech Leads make the framework decision at project inception based on platform constraints and project needs. This document does not prescribe "use this, not that"—instead, it provides standards for whichever framework you choose.

**Reference Project Structure.** The following structure serves as a guideline for backend projects. Actual structure may vary by application type and scope:

```java
backend/
├── routes/                 # HTTP routes / API endpoints (Flask blueprints or FastAPI routers)
├── services/               # Business logic and orchestration
├── data_layer/             # Integration with external data platform
│   ├── compiler/           # Dataset build/compile logic
│   └── preprocessing/      # Data transformations before/after I/O
├── cache/                  # Caching logic and cache helpers
├── config/                 # Environment- and client-specific configuration
├── utils/                  # Shared utilities
│   ├── io/                 # File and data I/O helpers
│   ├── logging/            # Logging setup and helpers
│   ├── validation/         # Lightweight input validation
│   ├── dates/              # Date/time utilities
│   └── misc/               # General-purpose helpers
├── app.py                  # Application factory and app setup
├── wsgi.py                 # Production entrypoint (optional)
├── requirements.txt        # Python dependencies
├── README.md               # Project documentation
├── tests/                  # Unit and integration tests
├── scripts/                # Operational and developer scripts
│   └── build/              # Build/packaging scripts
├── out/                    # Runtime outputs (logs, temp files)
└── build/                  # Generated build artifacts
```

**Key Organizational Principles:**

- **routes/** — API endpoints only; no business logic. Routes call services.
- **services/** — Business logic lives here. Services orchestrate data access, transformations, and external calls.
- **data_layer/** — All data platform integration (Dataiku datasets, Databricks tables, database connections).
- **config/** — Environment-specific configuration using Pydantic settings or similar patterns.
- **utils/** — Shared utilities that don't fit elsewhere. Keep utilities small and focused.

### 4.1 Flask

Flask is a lightweight, flexible web framework well-suited for simpler APIs and platform-constrained environments. It is the native backend framework for Dataiku webapps and remains a solid choice for projects where simplicity outweighs the need for async performance.

**When to Use Flask:**

- Dataiku webapp development (Flask is natively supported)
- Simpler APIs with straightforward request/response patterns
- Projects where team familiarity with Flask is high
- Backends that don't require async I/O or high concurrency

**Basic Flask Application Structure:**

```py
from flask import Flask, jsonify, request

app = Flask(__name__)

@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy"})

@app.route("/api/items", methods=["GET"])
def get_items():
    """Retrieve all items."""
    # Call service layer, not direct data access
    items = item_service.get_all()
    return jsonify(items)

@app.route("/api/items/<int:item_id>", methods=["GET"])
def get_item(item_id: int):
    """Retrieve a specific item by ID."""
    item = item_service.get_by_id(item_id)
    if not item:
        return jsonify({"error": "Item not found"}), 404
    return jsonify(item)

if __name__ == "__main__":
    app.run(debug=True)
```

**Using Blueprints for Route Organization.** For larger applications, organize routes using Flask Blueprints:

```py
# routes/items.py
from flask import Blueprint, jsonify

items_bp = Blueprint("items", __name__, url_prefix="/api/items")

@items_bp.route("/", methods=["GET"])
def get_items():
    return jsonify(item_service.get_all())

@items_bp.route("/<int:item_id>", methods=["GET"])
def get_item(item_id: int):
    return jsonify(item_service.get_by_id(item_id))
```

```py
# app.py
from flask import Flask
from routes.items import items_bp

def create_app():
    app = Flask(__name__)
    app.register_blueprint(items_bp)
    return app
```

**Flask in Dataiku.** When deploying Flask backends to Dataiku's standard webapp interface, all backend code must be compiled into a single `backend.py` file. The Dataiku runtime handles app initialization, so the compiled file should not include app initialization, WSGI configuration, or blueprint registration—use the `@app.route(...)` decorator directly. See [Standard Webapp Architecture](../dataiku/dataiku-standards.md#27-standard-webapp-architecture) for detailed single-file compilation patterns and deployment scripts.

**Documentation:** <https://flask.palletsprojects.com/>

### 4.2 FastAPI

FastAPI is a modern, high-performance web framework built on Starlette and Pydantic. It provides automatic API documentation, type validation, and async support out of the box. FastAPI is the preferred choice for new backend services outside of Dataiku.

**When to Use FastAPI:**

- Databricks Apps (FastAPI integrates well with the runtime)
- Cloud deployments (AWS Lambda, Azure Functions, containerized services)
- APIs requiring high concurrency or async I/O
- Projects that benefit from automatic OpenAPI documentation
- New projects where platform doesn't constrain framework choice

**Basic FastAPI Application Structure:**

```py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="My API", version="1.0.0")

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

@app.get("/api/items")
async def get_items():
    """Retrieve all items."""
    return item_service.get_all()

@app.get("/api/items/{item_id}")
async def get_item(item_id: int):
    """Retrieve a specific item by ID."""
    item = item_service.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@app.post("/api/items", status_code=201)
async def create_item(item: Item):
    """Create a new item."""
    return item_service.create(item.model_dump())
```

**Using Routers for Route Organization.** FastAPI's `APIRouter` is equivalent to Flask's Blueprints:

```py
# routes/items.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/items", tags=["items"])

class Item(BaseModel):
    name: str
    description: str | None = None
    price: float

@router.get("/")
async def get_items():
    return item_service.get_all()

@router.get("/{item_id}")
async def get_item(item_id: int):
    item = item_service.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
```

```py
# app.py
from fastapi import FastAPI
from routes.items import router as items_router

app = FastAPI(title="My API")
app.include_router(items_router)
```

**Pydantic for Request/Response Validation.** FastAPI uses Pydantic models for automatic request validation and response serialization:

```py
from pydantic import BaseModel, Field
from typing import Literal

class FilterParams(BaseModel):
    limit: int = Field(100, gt=0, le=100)
    offset: int = Field(0, ge=0)
    order_by: Literal["created_at", "updated_at"] = "created_at"

@router.get("/")
async def get_items(filters: FilterParams = Depends()):
    return item_service.get_all(
        limit=filters.limit,
        offset=filters.offset,
        order_by=filters.order_by
    )
```

**Configuration with Pydantic Settings.** Use `pydantic-settings` for environment-based configuration:

```py
# config/settings.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "My API"
    debug: bool = False
    database_url: str
    api_key: str

    class Config:
        env_file = ".env"

settings = Settings()
```

**Dependency Injection.** FastAPI's dependency injection system enables clean, testable code:

```py
from fastapi import Depends
from functools import lru_cache

@lru_cache()
def get_settings():
    return Settings()

@app.get("/info")
async def info(settings: Settings = Depends(get_settings)):
    return {"app_name": settings.app_name}
```

**Running FastAPI.** Use Uvicorn as the ASGI server:

```bash
# Development
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Production
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4
```

**Documentation:** <https://fastapi.tiangolo.com/>

### 4.3 FastMCP

FastMCP is a Python framework for building Model Context Protocol (MCP) servers. Use FastMCP when you need to expose tools, resources, or data to AI agents like Claude Code.

**When to Use FastMCP:**

- Building agent tools that Claude Code or other LLMs can invoke
- Exposing application functionality to AI assistants
- Creating data access layers for AI-powered workflows
- Building custom MCP servers for Compass-specific integrations

**Basic FastMCP Server:**

```py
from fastmcp import FastMCP

mcp = FastMCP(name="MyToolServer")

@mcp.tool
def calculate_sum(a: int, b: int) -> int:
    """Add two numbers together."""
    return a + b

@mcp.tool
def search_records(query: str, limit: int = 10) -> list[dict]:
    """Search records in the database."""
    return record_service.search(query, limit=limit)

if __name__ == "__main__":
    mcp.run()
```

**Exposing Resources.** Resources provide read-only data access to AI agents:

```py
@mcp.resource("data://config/settings")
def get_settings() -> str:
    """Return application settings as JSON."""
    return json.dumps(settings.model_dump())

@mcp.resource("data://users/{user_id}")
def get_user(user_id: str) -> str:
    """Return user data by ID."""
    user = user_service.get_by_id(user_id)
    return json.dumps(user)
```

**Adding to Claude Code.** Register your FastMCP server with Claude Code:

```bash
# For HTTP transport
claude mcp add --transport http my-tools http://localhost:8000/mcp

# For SSE transport (recommended for persistent connections)
claude mcp add --scope user --transport sse my-tools http://localhost:8000/sse
```

**Deployment on Databricks Apps.** FastMCP servers can be deployed as Databricks Apps, providing AI tool access to enterprise data. See [Databricks Apps](../databricks-apps/databricks-apps-standards.md#21-databricks-apps) for `app.yaml` configuration examples and deployment guidance.

**Documentation:** <https://gofastmcp.com/>

### 4.4 Flask vs FastAPI: Choosing the Right Framework

The framework decision is made by the Tech Lead at project inception. Here's guidance for making that choice:

|  Factor            |  Flask                    |  FastAPI                |
|:-------------------|:--------------------------|:------------------------|
| **Platform**       | Dataiku (native support)  | Databricks Apps, Cloud  |
| **Performance**    | Synchronous, moderate     | Async, high performance |
| **Type Safety**    | Manual validation         | Automatic via Pydantic  |
| **API Docs**       | Manual (Swagger/Flasgger) | Automatic OpenAPI       |
| **Learning Curve** | Lower                     | Moderate                |
| **Ecosystem**      | Mature, extensive         | Growing rapidly         |

**Choose Flask when:**

- Building on Dataiku (path of least resistance)
- Team is more familiar with Flask
- Simple CRUD APIs without complex async requirements
- Project timeline doesn't allow for learning FastAPI

**Choose FastAPI when:**

- Building on Databricks Apps or cloud platforms
- High concurrency or async I/O is needed
- Automatic API documentation is valuable
- Starting a new project with flexibility to choose

**Neither is wrong.** Both frameworks produce maintainable, production-ready applications when used correctly. The standards in this document apply equally to both.

### 4.5 Authentication & Platform Integration

Authentication is typically handled at the platform level. Applications inherit the authentication mechanisms of their hosting platform, simplifying security implementation.

**Dataiku Authentication.** Dataiku webapps inherit the instance's Single Sign-On (SSO) configuration. When users navigate to the webapp URL, they're prompted to authenticate using the same SSO provider configured for the Dataiku instance. This means:

- Users must be provisioned in Dataiku with appropriate group access
- No custom authentication code is required in the webapp
- User identity is available through the Dataiku API

**Accessing User Information in Dataiku.** Use the Dataiku API to retrieve the authenticated user from browser headers:

```py
import dataiku
from flask import request

def get_user():
    """Retrieves the authenticated Dataiku user based on request headers."""
    headers = dict(request.headers)
    auth_info = dataiku.api_client().get_auth_info_from_browser_headers(headers)
    return auth_info["authIdentifier"]
```

For detailed information on authentication in Dataiku webapps, see the official documentation: <https://developer.dataiku.com/latest/concepts-and-examples/authinfo.html>

**Role-Based Content Gating.** To show different views based on user roles (for example, a manager view vs. analyst view), configure security groups in Dataiku based on role. The authenticated user's group membership is available through the auth info, allowing your backend to conditionally return different data or UI configurations based on the user's assigned groups.

**Databricks Authentication.** Databricks Apps use service principals for backend operations and inherit workspace authentication for user-facing requests. Users must be provisioned in the Databricks workspace with appropriate permissions.

**Cloud Authentication.** For cloud deployments without platform-provided auth, implement authentication using established patterns:

- AWS: Cognito, API Gateway authorizers
- Azure: Entra ID (Azure AD), Azure API Management

See [Authentication & Authorization](#61-authentication--authorization) for detailed authentication and authorization patterns.

## 5. Testing Standards

Testing ensures applications behave correctly, meet requirements, and remain stable through changes. This section establishes the testing frameworks, strategies, and expectations for Compass applications.

**Testing Philosophy.** Tests are not optional—they are part of delivering quality software. However, testing should be pragmatic. Focus testing effort where it provides the most value: critical business logic, complex algorithms, and user-facing flows. Not every line of code needs a test, but every important behavior does.

**Recommended Frameworks:**

|  Stack       |  Framework            |  Purpose                     |
|:-------------|:----------------------|:-----------------------------|
| **Python**   | pytest                | Unit and integration testing |
| **Frontend** | Vitest                | Unit testing (Vite-native)   |
| **Frontend** | React Testing Library | Component testing            |
| **E2E**      | Playwright            | End-to-end browser testing   |

**Test Strategy: Manual First, Then Automate.** For many projects, the practical approach is:

1. Write tests that can be run manually during development
2. Validate tests work locally before committing
3. Automate test execution in CI/CD with GitHub Actions
4. Require passing tests before merging PRs

### 5.1 Unit Testing

Unit tests validate individual functions, classes, and modules in isolation. They run fast, provide immediate feedback, and catch regressions early.

**Python: pytest.** pytest is the standard testing framework for Python backends. It provides simple syntax, powerful fixtures, and excellent plugin support. Use fixtures in `conftest.py` for shared test setup like database connections or sample data.

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=src --cov-report=html
```

**Frontend: Vitest.** Vitest is the recommended unit testing framework for frontend code. It's Vite-native, fast, and compatible with Jest's API. Configure it in your `vite.config.ts` under the `test` property with `environment: 'jsdom'` for DOM testing.

```bash
# Run tests in watch mode (development)
npm run test

# Run tests once with coverage (CI)
npm run test -- --run --coverage
```

**React Testing Library.** For testing React components, use React Testing Library alongside Vitest. It encourages testing components the way users interact with them—by role, label, and text content rather than implementation details.

**Documentation:**

- pytest: <https://docs.pytest.org/>
- Vitest: <https://vitest.dev/>
- React Testing Library: <https://testing-library.com/docs/react-testing-library/intro/>

### 5.2 Integration Testing

Integration tests verify that components work together correctly. They test interactions between services, databases, APIs, and external systems.

**When to Write Integration Tests:**

- Testing API endpoints with actual request/response cycles
- Verifying database operations (CRUD, transactions)
- Testing service-to-service communication
- Validating third-party API integrations

For Python backends, pytest works well for integration tests using Flask's test client or FastAPI's async test client with httpx. For frontend integration tests that don't require a full browser, use Vitest with mocked API responses.

### 5.3 End-to-End Testing

End-to-end (E2E) tests validate complete user flows through the application, from UI to backend to database. Playwright is the recommended tool for E2E testing.

**Playwright Overview.** Playwright provides cross-browser testing (Chromium, Firefox, WebKit), auto-waiting, and powerful debugging tools. It can test both full applications and individual components.

```bash
# Initialize Playwright
npm init playwright@latest

# Run tests
npx playwright test

# Run with UI mode (interactive debugging)
npx playwright test --ui
```

**Playwright Component Testing.** Playwright can also test individual components in isolation, providing a middle ground between unit tests and full E2E tests. Initialize with `npm init playwright@latest -- --ct` for component testing support.

**Documentation:** <https://playwright.dev/>

### 5.4 CI/CD Integration

Automate test execution with GitHub Actions to ensure tests run on every push and pull request.

**Example GitHub Actions Workflow:**

```java
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run pytest
        run: pytest --cov=src --cov-report=xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run Vitest
        run: npm run test -- --run --coverage
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run Playwright
        run: npx playwright test
```

**Test Requirements for PRs.** Configure branch protection rules in GitHub to require passing tests before merging:

1. Go to repository Settings → Branches
2. Add branch protection rule for `main`
3. Enable "Require status checks to pass before merging"
4. Select the test workflows as required checks

**Documentation:** <https://docs.github.com/en/actions>

## 6. Security Standards

Security is a shared responsibility across all application development. These standards establish baseline security practices that all Compass applications must follow, regardless of platform.

### 6.1 Authentication & Authorization

**Platform-Provided Authentication.** Most Compass applications inherit authentication from their hosting platform. See [Authentication & Platform Integration](#45-authentication--platform-integration) for platform-specific authentication details:

- **Dataiku:** SSO integration with user identity via `get_auth_info_from_browser_headers()`
- **Databricks:** Workspace authentication with service principals for backend operations
- **Cloud:** AWS Cognito, Azure Entra ID (Azure AD), or equivalent identity providers

**Authorization Patterns.** Authorization determines what authenticated users can do. Implement authorization at the API layer:

- Define roles and permissions based on business requirements
- Enforce authorization checks on every protected endpoint
- Use platform group membership (Dataiku groups, Azure AD groups) when available
- Never rely solely on frontend checks — always validate on the backend

**Session Management.** For applications that manage their own sessions:

- Use secure, HTTP-only cookies for session tokens
- Implement appropriate session timeouts
- Invalidate sessions on logout
- Rotate session tokens after authentication

### 6.2 Secrets Management

**Never commit secrets to repositories.** This includes API keys, database credentials, tokens, and any sensitive configuration.

**Environment Variables.** Store secrets in environment variables, not in code:

- Use `.env` files for local development (add to `.gitignore`)
- Use platform-provided secret storage for deployed environments:

  - **Dataiku:** Project variables marked as "sensitive"
  - **Databricks:** Databricks secrets with scope and key management
  - **AWS:** Secrets Manager or Parameter Store
  - **Azure:** Key Vault

**Pre-Commit Checks.** Configure pre-commit hooks to detect accidental secret commits:

```java
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

**If secrets are accidentally committed:** Rotate the secret immediately. Removing it from git history is insufficient — assume the secret is compromised.

### 6.3 Input Validation & Sanitization

All user input is untrusted. Validate and sanitize input to prevent injection attacks and other vulnerabilities.

**Validation Principles:**

- Validate on the server, not just the client
- Use allowlists over denylists when possible
- Reject invalid input rather than attempting to fix it
- Use framework-provided validation (Pydantic for FastAPI, WTForms for Flask)

**Common Vulnerabilities to Prevent:**

|  Vulnerability             |  Prevention                                                                                               |
|:---------------------------|:----------------------------------------------------------------------------------------------------------|
| SQL Injection              | Use parameterized queries or ORM. Never concatenate user input into SQL strings.                          |
| XSS (Cross-Site Scripting) | Escape output in templates. Use React's default escaping. Avoid `dangerouslySetInnerHTML`.                |
| Command Injection          | Avoid shell execution with user input. Use subprocess with argument lists, not shell strings.             |
| Path Traversal             | Validate file paths. Use `os.path.basename()` or equivalent. Never use user input directly in file paths. |

**API Input Validation.** Define explicit schemas for all API inputs:

```py
# FastAPI with Pydantic
from pydantic import BaseModel, Field, validator

class UserInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')

    @validator('name')
    def sanitize_name(cls, v):
        return v.strip()
```

### 6.4 AI/LLM Input & Output Sanitization

Applications that integrate AI or LLM features require additional sanitization to prevent prompt injection and protect sensitive data.

**Prompt Injection Prevention.** User input that becomes part of LLM prompts can manipulate model behavior. Mitigate this by:

- Separating user content from system instructions clearly
- Sanitizing special characters that could be interpreted as prompt delimiters (`<`, `>`, `{{`, `}}`, markdown formatting)
- Validating that user input matches expected patterns before including in prompts
- Using structured prompts with clear boundaries between instruction and user content

**Example sanitization for prompt input:**

```py
import re

def sanitize_for_prompt(user_input: str) -> str:
    """Remove or escape characters that could interfere with prompts."""
    # Remove potential prompt injection patterns
    sanitized = re.sub(r'[<>{}[\]|\\]', '', user_input)
    # Collapse excessive whitespace
    sanitized = re.sub(r'\s+', ' ', sanitized).strip()
    # Truncate to reasonable length
    return sanitized[:2000]
```

**PII Detection and Handling.** When user input may contain personally identifiable information (PII) that shouldn't be sent to external LLM APIs:

- Implement PII detection before sending data to LLM services
- Common PII patterns to detect: email addresses, phone numbers, addresses, patient health IDs
- Options for handling detected PII:

  - Raise a warning and block the request
  - Redact PII before sending (replace with `[REDACTED]` or `[EMAIL]` placeholders)
  - Log the detection for audit purposes

**Example PII detection patterns:**

```py
import re

PII_PATTERNS = {
    'email': r'\b[\w\.-]+@[\w\.-]+\.\w+\b',
    'phone': r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
}

def detect_pii(text: str) -> dict[str, list[str]]:
    """Detect potential PII in text. Returns dict of PII type to matches."""
    detected = {}
    for pii_type, pattern in PII_PATTERNS.items():
        matches = re.findall(pattern, text)
        if matches:
            detected[pii_type] = matches
    return detected

def redact_pii(text: str) -> str:
    """Replace detected PII with redaction placeholders."""
    for pii_type, pattern in PII_PATTERNS.items():
        text = re.sub(pattern, f'[{pii_type.upper()}]', text)
    return text
```

**LLM Output Validation.** Model responses may contain unexpected content. Validate outputs before displaying to users or using in downstream operations:

- Check that responses conform to expected formats (JSON schema validation if applicable)
- Sanitize for XSS if rendering in a web context
- Validate any extracted data (URLs, code, commands) before use

### 6.5 Dependency Security

Third-party dependencies are a common attack vector. Maintain awareness of vulnerabilities in your dependency tree.

**Dependency Scanning.** Integrate vulnerability scanning into your workflow:

- **Python:** Use `pip-audit` or `safety` to scan for known vulnerabilities
- **Node.js:** Run `npm audit` to check for vulnerable packages
- **GitHub:** Enable Dependabot alerts and security updates

**Update Policies:**

- Review and apply security patches promptly (within days, not weeks)
- Keep dependencies reasonably current — outdated packages accumulate vulnerabilities
- Pin dependency versions in production for reproducibility
- Test updates in development before deploying

**GitHub Actions for Dependency Scanning:**

```java
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly scan

jobs:
  python-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install pip-audit
      - run: pip-audit -r requirements.txt

  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit --audit-level=high
```

**Minimize Dependencies.** Only add dependencies that provide significant value. Each dependency increases your attack surface and maintenance burden.

## 7. Error Handling, Logging & Observability

Applications must be debuggable, monitorable, and maintainable in production. This section establishes standards for error handling, logging, and observability that help teams identify and resolve issues quickly.

**Platform Logging Context.** Dataiku and Databricks both provide built-in logging infrastructure for their application servers. The focus here is on extending and complementing that logging with application-specific context, not replacing it.

### 7.1 Error Handling Patterns

Consistent error handling improves debugging and user experience. Errors should be caught, logged with context, and communicated appropriately to users.

**Principles:**

- Catch specific exceptions, not generic `Exception` unless re-raising
- Log errors with sufficient context to debug (user ID, request ID, input parameters)
- Return user-friendly messages to the frontend; keep stack traces in logs
- Fail fast for unrecoverable errors; degrade gracefully when possible

**Backend Error Handling.** Use structured error responses with consistent formats:

```py
# FastAPI exception handler
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors with logging and user-friendly response."""
    request_id = request.headers.get("X-Request-ID", "unknown")
    logger.error(
        f"Unhandled error",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
            "error": str(exc),
        },
        exc_info=True
    )
    return JSONResponse(
        status_code=500,
        content={"error": "An unexpected error occurred", "request_id": request_id}
    )
```

**Frontend Error Handling.** Display user-friendly messages and log errors for debugging:

```java
// Error boundary for React components
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Component error:', error, info.componentStack);
    // Send to error tracking service if configured
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <div>Something went wrong.</div>;
    }
    return this.props.children;
  }
}
```

**Graceful Degradation.** When non-critical features fail, the application should continue functioning:

- Cache fallback data for read operations when live data is unavailable
- Disable non-essential features rather than showing error pages
- Queue failed write operations for retry when appropriate

### 7.2 Logging Conventions

Structured logging makes logs searchable and analyzable. Use consistent log levels and include relevant context in every log entry.

**Log Levels:**

|  Level       |  Use Case                                                                 |
|:-------------|:--------------------------------------------------------------------------|
| **DEBUG**    | Detailed information for diagnosing issues (not in production)            |
| **INFO**     | Normal operational messages (request received, task completed)            |
| **WARNING**  | Something unexpected but handled (retry succeeded, fallback used)         |
| **ERROR**    | An error occurred that needs attention (request failed, exception caught) |
| **CRITICAL** | System is unusable (database connection lost, out of memory)              |

**Python Logging Setup.** Configure structured logging with JSON output for production:

```py
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    """Format log records as JSON for structured logging."""

    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        # Include extra fields if provided
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_data)

def setup_logging(level: str = "INFO"):
    """Configure application logging."""
    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(handler)
```

**What to Log:**

- Request/response summaries (method, path, status, duration)
- Business events (user created, order placed, report generated)
- Error conditions with context
- Performance metrics (slow queries, cache misses)

**What NOT to Log:**

- Sensitive data (passwords, API keys, PII)
- High-frequency events that would flood logs
- Full request/response bodies (summarize instead)

**Extending Platform Logging.** On Dataiku and Databricks, application logs integrate with platform logging. Focus on adding application-specific context:

```py
# Add context to logs that platform logging doesn't capture
logger.info(
    "Data refresh completed",
    extra={
        "dataset": dataset_name,
        "rows_processed": row_count,
        "duration_seconds": duration,
        "user": get_current_user(),
    }
)
```

### 7.3 AI/ML Observability with MLflow

For applications with AI/ML components, MLflow provides comprehensive experiment tracking, model versioning, and observability. Both Dataiku and Databricks integrate with MLflow, making it the standard for ML observability at Compass.

**MLflow for Experiment Tracking.** Track model training runs, parameters, and metrics:

```py
import mlflow

# Set the tracking server (Databricks has built-in MLflow tracking)
mlflow.set_tracking_uri("databricks")
mlflow.set_experiment("/Experiments/my-project")

# Enable autologging for supported frameworks
mlflow.autolog()

# Or manually log specific metrics and parameters
with mlflow.start_run(run_name="model-v1"):
    mlflow.log_params({"learning_rate": 0.01, "epochs": 100})

    # Training code here...

    mlflow.log_metrics({"accuracy": accuracy, "loss": loss})
    mlflow.sklearn.log_model(model, artifact_path="model")
```

**MLflow Tracing for LLM Applications.** MLflow 3.x provides tracing for LLM calls, capturing prompts, responses, and token usage:

```py
import mlflow

# Enable autologging for your LLM provider
mlflow.openai.autolog()  # For OpenAI
mlflow.langchain.autolog()  # For LangChain

# LLM calls are automatically traced
response = client.chat.completions.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}]
)

# Access trace data for analysis
trace_id = mlflow.get_last_active_trace_id()
trace = mlflow.get_trace(trace_id=trace_id)

# Token usage is captured automatically
print(f"Total tokens: {trace.info.token_usage['total_tokens']}")
```

**MLflow on Dataiku.** Dataiku integrates with MLflow for experiment tracking. Configure MLflow to use Dataiku's tracking server:

```py
import dataiku
import mlflow

# Get MLflow tracking URI from Dataiku
client = dataiku.api_client()
mlflow_extension = client.get_mlflow_extension()
mlflow.set_tracking_uri(mlflow_extension.get_tracking_uri())
```

**What to Track with MLflow:**

- Model training parameters and hyperparameters
- Training and validation metrics over time
- Model artifacts and versions
- LLM prompts, responses, and token usage
- Inference latency and throughput

### 7.4 Monitoring & Alerting

Monitoring ensures applications remain healthy in production. The approach varies by platform.

**Health Checks.** Every application should expose a health endpoint:

```py
# FastAPI health check
@app.get("/health")
async def health_check():
    """Return application health status."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": app.version
    }

# Include dependency checks for critical services
@app.get("/health/ready")
async def readiness_check():
    """Check if application is ready to serve traffic."""
    checks = {
        "database": check_database_connection(),
        "cache": check_cache_connection(),
    }
    all_healthy = all(checks.values())
    return {
        "status": "ready" if all_healthy else "not_ready",
        "checks": checks
    }
```

**Platform-Specific Monitoring:**

- **Dataiku:** Use Dataiku's built-in monitoring for webapp health and usage metrics. Extend with application-specific metrics logged to datasets for dashboards.
- **Databricks:** Leverage Databricks SQL dashboards for application metrics. Store metrics in Delta tables for historical analysis. Use Databricks alerts for threshold-based notifications.
- **Cloud (AWS/Azure):** Design monitoring from the ground up:

  - Store application logs in CloudWatch Logs (AWS) or Azure Monitor
  - Store structured metrics in RDS/Azure SQL or time-series databases
  - Archive logs to S3/Azure Blob Storage for long-term retention
  - Configure CloudWatch Alarms or Azure Alerts for critical thresholds

**Key Metrics to Monitor:**

|  Category        |  Metrics                                                |
|:-----------------|:--------------------------------------------------------|
| **Availability** | Uptime, health check success rate                       |
| **Performance**  | Response time (p50, p95, p99), throughput               |
| **Errors**       | Error rate, error types, failed requests                |
| **Resources**    | CPU, memory, disk usage                                 |
| **Business**     | Active users, transactions processed, reports generated |

**Alerting Principles:**

- Alert on symptoms (high error rate) not just causes (high CPU)
- Set actionable thresholds — avoid alert fatigue
- Include runbook links in alerts when possible
- Start conservative; adjust thresholds based on baseline data


## 8. Reference Examples

### `.pre-commit-config.yaml`

Pre-commit hooks configuration.

```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
```

### GitHub Actions — test / CI workflow

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - name: Install dependencies
        run: pip install -r requirements.txt
      - name: Run pytest
        run: pytest --cov=src --cov-report=xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run Vitest
        run: npm run test -- --run --coverage
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run Playwright
        run: npx playwright test
```

### GitHub Actions — security-scanning workflow

```yaml
# .github/workflows/security.yml
name: Security Scan

on:
  push:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'  # Weekly scan

jobs:
  python-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install pip-audit
      - run: pip-audit -r requirements.txt

  npm-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm audit --audit-level=high
```


## Related Standards

- [Application Development — general standards](application-development-standards.md)
- [Dataiku standards](../dataiku/dataiku-standards.md)
- [Databricks Apps standards](../databricks-apps/databricks-apps-standards.md)
- [Cloud-Native (AWS/Azure) standards](../cloud-native/cloud-native-standards.md)

## Change Log

| Date | Author | Change |
|---|---|---|
| 2026-07-21 | Ethan-Pirso | Split out of the Confluence "Application Development Best Practices and Standards" page (§4 Coding Standards), moved here verbatim; sections renumbered and cross-references converted to links. |
