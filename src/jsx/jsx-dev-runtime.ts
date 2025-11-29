/**
 * JSX Development Runtime for escp-ts
 *
 * This module is used by TypeScript's automatic JSX transform in development.
 * It provides the same exports as jsx-runtime but could include additional
 * debugging or validation in the future.
 */

export { jsxDEV as jsx, jsxDEV as jsxs, Fragment } from './createElement';
