// Minimal stand-in for React so the official @paper-design/shaders-react
// components can be called as plain functions. Calling a component returns
// the props it would hand to <ShaderMount> (fragmentShader, uniforms, ...),
// which paper-motion then mounts with the vanilla ShaderMount.
const identity = (fn) => fn;
export const memo = identity;
export const forwardRef = identity;
export const useState = (init) => [typeof init === 'function' ? init() : init, () => {}];
export const useRef = (v = null) => ({ current: v });
export const useEffect = () => {};
export const useLayoutEffect = () => {};
export const useMemo = (fn) => fn();
export const useCallback = (fn) => fn;
export const createElement = (type, props) => ({ type, props: props ?? {} });
export default { memo, forwardRef, useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback, createElement };
