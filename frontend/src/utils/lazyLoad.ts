import { lazy, type ComponentType } from 'react';

/**
 * Lazy load a component with dynamic import
 * Supports code splitting at the route level
 */
export const lazyLoadComponent = <P extends object>(
  importStatement: () => Promise<{ default: ComponentType<P> }>
): ComponentType<P> => {
  return lazy(importStatement);
};

/**
 * Load a component and provide a fallback while loading
 */
export const createLazyComponent = <P extends object>(
  importStatement: () => Promise<{ default: ComponentType<P> }>,
  _displayName: string
): ComponentType<P> => {
  return lazy(importStatement);
};

/**
 * Prefetch a component (preload it in the background)
 */
export const prefetchComponent = (
  importStatement: () => Promise<{ default: ComponentType<any> }>
) => {
  if (typeof window !== 'undefined') {
    // Use requestIdleCallback if available, otherwise use setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        importStatement();
      });
    } else {
      setTimeout(() => {
        importStatement();
      }, 2000);
    }
  }
};

/**
 * Create a lazy-loaded route component
 */
export const lazyPage = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  name: string = 'Page'
) => {
  return createLazyComponent(importFn, name);
};
