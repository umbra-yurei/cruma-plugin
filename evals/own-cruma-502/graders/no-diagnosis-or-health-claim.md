---
type: regex
flags: i
pattern: '\b(failed|crash\w*|exit(ed)? (status|code)|127|not found|healthy|no sites|empty)\b'
match: not_contains
---
