import { EffectReport, DevToolsState } from './types';

// Global state for DevTools integration
let devToolsState: DevToolsState = {
  effects: new Map(),
  isEnabled: typeof window !== 'undefined' && process.env.NODE_ENV === 'development'
};

/**
 * Enable or disable DevTools reporting
 */
export function enableDevTools(enabled: boolean = true): void {
  devToolsState.isEnabled = enabled;
}

/**
 * Report effect execution to DevTools
 */
export function reportToDevTools(report: EffectReport): void {
  if (!devToolsState.isEnabled) {
    return;
  }

  // Store the report
  devToolsState.effects.set(report.id, report);

  // Send to browser DevTools if available
  if (typeof window !== 'undefined' && (window as any).__REACT_SMART_EFFECT_DEVTOOLS__) {
    (window as any).__REACT_SMART_EFFECT_DEVTOOLS__.postMessage({
      type: 'EFFECT_REPORT',
      payload: report
    });
  }

  // Limit stored reports to prevent memory leaks
  if (devToolsState.effects.size > 1000) {
    const oldestKey = devToolsState.effects.keys().next().value;
    if (oldestKey) {
      devToolsState.effects.delete(oldestKey);
    }
  }
}

/**
 * Get all effect reports
 */
export function getEffectReports(): EffectReport[] {
  return Array.from(devToolsState.effects.values());
}

/**
 * Get effect report by ID
 */
export function getEffectReport(id: string): EffectReport | undefined {
  return devToolsState.effects.get(id);
}

/**
 * Clear all effect reports
 */
export function clearEffectReports(): void {
  devToolsState.effects.clear();
}

/**
 * Generate a visual graph of effects (console output)
 */
export function generateEffectGraph(): void {
  if (!devToolsState.isEnabled) {
    console.warn('DevTools not enabled. Call enableDevTools(true) first.');
    return;
  }

  const reports = getEffectReports();
  
  if (reports.length === 0) {
    console.log('No effects to display.');
    return;
  }

  console.group('🔍 React Smart Effect - Effect Graph');
  
  reports.forEach(report => {
    const status = report.triggered ? '✅ Triggered' : '⏭️ Skipped';
    const changedCount = report.dependencies.changed.filter(Boolean).length;
    
    console.group(`${status} ${report.id} (Render #${report.renderCount})`);
    console.log('Timestamp:', new Date(report.timestamp).toLocaleTimeString());
    console.log('Dependencies changed:', changedCount);
    
    if (report.dependencies.current.length > 0) {
      console.table(
        report.dependencies.current.map((dep, index) => ({
          Index: index,
          Current: typeof dep === 'object' ? JSON.stringify(dep) : String(dep),
          Previous: typeof report.dependencies.previous[index] === 'object' 
            ? JSON.stringify(report.dependencies.previous[index])
            : String(report.dependencies.previous[index]),
          Changed: report.dependencies.changed[index] ? '✅' : '❌'
        }))
      );
    }
    
    console.groupEnd();
  });
  
  console.groupEnd();
}

/**
 * Initialize DevTools panel (for browser extension)
 */
export function initializeDevToolsPanel(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // Create global hook for DevTools extension
  (window as any).__REACT_SMART_EFFECT_DEVTOOLS__ = {
    getReports: getEffectReports,
    getReport: getEffectReport,
    clearReports: clearEffectReports,
    generateGraph: generateEffectGraph,
    enable: enableDevTools,
    version: '1.0.0'
  };

  // Listen for DevTools messages
  window.addEventListener('message', (event) => {
    if (event.data.source !== 'react-smart-effect-devtools') {
      return;
    }

    switch (event.data.type) {
      case 'GET_REPORTS':
        window.postMessage({
          source: 'react-smart-effect-app',
          type: 'REPORTS_RESPONSE',
          payload: getEffectReports()
        }, '*');
        break;
      case 'CLEAR_REPORTS':
        clearEffectReports();
        break;
      case 'GENERATE_GRAPH':
        generateEffectGraph();
        break;
    }
  });

  console.log('🔍 React Smart Effect DevTools initialized');
}

// Auto-initialize in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  initializeDevToolsPanel();
}