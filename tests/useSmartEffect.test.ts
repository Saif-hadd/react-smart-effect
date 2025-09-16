import { renderHook, act } from '@testing-library/react';
import { useSmartEffect, useDeepEffect, analyzeDeps } from '../src';

describe('useSmartEffect', () => {
  let mockEffect: jest.Mock;
  let mockCleanup: jest.Mock;

  beforeEach(() => {
    mockEffect = jest.fn();
    mockCleanup = jest.fn();
    mockEffect.mockReturnValue(mockCleanup);
    jest.clearAllMocks();
  });

  test('should run effect on initial render by default', () => {
    const { rerender } = renderHook(
      ({ deps }) => useSmartEffect(mockEffect, deps),
      { initialProps: { deps: [1] } }
    );

    expect(mockEffect).toHaveBeenCalledTimes(1);

    rerender({ deps: [1] });
    expect(mockEffect).toHaveBeenCalledTimes(1);
  });

  test('should skip first render when skipFirstRender is true', () => {
    const { rerender } = renderHook(
      ({ deps }) => useSmartEffect(mockEffect, deps, { skipFirstRender: true }),
      { initialProps: { deps: [1] } }
    );

    expect(mockEffect).not.toHaveBeenCalled();

    rerender({ deps: [2] });
    expect(mockEffect).toHaveBeenCalledTimes(1);
  });

  test('should run effect when dependencies change', () => {
    const { rerender } = renderHook(
      ({ deps }) => useSmartEffect(mockEffect, deps),
      { initialProps: { deps: [1, 'test'] } }
    );

    expect(mockEffect).toHaveBeenCalledTimes(1);

    rerender({ deps: [2, 'test'] });
    expect(mockEffect).toHaveBeenCalledTimes(2);

    rerender({ deps: [2, 'changed'] });
    expect(mockEffect).toHaveBeenCalledTimes(3);
  });

  test('should not run effect when dependencies are unchanged', () => {
    const { rerender } = renderHook(
      ({ deps }) => useSmartEffect(mockEffect, deps),
      { initialProps: { deps: [1, 'test', true] } }
    );

    expect(mockEffect).toHaveBeenCalledTimes(1);

    rerender({ deps: [1, 'test', true] });
    expect(mockEffect).toHaveBeenCalledTimes(1);
  });

  test('should handle deep comparison for objects', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2 };

    const { rerender } = renderHook(
      ({ deps }) => useSmartEffect(mockEffect, deps, { deepCompare: true }),
      { initialProps: { deps: [obj1] } }
    );

    expect(mockEffect).toHaveBeenCalledTimes(1);

    rerender({ deps: [obj2] });
    expect(mockEffect).toHaveBeenCalledTimes(1);

    rerender({ deps: [{ a: 1, b: 3 }] });
    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  test('should handle deep comparison for arrays', () => {
    const arr1 = [1, 2, 3];
    const arr2 = [1, 2, 3];

    const { rerender } = renderHook(
      ({ deps }) => useSmartEffect(mockEffect, deps, { deepCompare: true }),
      { initialProps: { deps: [arr1] } }
    );

    expect(mockEffect).toHaveBeenCalledTimes(1);

    rerender({ deps: [arr2] });
    expect(mockEffect).toHaveBeenCalledTimes(1);

    rerender({ deps: [[1, 2, 4]] });
    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  test('should work with custom comparison function', () => {
    const customCompare = jest.fn((prev, next) => prev[0] === next[0]);

    const { rerender } = renderHook(
      ({ deps }) => useSmartEffect(mockEffect, deps, { compareFunction: customCompare }),
      { initialProps: { deps: [1, 'ignored'] } }
    );

    expect(mockEffect).toHaveBeenCalledTimes(1);

    rerender({ deps: [1, 'changed'] });
    expect(mockEffect).toHaveBeenCalledTimes(1);
    expect(customCompare).toHaveBeenCalled();

    rerender({ deps: [2, 'changed'] });
    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  test('should handle cleanup function', () => {
    const { rerender, unmount } = renderHook(
      ({ deps }) => useSmartEffect(mockEffect, deps),
      { initialProps: { deps: [1] } }
    );

    rerender({ deps: [2] });
    expect(mockCleanup).toHaveBeenCalledTimes(1);

    unmount();
    expect(mockCleanup).toHaveBeenCalledTimes(2);
  });

  test('should handle no dependencies (run on every render)', () => {
    const { rerender } = renderHook(() => useSmartEffect(mockEffect));

    expect(mockEffect).toHaveBeenCalledTimes(1);

    rerender();
    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  test('useDeepEffect should enable deep comparison by default', () => {
    const obj = { a: 1 };

    const { rerender } = renderHook(
      ({ deps }) => useDeepEffect(mockEffect, deps),
      { initialProps: { deps: [obj] } }
    );

    expect(mockEffect).toHaveBeenCalledTimes(1);

    rerender({ deps: [{ a: 1 }] });
    expect(mockEffect).toHaveBeenCalledTimes(1);
  });
});

describe('analyzeDeps', () => {
  test('should categorize primitive dependencies correctly', () => {
    const deps = [1, 'string', true, null, undefined];
    const analysis = analyzeDeps(deps);

    expect(analysis.primitives).toEqual([1, 'string', true, null, undefined]);
    expect(analysis.objects).toEqual([]);
    expect(analysis.functions).toEqual([]);
  });

  test('should categorize object dependencies correctly', () => {
    const obj = { a: 1 };
    const arr = [1, 2, 3];
    const deps = [obj, arr];
    const analysis = analyzeDeps(deps);

    expect(analysis.primitives).toEqual([]);
    expect(analysis.objects).toEqual([obj, arr]);
    expect(analysis.functions).toEqual([]);
    expect(analysis.potentiallyMissing.length).toBeGreaterThan(0);
  });

  test('should categorize function dependencies correctly', () => {
    const namedFn = function namedFunction() {};
    const anonymousFn = () => {};
    const deps = [namedFn, anonymousFn];
    const analysis = analyzeDeps(deps);

    expect(analysis.primitives).toEqual([]);
    expect(analysis.objects).toEqual([]);
    expect(analysis.functions).toEqual([namedFn, anonymousFn]);
    expect(analysis.potentiallyMissing.length).toBeGreaterThan(0);
  });

  test('should detect potentially missing dependencies', () => {
    const obj = { a: 1 };
    const arr = [1, 2, 3];
    const fn = () => {};
    const deps = [obj, arr, fn];
    const analysis = analyzeDeps(deps);

    expect(analysis.potentiallyMissing.length).toBe(3);
    expect(analysis.potentiallyMissing[0]).toContain('Object at index 0');
    expect(analysis.potentiallyMissing[1]).toContain('Array at index 1');
    expect(analysis.potentiallyMissing[2]).toContain('Anonymous function at index 2');
  });
});
