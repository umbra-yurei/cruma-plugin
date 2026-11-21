{
  "schema_version": "2026-04-22",
  "kind": "cruma.process.logs",
  "limit": 50,
  "requested_limit": 50,
  "filter": null,
  "process_id": "api",
  "capacity": 8192,
  "total_pushed": 2,
  "returned": 2,
  "entries": [
    {
      "sequence": 1,
      "timestamp_unix_ms": 1793610000000,
      "process_id": "api",
      "level": "Error",
      "source": "Stderr",
      "message": "sh: line 1: node: command not found"
    },
    {
      "sequence": 2,
      "timestamp_unix_ms": 1793610000005,
      "process_id": "api",
      "level": "Error",
      "source": "System",
      "message": "process exited with status 127"
    }
  ],
  "field_definitions": {
    "capacity": "Maximum number of aggregate process log entries retained by the live ring buffer.",
    "total_pushed": "Total number of aggregate process log entries pushed since this orchestrator started, including entries that may have been evicted.",
    "entries": "Newest matching entries, returned in chronological order from oldest to newest."
  }
}
