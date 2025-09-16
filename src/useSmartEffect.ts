import { useEffect, useLayoutEffect, useRef, DependencyList, EffectCallback } from 'react';
import { 
  deepCompareDeps, 
  analyzeDeps, 
  generateDependencyWarning, 
  logDependencyChanges,
  createEffectId,
  formatDependencyValue
} from './utils';
import { UseSmartEffectOptions, EffectReport } from './types';
import { reportToDevTools } from './devtools';

/**
 * Enhanced useEffect hook with smart dependency tracking and debugging features
 */
export function useSmartEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options: UseSmartEffectOptions = {}
): void {
  const {
    skipFirstRender = false,
    debug = false,
    mode = 'effect',
    deepCompare = false,
    compareFunction,
    id
  } = options;

  const effectId = useRef<string>(id || createEffectId()).current;
  const isFirstRender = useRef(true);
  const prevDepsRef = useRef<DependencyList | undefined>(undefined);

  const effectHook = mode === 'layoutEffect' ? useLayoutEffect : useEffect;

  const shouldRun = (() => {
    if (isFirstRender.current) {
      return !skipFirstRender;
    }

    if (!deps) return true;

    const prevDeps = prevDepsRef.current;

    if (compareFunction) return !compareFunction(prevDeps || [], deps);
    if (deepCompare) return !deepCompareDeps(prevDeps, deps);

    if (!prevDeps || prevDeps.length !== deps.length) return true;

    return !deps.every((dep, index) => Object.is(dep, prevDeps[index]));
  })();

  // Debug and dependency analysis
  if (debug && deps) {
    const analysis = analyzeDeps(deps);
    const warning = generateDependencyWarning(analysis, effectId);
    if (warning) console.warn(warning);

    if (!isFirstRender.current) {
      logDependencyChanges(prevDepsRef.current, deps, effectId);
    }

    if (shouldRun) {
      console.log(`[useSmartEffect:${effectId}] Effect will execute`, {
        dependencies: deps.map(formatDependencyValue),
        isFirstRender: isFirstRender.current
      });
    } else {
      console.log(`[useSmartEffect:${effectId}] Effect skipped`, {
        reason: isFirstRender.current ? 'First render (skipFirstRender=true)' : 'Dependencies unchanged'
      });
    }
  }

  // Create DevTools report
  const report: EffectReport = {
    id: effectId,
    triggered: shouldRun,
    dependencies: {
      previous: prevDepsRef.current || [],
      current: deps || [],
      changed: deps ? deps.map((dep, index) => !Object.is(dep, prevDepsRef.current?.[index])) : []
    },
    timestamp: Date.now(),
    renderCount: 0
  };
  reportToDevTools(report);

  // Update previous deps
  prevDepsRef.current = deps ? [...deps] : undefined;

  // Run the effect
  effectHook(() => {
    // Reset first render flag
    if (isFirstRender.current) isFirstRender.current = false;

    if (!shouldRun) return;

    return effect();
  }, deps);
}

/**
 * Convenience hook using useLayoutEffect by default
 */
export function useSmartLayoutEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options: Omit<UseSmartEffectOptions, 'mode'> = {}
) {
  return useSmartEffect(effect, deps, { ...options, mode: 'layoutEffect' });
}

/**
 * Hook with deep comparison enabled by default
 */
export function useDeepEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options: Omit<UseSmartEffectOptions, 'deepCompare'> = {}
) {
  return useSmartEffect(effect, deps, { ...options, deepCompare: true });
}

/**
 * Hook with debug enabled by default
 */
export function useDebugEffect(
  effect: EffectCallback,
  deps?: DependencyList,
  options: Omit<UseSmartEffectOptions, 'debug'> = {}
) {
  return useSmartEffect(effect, deps, { ...options, debug: true });
}
