import { DependencyList, EffectCallback } from 'react';

export interface UseSmartEffectOptions {
  /** Skip execution on first render */
  skipFirstRender?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Use useLayoutEffect instead of useEffect */
  mode?: 'effect' | 'layoutEffect';
  /** Enable deep comparison for objects and arrays */
  deepCompare?: boolean;
  /** Custom comparison function */
  compareFunction?: (prev: DependencyList, next: DependencyList) => boolean;
  /** Unique identifier for this effect (for debugging) */
  id?: string;
}

export interface DependencyAnalysis {
  primitives: any[];
  objects: any[];
  functions: any[];
  potentiallyMissing: string[];
  redundant: any[];
}

export interface EffectReport {
  id: string;
  triggered: boolean;
  dependencies: {
    previous: DependencyList;
    current: DependencyList;
    changed: boolean[];
  };
  timestamp: number;
  renderCount: number;
}

export interface DevToolsState {
  effects: Map<string, EffectReport>;
  isEnabled: boolean;
}