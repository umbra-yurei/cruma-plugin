// Grading for scripts/codex-eval.mjs: reads the `claude plugin eval` case files (prompt.md and
// graders/*.md frontmatter) and scores a Codex run with the same graders. `regex`, `tool_used`
// and `tool_order` are checked here; an `llm` grader returns its rubric for the model judge.
// Pure functions; scripts/codex-eval.test.mjs covers them.
import { BASH_TOOL, LOCAL_SERVER, MCP_TOOL_PREFIX, mcpToolName } from "./eval-cases.mjs";

function scalar(raw) {
  const value = raw.trim();
  if (value.startsWith("'") && value.endsWith("'") && value.length > 1) return value.slice(1, -1).replaceAll("''", "'");
  if (value.startsWith('"') && value.endsWith('"') && value.length > 1) return JSON.parse(value);
  if (value.startsWith("[") && value.endsWith("]")) return value.slice(1, -1).split(",").map(scalar).filter((item) => item !== "");
  if (/^-?\d+$/.test(value)) return Number(value);
  return value;
}

// The flat `key: value` frontmatter the eval files use, with one level of nesting (`before:`/`after:`).
export function parseFrontmatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!match) return { fields: {}, body: text };
  const fields = {};
  let parent;
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const entry = /^(\s*)([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (!entry) throw new Error(`unsupported frontmatter line: ${line}`);
    const [, indent, key, value] = entry;
    if (indent && parent) parent[key] = scalar(value);
    else if (value === "") parent = fields[key] = {};
    else {
      parent = undefined;
      fields[key] = scalar(value);
    }
  }
  return { fields, body: match[2] };
}

