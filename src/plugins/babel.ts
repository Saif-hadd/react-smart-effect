import { NodePath, PluginObj, types as t } from '@babel/core';

interface PluginState {
  filename?: string;
  opts: {
    autoFix?: boolean;
    warnOnly?: boolean;
  };
}

/**
 * Babel plugin to analyze useSmartEffect dependencies
 */
export default function babelPluginSmartEffect(): PluginObj<PluginState> {
  return {
    name: 'babel-plugin-react-smart-effect',
    visitor: {
      CallExpression(path: NodePath<t.CallExpression>, state: PluginState) {
        const { node } = path;
        
        // Check if this is a useSmartEffect call
        if (
          t.isIdentifier(node.callee) &&
          (node.callee.name === 'useSmartEffect' || 
           node.callee.name === 'useDeepEffect' ||
           node.callee.name === 'useDebugEffect' ||
           node.callee.name === 'useSmartLayoutEffect')
        ) {
          analyzeDependencies(path, state);
        }
      }
    }
  };
}

function analyzeDependencies(path: NodePath<t.CallExpression>, state: PluginState): void {
  const { node } = path;
  const { opts = {} } = state;
  
  if (node.arguments.length < 2) {
    return; // No dependencies array
  }

  const depsArg = node.arguments[1];
  
  if (!t.isArrayExpression(depsArg)) {
    return; // Dependencies not an array literal
  }

  const dependencies = depsArg.elements;
  const issues: string[] = [];
  const fixes: Array<() => void> = [];

  dependencies.forEach((dep, index) => {
    if (!dep) return;

    // Check for potentially missing dependencies
    if (t.isObjectExpression(dep) || t.isArrayExpression(dep)) {
      issues.push(`Dependency at index ${index} is an object/array literal that will be recreated on every render`);
      
      if (opts.autoFix) {
        // Suggest wrapping with useMemo
        fixes.push(() => {
          console.log(`Consider wrapping dependency at index ${index} with useMemo`);
        });
      }
    }

    // Check for function expressions
    if (t.isFunctionExpression(dep) || t.isArrowFunctionExpression(dep)) {
      issues.push(`Dependency at index ${index} is a function expression that will be recreated on every render`);
      
      if (opts.autoFix) {
        fixes.push(() => {
          console.log(`Consider wrapping dependency at index ${index} with useCallback`);
        });
      }
    }

    // Check for missing dependencies (simplified analysis)
    if (t.isIdentifier(dep)) {
      const binding = path.scope.getBinding(dep.name);
      if (!binding) {
        issues.push(`Dependency '${dep.name}' at index ${index} is not defined in scope`);
      }
    }
  });

  // Report issues
  if (issues.length > 0) {
    const filename = state.filename || 'unknown';
    const line = node.loc?.start.line || 'unknown';
    
    const message = `[babel-plugin-react-smart-effect] ${filename}:${line}\n${issues.join('\n')}`;
    
    if (opts.warnOnly) {
      console.warn(message);
    } else {
      throw path.buildCodeFrameError(message);
    }

    // Apply fixes if enabled
    if (opts.autoFix && fixes.length > 0) {
      fixes.forEach(fix => fix());
    }
  }
}

// Export plugin configuration helper
export function createBabelConfig(options: { autoFix?: boolean; warnOnly?: boolean } = {}) {
  return {
    plugins: [
      [babelPluginSmartEffect, options]
    ]
  };
}