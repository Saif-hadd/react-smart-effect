import isEqual from 'lodash.isequal';
import { DependencyList } from 'react';
import { DependencyAnalysis } from './types';

/**
 * Deep comparison function for dependency arrays
 */
export function deepCompareDeps(
  prevDeps: DependencyList | undefined,
  nextDeps: DependencyList | undefined
): boolean {
  if (!prevDeps || !nextDeps) return prevDeps === nextDeps;
  if (prevDeps.length !== nextDeps.length) return false;

  return prevDeps.every((prev, index) => {
    const next = nextDeps[index];
    if (typeof prev === 'object' && prev !== null) {
      return isEqual(prev, next);
    }
    return Object.is(prev, next);
  });
}

/**
 * Analyzes dependencies to categorize them and detect potential issues
 */
export function analyzeDeps(deps: DependencyList): DependencyAnalysis {
  const analysis: DependencyAnalysis = {
    primitives: [],
    objects: [],
    functions: [],
    potentiallyMissing: [],
    redundant: []
  };

  deps.forEach((dep: any, index) => {
    const type = typeof dep;

    switch (type) {
      case 'string':
      case 'number':
      case 'boolean':
      case 'undefined':
        analysis.primitives.push(dep);
        break;

      
case 'function':
  analysis.functions.push(dep);

  // More precise anonymous function detection
  const fnString = dep.toString().trim();
  
  // Check if it's truly an anonymous function by examining the source
  const isAnonymous = 
    // Arrow functions are generally considered anonymous in this context
    fnString.includes('=>') ||
    // Function expressions without names
    /^function\s*\(/.test(fnString) ||
    // Functions with empty or 'anonymous' names
    !dep.name ||
    dep.name === 'anonymous';
  
  analysis.potentiallyMissing.push(
    isAnonymous ? `Anonymous function at index ${index}` : `Named function at index ${index}`
  );
  break;


      case 'object':
        if (dep === null) {
          analysis.primitives.push(dep);
        } else if (Array.isArray(dep)) {
          analysis.objects.push(dep);
          analysis.potentiallyMissing.push(`Array at index ${index}`);
        } else {
          analysis.objects.push(dep);
          analysis.potentiallyMissing.push(`Object at index ${index}`);
        }
        break;
    }
  });

  return analysis;
}

/**
 * Generates a warning message for dependency analysis
 */
export function generateDependencyWarning(
  analysis: DependencyAnalysis,
  effectId?: string
): string | null {
  const warnings: string[] = [];

  if (analysis.potentiallyMissing.length > 0) {
    warnings.push(
      `Potentially unstable dependencies detected:\n${analysis.potentiallyMissing
        .map(msg => `  - ${msg}`)
        .join('\n')}`
    );
  }

  if (analysis.functions.length > 0) {
    warnings.push(
      `Function dependencies detected (${analysis.functions.length}). Consider wrapping with useCallback.`
    );
  }

  if (analysis.objects.length > 0) {
    warnings.push(
      `Object/Array dependencies detected (${analysis.objects.length}). Consider wrapping with useMemo or enable deepCompare.`
    );
  }

  if (warnings.length === 0) return null;

  const prefix = effectId ? `[useSmartEffect:${effectId}]` : '[useSmartEffect]';
  return `${prefix} Dependency Analysis:\n${warnings.join('\n\n')}`;
}

/**
 * Logs dependency changes for debugging
 */
export function logDependencyChanges(
  prevDeps: DependencyList | undefined,
  nextDeps: DependencyList | undefined,
  effectId?: string
): void {
  if (!prevDeps || !nextDeps) return;

  const changes = nextDeps
    .map((next, index) => {
      const prev = prevDeps[index];
      const changed = !Object.is(prev, next) && !isEqual(prev, next);
      return { index, prev, next, changed };
    })
    .filter(c => c.changed);

  if (changes.length > 0) {
    const prefix = effectId ? `[useSmartEffect:${effectId}]` : '[useSmartEffect]';
    console.group(`${prefix} Dependencies Changed`);
    changes.forEach(({ index, prev, next }) => console.log(`Index ${index}:`, { prev, next }));
    console.groupEnd();
  }
}

/**
 * Creates a unique identifier for an effect
 */
export function createEffectId(): string {
  return `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formats dependency values for display
 */
export function formatDependencyValue(value: any): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'function') return `[Function ${value.name || 'anonymous'}]`;
  if (typeof value === 'object') {
    if (Array.isArray(value)) return `Array(${value.length})`;
    return `Object(${Object.keys(value).length} keys)`;
  }
  return String(value);
}
