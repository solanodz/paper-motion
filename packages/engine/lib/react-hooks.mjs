// Node module hook: resolve `react` to the paper-motion shim so the official
// shader components can be inspected in Node (used by `paper-motion shaders`).
const shim = new URL('../runtime/react-shim.js', import.meta.url).href;
const jsx = new URL('../runtime/jsx-shim.js', import.meta.url).href;
export async function resolve(specifier, context, next) {
  if (specifier === 'react') return { url: shim, shortCircuit: true, format: 'module' };
  if (specifier === 'react/jsx-runtime') return { url: jsx, shortCircuit: true, format: 'module' };
  return next(specifier, context);
}
