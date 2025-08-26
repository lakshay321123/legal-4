'use client';
import React from 'react';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };

export default class ErrorBoundary extends React.Component<
  Props,
  { hasError: boolean; msg?: string }
> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, msg: undefined };
  }

  static getDerivedStateFromError(err: unknown) {
    return { hasError: true, msg: err instanceof Error ? err.message : String(err) };
  }

  componentDidCatch(err: unknown) {
    console.error('Client error caught by ErrorBoundary:', err);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="p-6 text-sm text-red-600">
            Something went wrong while rendering. Please refresh the page.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
