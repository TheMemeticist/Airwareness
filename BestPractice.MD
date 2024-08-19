### 1. **Component Structure**
   - **Tree Hierarchy**: Components can nest infinitely, reflecting a fractal design. Each component should represent a node in this tree, organized hierarchically without a maximum depth.
   - **Component Folder**: Every component must reside in its own folder, containing all relevant files (JS/TS, CSS, images, tests, etc.). Images and other assets should be placed at the same level as the component they are associated with.
   - **Naming**: Use **PascalCase** for components, **camelCase** for files, and **kebab-case** for directories.

### 2. **State Management**
   - **Simplified Approach**: Use **Redux Toolkit** exclusively for global state management. This provides consistency and avoids the complexity of deciding between Context API and Redux.
   - **Local State**: Use React’s built-in state management (`useState`, `useReducer`) for local state within components.
   - **Redux Structure**: All Redux slices should be organized by feature in a `slices/` directory, ensuring a clear and maintainable state structure.

### 3. **Styling**
   - **CSS Modules Only**: Styled components are disallowed. Use **CSS Modules** exclusively for component-level styling. Each component should have a corresponding `componentName.module.css` file.
   - **Design Tokens**: Centralize all design tokens (e.g., colors, fonts, spacing, etc.) in a `design-system.css` or `design-tokens.ts` file. These tokens should be used consistently across all components to maintain a unified design system.

### 4. **Type Safety**
   - **TypeScript Throughout**: TypeScript is mandatory across the project. All components, utilities, and state management must be strongly typed.
   - **Type Definitions**: Define complex types and interfaces in a `types/` directory. Types should be modular and reused across components where applicable.

### 5. **Testing**
   - **Unit Tests**: Mandatory for complex components, utilities, and Redux slices. Simpler components should have minimal tests to cover basic rendering and key props.
   - **Test Coverage**: Aim for at least 80% code coverage. Code that is critical for business logic or user interaction should have close to 100% coverage.
   - **Tools**: Use **Jest** with **React Testing Library** for unit testing and **Cypress** for end-to-end testing.

### 6. **Code Quality**
   - **Consistency**: Use **ESLint** and **Prettier** with a shared configuration across the entire project. This ensures uniform code quality and style.
   - **DRY Principles**: Avoid code duplication at all costs. Reuse components, hooks, and utilities wherever possible.
   - **Documentation in Code**: Use TypeScript comments or `JSDoc` for public APIs and complex logic. Code should be self-documenting, but where comments are necessary, they should be concise and relevant.

### 7. **Performance Optimization**
   - **Best Practices**: Use **React.memo**, **useCallback**, **useMemo**, and **lazy-loading** wherever they provide clear performance benefits. These should be standard in scenarios where re-renders or heavy computations are expected.
   - **Profiling**: Regularly profile performance to ensure optimizations are effective.

### 8. **Accessibility**
   - **WCAG Compliance**: Ensure all components meet **WCAG 2.1** guidelines. Use a standardized tool (e.g., Axe) to validate accessibility.
   - **Testing**: Include accessibility checks as part of automated tests, ensuring no regression in compliance.

### 9. **Documentation**
   - **In-Code Documentation**: Prioritize inline code comments and TypeScript annotations for clarity.
   - **Markdown Files**: Use `README.md` files for documenting components, modules, and project-level guidelines. This ensures documentation is easily accessible and version-controlled.

### 10. **CI/CD and Deployment**
   - **Automation**: Implement CI/CD pipelines with tools like GitHub Actions or Jenkins. Pipelines should automatically run tests, check code quality, and handle deployment.
   - **PWA Features**: Ensure the application supports PWA features, including offline functionality with service workers, caching strategies, and fallback pages.