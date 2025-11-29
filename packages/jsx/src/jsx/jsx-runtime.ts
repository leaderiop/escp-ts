/**
 * JSX Runtime for escp-ts
 *
 * This module is used by TypeScript's automatic JSX transform.
 * When tsconfig has "jsx": "react-jsx" and "jsxImportSource": "escp-ts",
 * TypeScript automatically imports jsx/jsxs from this module.
 */

export { jsx, jsxs, Fragment } from './createElement';
