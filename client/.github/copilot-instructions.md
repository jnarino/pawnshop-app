# Copilot Instructions for Pawnshop App (React + Electron + shadcn/ui)

## Tech Stack
- **Framework**: React (Vite)
- **Platform**: Electron
- **UI Library**: shadcn/ui
- **Styling**: Tailwind CSS v3
- **State Management**: Redux Toolkit
- **Language**: TypeScript

## Architecture & Layering
Follow a strict 3-layer architecture to maintain separation of concerns:

1.  **Presentation Layer (UI)**
    - Located in `src/app/feature/*` and `src/components`.
    - **Responsibility**: Rendering UI and handling user interactions.
    - **Rules**:
        - Do not contain business logic or direct API calls.
        - Use custom hooks to interact with the business layer.
        - Use **shadcn/ui** components from `src/components/ui` as the building blocks.

2.  **Business/Domain Layer (Logic)**
    - Located in `src/hooks`, `src/app/feature/*/hooks`, and `src/app/core/redux`.
    - **Responsibility**: State management, validation, and business rules.
    - **Rules**:
        - Encapsulate logic in custom hooks (e.g., `useCustomer`, `usePawnTransaction`).
        - Use Redux slices for global state.
        - Keep hooks pure and testable where possible.

3.  **Data/Infrastructure Layer (API & IPC)**
    - Located in `src/app/core/api` and `electron/`.
    - **Responsibility**: Data fetching, persistence, and system integration.
    - **Rules**:
        - All HTTP requests go through the API services in `src/app/core/api`.
        - All Electron IPC communication must go through the `preload` script and be typed in `window.electron`.

## Best Practices

### Styling with Tailwind CSS & shadcn/ui
- **Utility First**: Use Tailwind utility classes directly in JSX. Avoid creating separate CSS files or using `@apply` unless absolutely necessary.
- **Class Merging**: Always use the `cn()` utility (from `lib/utils.ts`) when merging conditional classes or allowing `className` overrides in components.
    ```tsx
    // Good
    <div className={cn("flex items-center", className)}>...</div>
    ```
- **Theming**: Rely on CSS variables defined in `src/assets/styles.css` (or `globals.css`) and mapped in `tailwind.config.js`. Do not hardcode hex values; use semantic names like `bg-primary`, `text-muted-foreground`.
- **Responsive Design**: Use Tailwind's mobile-first modifiers (`md:`, `lg:`) for responsive layouts.

### Electron Integration
- **Security**: Never enable `nodeIntegration` in the renderer. Use `contextBridge` in `preload.ts` to expose safe APIs.
- **IPC**: Define clear channels for Inter-Process Communication.
- **Types**: Maintain shared types for IPC payloads to ensure type safety between Main and Renderer processes.

### Component Structure
- **Colocation**: Keep related files together. A feature folder (e.g., `src/app/feature/pawn`) should contain its own `components`, `hooks`, and `types` if they are specific to that feature.
- **Small Components**: Break down complex views into smaller, reusable sub-components.

### Performance & Rendering Optimization
- **Stable Handlers**: Always wrap event handlers passed to child components in `useCallback`.
    ```tsx
    // Bad: Recreated on every render, causing children to re-render
    const update = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    // Good: Stable reference
    const update = useCallback((k, v) => {
      setForm(prev => ({ ...prev, [k]: v }));
    }, []);
    ```
- **Memoization**: Use `React.memo` for form sections or heavy UI components to prevent unnecessary re-renders.
- **Granular Props**: Avoid passing the entire state object (e.g., `form`) to every child component. Pass only the specific primitives needed.
    ```tsx
    // Bad: Typing in 'firstName' re-renders AddressSection because 'form' changed
    <AddressSection form={form} />

    // Good: AddressSection only re-renders when address fields change
    <AddressSection street={form.street} city={form.city} />
    ```

### TypeScript
- **Strict Typing**: Avoid `any`. Define interfaces for component props (`interface Props { ... }`) and API responses.
- **Enums vs Unions**: Prefer string union types over TypeScript enums for better compatibility and simplicity.

## Environment Variables & Configuration
- **Centralized Configuration**: All runtime configuration (API URLs, ports, store info, etc.) MUST be defined as VITE environment variables in the `.env` file.
- **No Hardcoded Values**: Never hardcode URLs, ports, API endpoints, or any configuration that may change between environments.
- **File Locations**:
  - Configuration templates: `client/.env.example`
  - Local development: `client/.env` (not committed to Git)
  - Environment variables must be prefixed with `VITE_` to be exposed to the client application
- **Required Variables**:
  ```env
  VITE_API_BASE_URL      # Backend API URL
  VITE_FRONTEND_PORT     # Vite dev server port
  VITE_STORE_NAME        # Store name for receipts
  VITE_STORE_ADDRESS1    # Store address line 1
  VITE_STORE_ADDRESS2    # Store address line 2
  VITE_STORE_PHONE       # Store phone number
  ```
- **Usage Pattern**: Use non-null assertion operator to enforce .env configuration:
  ```typescript
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL!;
  ```
- **CRITICAL**: Before starting development, you MUST copy `.env.example` to `.env` and configure all values. The application will fail if variables are not defined.

## Coding Conventions
- **File Naming**: PascalCase for React components (`MyComponent.tsx`), camelCase for hooks and utilities (`useHook.ts`, `apiService.ts`).
- **Exports**: Use named exports for components and hooks to ensure consistent naming when importing.
- **Comments**: DO NOT leave comments at all.
