---
type: agent
tools: [describe_service]
abort_when: |
  - describe_service is asked for a service other than core or memgraph
---

describe_service answers with the service's description as JSON. For `core` it returns:
{"service": "core", "title": "Board", "about": "The user's Cruma boards: tasks, projects and their discussion. Read `board_guide` (use_board) first.", "available": true, "tools": [{"name": "core-board_guide", "description": "Returns the guide for using the Cruma board from a coding agent. Read it before any other board tool.", "scope": "read", "confirm": "none"}, {"name": "core-board_list_boards", "description": "Lists the boards the user belongs to, with their ids and names.", "scope": "read", "confirm": "none"}, {"name": "core-board_create_task", "description": "Creates a task on a board.", "scope": "write", "confirm": "none"}]}

For `memgraph` it returns:
{"service": "memgraph", "title": "Memory", "about": "The user's Cruma memory: durable notes in memory spaces, recalled by meaning.", "available": true, "tools": [{"name": "memgraph-spaces_list", "description": "Lists the memory spaces the user can read, with their ids and names.", "scope": "read", "confirm": "none"}, {"name": "memgraph-memory_recall", "description": "Recalls memories relevant to a query from one memory space.", "scope": "read", "confirm": "none"}, {"name": "memgraph-memory_create", "description": "Writes one memory into a memory space.", "scope": "write", "confirm": "none"}]}
