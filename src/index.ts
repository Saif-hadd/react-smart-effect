// Main hooks
export {
  useSmartEffect,
  useSmartLayoutEffect,
  useDeepEffect,
  useDebugEffect
} from './useSmartEffect';

// Utility functions
export {
  deepCompareDeps,
  analyzeDeps,
  generateDependencyWarning,
  logDependencyChanges,
  createEffectId,
  formatDependencyValue
} from './utils';

// DevTools integration
export {
  enableDevTools,
  reportToDevTools,
  getEffectReports,
  getEffectReport,
  clearEffectReports,
  generateEffectGraph,
  initializeDevToolsPanel
} from './devtools';

// Babel and Vite plugins
export { default as babelPluginSmartEffect, createBabelConfig } from './plugins/babel';
export { vitePluginSmartEffect, createViteConfig } from './plugins/vite';

// Types
export type {
  UseSmartEffectOptions,
  DependencyAnalysis,
  EffectReport,
  DevToolsState
} from './types';

// Version
export const version = '1.0.0';