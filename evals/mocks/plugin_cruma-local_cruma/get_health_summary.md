{
  "schema_version": "2026-04-22",
  "kind": "cruma.health.summary",
  "current_time_utc": "2026-11-02T12:00:00Z",
  "status": "ok",
  "issue_count": 0,
  "issues": [],
  "field_definitions": {
    "current_time_utc": "Wall-clock time when this summary was generated (UTC ISO 8601). Log line timestamps are in the same format so you can judge recency.",
    "status": "'ok' means no issues detected. 'degraded' means warnings only. 'critical' means at least one error-severity issue.",
    "issues": "Ordered list of detected issues. Each has kind, severity ('warning'|'error'), description, and suggestion. Log lines in issues include HH:MM:SSZ timestamps; only entries from the last 10 minutes are included.",
    "window_error_rate_pct": "Percentage of HTTP requests in the last 10 minutes that resulted in a 4xx or 5xx response."
  }
}
