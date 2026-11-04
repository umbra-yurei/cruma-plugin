{
  "schema_version": "2026-04-22",
  "kind": "cruma.process.logs",
  "limit": 50,
  "requested_limit": 50,
  "filter": null,
  "process_id": "app",
  "capacity": 8192,
  "total_pushed": 3,
  "returned": 3,
  "entries": [
    {
      "sequence": 1,
      "timestamp_unix_ms": 1793610000000,
      "process_id": "app",
      "level": "Info",
      "source": "System",
      "message": "PORT=41873"
    },
    {
      "sequence": 2,
      "timestamp_unix_ms": 1793610000050,
      "process_id": "app",
      "level": "Info",
      "source": "Stdout",
      "message": "  VITE v5.4.0  ready in 310 ms"
    },
    {
      "sequence": 3,
      "timestamp_unix_ms": 1793610000055,
      "process_id": "app",
      "level": "Info",
      "source": "Stdout",
      "message": "  Local: http://127.0.0.1:41873/"
    }
  ],
  "field_definitions": {
    "capacity": "Maximum number of aggregate process log entries retained by the live ring buffer.",
    "total_pushed": "Total number of aggregate process log entries pushed since this orchestrator started, including entries that may have been evicted.",
    "entries": "Newest matching entries, returned in chronological order from oldest to newest."
  }
}
