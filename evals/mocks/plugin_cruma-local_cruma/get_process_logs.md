{
  "schema_version": "2026-04-22",
  "kind": "cruma.process.logs",
  "limit": 50,
  "requested_limit": 50,
  "filter": null,
  "process_id": null,
  "capacity": 8192,
  "total_pushed": 0,
  "returned": 0,
  "entries": [],
  "field_definitions": {
    "capacity": "Maximum number of aggregate process log entries retained by the live ring buffer.",
    "total_pushed": "Total number of aggregate process log entries pushed since this orchestrator started, including entries that may have been evicted.",
    "entries": "Newest matching entries, returned in chronological order from oldest to newest."
  }
}
