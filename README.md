# React Smart Effect
[![npm version](https://badge.fury.io/js/react-smart-effect.svg)](https://badge.fury.io/js/react-smart-effect)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)

🚀 Enhanced React `useEffect` and `useLayoutEffect` hooks with smart dependency tracking, debugging tools, and automatic optimization.

## Features

- 🎯 **Smart dependency tracking** with deep comparison support
- 🐛 **Advanced debugging** with dependency change logging
- 🔍 **Dependency analysis** to detect potential issues
- ⚡ **Automatic optimization** to prevent unnecessary re-renders
- 🛠️ **DevTools integration** with real-time effect monitoring
- 🔧 **Babel & Vite plugins** for build-time analysis
- 📊 **Effect visualization** and dependency graphs
- 💪 **TypeScript support** with full type safety

## Installation

```bash
npm install react-smart-effect
```

## Quick Start

```tsx
import { useSmartEffect } from 'react-smart-effect';

function MyComponent() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState({ name: 'John', age: 30 });

  // Basic usage - enhanced useEffect
  useSmartEffect(() => {
    console.log('Count changed:', count);
  }, [count]);

  // Skip first render
  useSmartEffect(() => {
    console.log('This runs only after first render');
  }, [count], { skipFirstRender: true });

  // Deep comparison for objects/arrays
  useSmartEffect(() => {
    console.log('User changed (deep comparison):', user);
  }, [user], { deepCompare: true });

  // Debug mode with dependency analysis
  useSmartEffect(() => {
    fetchUserData(user.id);
  }, [user], { debug: true });

  return <div>{count}</div>;
}
```

## API Reference

### `useSmartEffect(effect, deps?, options?)`

Enhanced version of `useEffect` with additional features.

**Parameters:**
- `effect`: Effect callback function
- `deps`: Dependency array (optional)
- `options`: Configuration object (optional)

**Options:**
```tsx
interface UseSmartEffectOptions {
  /** Skip execution on first render */
  skipFirstRender?: boolean;
  /** Enable debug logging */
  debug?: boolean;
  /** Use useLayoutEffect instead of useEffect */
  mode?: 'effect' | 'layoutEffect';
  /** Enable deep comparison for objects and arrays */
  deepCompare?: boolean;
  /** Custom comparison function */
  compareFunction?: (prev: any[], next: any[]) => boolean;
  /** Unique identifier for this effect (for debugging) */
  id?: string;
}
```

### Convenience Hooks

```tsx
// Deep comparison enabled by default
useDeepEffect(effect, deps, options);

// Debug mode enabled by default
useDebugEffect(effect, deps, options);

// useLayoutEffect mode by default
useSmartLayoutEffect(effect, deps, options);
```

## Advanced Usage

### 1. Dependency Analysis

The hook automatically analyzes your dependencies and warns about potential issues:

```tsx
function Component() {
  const [items, setItems] = useState([]);
  
  useSmartEffect(() => {
    // This will warn about the object literal
    processData(items);
  }, [items, { processImmediate: true }], { debug: true });
  // Warning: Object at index 1 - consider useMemo
}
```

### 2. Deep Comparison

Prevent unnecessary re-renders when using objects or arrays:

```tsx
function Component() {
  const [filters, setFilters] = useState({ category: 'all', status: 'active' });
  
  // Without deep comparison - runs on every render if filters object is recreated
  useEffect(() => {
    fetchData(filters);
  }, [filters]);

  // With deep comparison - only runs when filter values actually change
  useDeepEffect(() => {
    fetchData(filters);
  }, [filters]);
}
```

### 3. Custom Comparison

Use your own comparison logic:

```tsx
function Component() {
  const [user, setUser] = useState({ name: 'John', lastLogin: Date.now() });
  
  useSmartEffect(() => {
    updateUserProfile(user);
  }, [user], {
    compareFunction: (prev, next) => {
      // Only compare name, ignore lastLogin changes
      return prev[0]?.name === next[0]?.name;
    }
  });
}
```

### 4. DevTools Integration

Monitor your effects in real-time:

```tsx
import { generateEffectGraph, enableDevTools } from 'react-smart-effect';

// Enable DevTools (automatically enabled in development)
enableDevTools(true);

function App() {
  // Your effects will now be tracked
  useSmartEffect(() => {
    // Effect logic
  }, [dep1, dep2], { id: 'my-effect' });

  // Generate visual graph in console
  const handleShowGraph = () => {
    generateEffectGraph();
  };

  return (
    <div>
      <button onClick={handleShowGraph}>Show Effect Graph</button>
    </div>
  );
}
```

## Build-Time Analysis

### Babel Plugin

Add to your `.babelrc`:

```json
{
  "plugins": [
    ["react-smart-effect/babel", {
      "autoFix": false,
      "warnOnly": true
    }]
  ]
}
```

### Vite Plugin

Add to your `vite.config.ts`:

```tsx
import { defineConfig } from 'vite';
import { vitePluginSmartEffect } from 'react-smart-effect/vite';

export default defineConfig({
  plugins: [
    vitePluginSmartEffect({
      warnOnly: true,
      autoFix: false
    })
  ]
});
```

The plugins will analyze your code and warn about:
- Object/array literals in dependencies (suggest `useMemo`)
- Function expressions in dependencies (suggest `useCallback`)
- Missing dependencies
- Redundant dependencies

## DevTools Panel

The package includes a DevTools integration that shows:

- All active effects and their states
- Dependency changes over time
- Effect execution timeline
- Performance metrics

### Console Commands

When DevTools are enabled, you can use these console commands:

```javascript
// Show all effect reports
__REACT_SMART_EFFECT_DEVTOOLS__.getReports()

// Show specific effect
__REACT_SMART_EFFECT_DEVTOOLS__.getReport('effect-id')

// Clear all reports
__REACT_SMART_EFFECT_DEVTOOLS__.clearReports()

// Generate visual graph
__REACT_SMART_EFFECT_DEVTOOLS__.generateGraph()
```

## Utility Functions

### `analyzeDeps(dependencies)`

Analyze a dependency array and categorize dependencies:

```tsx
import { analyzeDeps } from 'react-smart-effect';

const analysis = analyzeDeps([1, {}, [], () => {}]);
console.log(analysis);
// {
//   primitives: [1],
//   objects: [{}, []],
//   functions: [Function],
//   potentiallyMissing: ['Object at index 1 - consider useMemo', ...]
// }
```

### `deepCompareDeps(prev, next)`

Deep comparison function for dependency arrays:

```tsx
import { deepCompareDeps } from 'react-smart-effect';

const same = deepCompareDeps([{ a: 1 }], [{ a: 1 }]); // true
const different = deepCompareDeps([{ a: 1 }], [{ a: 2 }]); // false
```

## Examples

### 1. Data Fetching with Smart Caching

```tsx
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Only refetch when userId actually changes, not on every render
  useSmartEffect(() => {
    setLoading(true);
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId], {
    debug: true,
    id: 'fetch-user'
  });

  if (loading) return <div>Loading...</div>;
  return <div>{user?.name}</div>;
}
```

### 2. Complex State Dependencies

```tsx
function FilteredList({ items }) {
  const [filters, setFilters] = useState({
    category: 'all',
    sortBy: 'name',
    ascending: true
  });
  const [filteredItems, setFilteredItems] = useState([]);

  // Use deep comparison to avoid unnecessary filtering
  useDeepEffect(() => {
    const filtered = applyFilters(items, filters);
    setFilteredItems(filtered);
  }, [items, filters], {
    debug: true,
    id: 'filter-items'
  });

  return (
    <div>
      {/* Filter controls */}
      {filteredItems.map(item => <Item key={item.id} {...item} />)}
    </div>
  );
}
```

### 3. Skip Initial API Call

```tsx
function SearchResults({ query }) {
  const [results, setResults] = useState([]);

  // Don't search on mount, only when user types
  useSmartEffect(() => {
    if (query.trim()) {
      searchAPI(query).then(setResults);
    }
  }, [query], {
    skipFirstRender: true,
    debug: true
  });

  return <div>{/* Render results */}</div>;
}
```

## Performance Tips

1. **Use `deepCompare: true`** for object/array dependencies
2. **Wrap objects with `useMemo`** when passing them as dependencies
3. **Wrap functions with `useCallback`** when passing them as dependencies
4. **Enable `debug: true`** during development to catch issues
5. **Use the Babel/Vite plugins** for build-time analysis

## Migration from useEffect

Replace your existing `useEffect` calls:

```tsx
// Before
useEffect(() => {
  // effect
}, [dep1, dep2]);

// After
useSmartEffect(() => {
  // effect  
}, [dep1, dep2]);

// With options
useSmartEffect(() => {
  // effect
}, [dep1, dep2], {
  deepCompare: true,
  debug: process.env.NODE_ENV === 'development'
});
```

## TypeScript

The package is written in TypeScript and includes full type definitions. All hooks and utilities are fully typed.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [saif eddine keraa]