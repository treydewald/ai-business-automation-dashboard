import React, { Suspense, ComponentType, lazy } from "react";
import { Spinner } from "../components/Spinner";

export function withLazyLoad<P extends object>(
  Component: ComponentType<P>,
  fallback: React.ReactNode = <Spinner />
) {
  return (props: P) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
}

export function lazyLoadComponent<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  displayName: string
) {
  const LazyComponent = lazy(importFunc);
  LazyComponent.displayName = `Lazy(${displayName})`;

  return (props: P) => (
    <Suspense fallback={<Spinner />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

export const lazyComponents = {
  WorkflowEditorPage: lazyLoadComponent(
    () => import("../pages/WorkflowEditorPage"),
    "WorkflowEditorPage"
  ),
  AnalyticsDashboard: lazyLoadComponent(
    () => import("../pages/AnalyticsDashboard"),
    "AnalyticsDashboard"
  ),
  ExecutionDashboard: lazyLoadComponent(
    () => import("../pages/ExecutionDashboard"),
    "ExecutionDashboard"
  ),
  WorkflowDetailsPage: lazyLoadComponent(
    () => import("../pages/WorkflowDetailsPage"),
    "WorkflowDetailsPage"
  ),
};
