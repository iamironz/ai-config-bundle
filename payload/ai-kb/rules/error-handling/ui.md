# UI Error Handling

## Error Boundaries

### Placement Strategies
- **Component-level**: Granular, isolates single component failures
- **Layout-level**: Protects sections of UI
- **Top-level**: Catch-all for unhandled errors

### React Patterns
- Use `ErrorBoundary` components or `react-error-boundary`
- Limitations: Cannot catch event handlers, async, SSR errors
- `useErrorBoundary` hook for imperative error throwing

---

## User-Facing Error Messages

### Guidelines
- **Clarity**: Avoid technical jargon
- **Actionable**: Tell users exactly what to do
- **Empathy**: Acknowledge frustration
- **Specificity**: "Enter valid email" not "Invalid input"
- **Recovery options**: Retry button, alternatives, help links

### Accessibility
- Position errors near relevant input
- Ensure screen readers announce errors
- Use ARIA live regions for dynamic errors

---

## Error Monitoring

### Logging
- Structured format with timestamp, correlation ID, user context
- Full stack trace server-side only
- Generic message to client

### Integration
- Error reporting: Sentry, Datadog, LogRocket
- Session replay for user context
- Alert on error rate spikes, circuit opens

### Correlation
- Unique correlation ID across all services
- Distributed tracing: OpenTelemetry, Jaeger
- Error aggregation by type, endpoint, user segment