// `bash -lc '<script>'` (how Codex reports a shell command) -> `<script>`, so graders written for
// Claude's Bash tool input see the command line itself.
export function unwrapShell(command) {
  const wrapped = /^(?:\S*\/)?(?:ba|z)?sh\s+-l?c\s+([\s\S]+)$/.exec(command.trim());
  if (!wrapped) return command;
  const script = wrapped[1].trim();
  if (script.startsWith("'") && script.endsWith("'")) return script.slice(1, -1).replaceAll("'\\''", "'");
  if (script.startsWith('"') && script.endsWith('"')) return script.slice(1, -1).replace(/\\(["\\$`])/g, "$1");
  return script;
}

const APPROVAL_REFUSAL = /[^\n]*requires approval[^\n]*/i;

function resultText(result) {
  return (result?.content ?? []).map((content) => content.text ?? "").join("\n");
}

// One run as the graders see it. Tool names follow Claude's (`Bash`,
// `mcp__plugin_<plugin>_<server>__<tool>`) so a case's graders apply unchanged.
//   events     `codex exec --json` output (JSONL)
//   plugin     the plugin under test
//   lastMessage  the `-o` file Codex wrote
//   mockLog    the MCP stand-in's request log (JSONL), or ""
//   shimLog    the directory-shims stand-ins' calls.log, or ""
// `approvalRefusals` lists each tool call Codex refused as needing an approval ({ tool, message }).
export function runRecord({ events, plugin, lastMessage = "", mockLog = "", shimLog = "" }) {
  const messages = [];
  const calls = [];
  const trace = [];
  const approvalRefusals = [];
  let failure;
  for (const line of events.split("\n")) {
    if (!line.trim().startsWith("{")) continue;
    const event = JSON.parse(line);
    if (event.type === "turn.failed") failure = event.error?.message ?? "turn failed";
    if (event.type !== "item.completed") continue;
    const item = event.item;
    if (item.type === "agent_message") {
      messages.push(item.text);
      trace.push(item.text);
    } else if (item.type === "command_execution") {
      const command = unwrapShell(item.command);
      calls.push({ tool: BASH_TOOL, input: JSON.stringify({ command }) });
      trace.push(`$ ${command}\n${item.aggregated_output ?? ""}`);
    } else if (item.type === "mcp_tool_call") {
      const tool = mcpToolName(plugin, item.server, item.tool);
      const input = JSON.stringify(item.arguments ?? {});
      calls.push({ tool, input });
      trace.push(`${tool} ${input}\n${resultText(item.result)}${item.error?.message ?? ""}`);
    }
    // Codex refusing a call for want of an approval is a runner config gap, never a skill result.
    const said = [item.error?.message, item.aggregated_output, resultText(item.result)].filter(Boolean).join("\n");
    if (APPROVAL_REFUSAL.test(said)) approvalRefusals.push({ tool: item.type === "mcp_tool_call" ? mcpToolName(plugin, item.server, item.tool) : item.type, message: said.match(APPROVAL_REFUSAL)[0].trim() });
  }
  const mockCalls = mockLog
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line))
    .filter((request) => request.method === "tools/call");
  // The stand-in's log is the record of what reached the MCP server; it fills in if the event
  // stream carried no MCP calls.
  if (!calls.some((call) => call.tool.startsWith(MCP_TOOL_PREFIX))) {
    for (const request of mockCalls) calls.push({ tool: mcpToolName(plugin, LOCAL_SERVER, request.tool), input: JSON.stringify(request.arguments ?? {}) });
  }
  // A stand-in command (npm, curl, cruma, claude, node, uname) the event stream did not show.
  const commands = calls.filter((call) => call.tool === BASH_TOOL).map((call) => JSON.parse(call.input).command);
  for (const line of shimLog.split("\n").filter((entry) => entry.trim())) {
    if (!commands.some((command) => command.includes(line))) calls.push({ tool: BASH_TOOL, input: JSON.stringify({ command: line }) });
  }
  return {
    failure: messages.length ? undefined : failure,
    response: messages.join("\n\n"),
    lastMessage: lastMessage.trim() || messages.at(-1) || "",
    trace: trace.join("\n\n"),
    approvalRefusals,
    mockCalls: mockCalls.map((request) => `${request.tool} ${JSON.stringify(request.arguments ?? {})}`).join("\n"),
    calls,
  };
}

const knownTool = (tool) => tool === BASH_TOOL || tool.startsWith(MCP_TOOL_PREFIX);

// `{ status: "pass" | "fail" | "unsupported" | "judge", detail }`. A `judge` result carries the
// rubric and the text the model judge reads (`focus: trace` reads the whole trace).
export function grade({ fields, body }, record) {
  switch (fields.type) {
    case "regex": {
      const target = fields.target ?? "response";
      const text = { response: record.response, last_message: record.lastMessage, trace: record.trace, mock_calls: record.mockCalls }[target];
      if (text === undefined) return { status: "unsupported", detail: `regex target ${target}` };
      const pattern = fields.pattern ?? body.trim();
      const flags = fields.flags ?? "";
      const match = String(fields.match ?? "contains");
      const count = (text.match(new RegExp(pattern, flags.includes("g") ? flags : `${flags}g`)) ?? []).length;
      if (match === "contains") return { status: count > 0 ? "pass" : "fail", detail: `${target} ${count} match(es) of ${pattern}` };
      if (match === "not_contains") return { status: count === 0 ? "pass" : "fail", detail: `${target} ${count} match(es) of ${pattern}, expected none` };
      const exact = /^count:(\d+)$/.exec(match);
      if (exact) return { status: count === Number(exact[1]) ? "pass" : "fail", detail: `${target} ${count} match(es) of ${pattern}, expected ${exact[1]}` };
      return { status: "unsupported", detail: `regex match ${match}` };
    }
    case "tool_used": {
      if (!knownTool(fields.tool)) return { status: "unsupported", detail: `tool ${fields.tool} has no Codex equivalent` };
      const inputMatch = fields.input_match === undefined ? undefined : new RegExp(fields.input_match);
      const used = record.calls.filter((call) => call.tool === fields.tool && (!inputMatch || inputMatch.test(call.input))).length;
      const min = fields.min ?? 1;
      const max = fields.max ?? Infinity;
      return { status: used >= min && used <= max ? "pass" : "fail", detail: `${fields.tool}${inputMatch ? ` ~ ${fields.input_match}` : ""} used ${used}, expected ${min}..${max}` };
    }
    case "tool_order": {
      const [before, after] = [fields.before?.tool, fields.after?.tool];
      if (!before || !after || !knownTool(before) || !knownTool(after)) return { status: "unsupported", detail: `tool_order ${before} -> ${after}` };
      const first = (tool) => record.calls.findIndex((call) => call.tool === tool);
      return { status: first(before) >= 0 && first(before) < first(after) ? "pass" : "fail", detail: `${before} (call ${first(before)}) before ${after} (call ${first(after)})` };
    }
    case "llm":
      return { status: "judge", rubric: body.trim(), subject: fields.focus === "trace" ? record.trace : record.lastMessage };
    default:
      return { status: "unsupported", detail: `grader type ${fields.type}` };
  }
}

// The prompt the model judge gets for one `llm` grader: the rubric as written, then the run.
export function judgePrompt({ rubric, subject }) {
  return [
    "You grade one run of a coding agent against a rubric. Judge facts, never wording.",
    "Answer only with the JSON object the output schema describes: pass is true only if the rubric passes.",
    "",
    "<rubric>",
    rubric,
    "</rubric>",
    "",
    "<run>",
    subject,
    "</run>",
  ].join("\n");
}

export const JUDGE_SCHEMA = {
  type: "object",
  properties: { pass: { type: "boolean" }, reason: { type: "string" } },
  required: ["pass", "reason"],
  additionalProperties: false,
};
