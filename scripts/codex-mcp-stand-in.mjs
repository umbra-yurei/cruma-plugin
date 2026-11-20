// `cruma mcp` stand-in for scripts/codex-eval.mjs. Codex starts the cruma-local plugin's MCP
// launcher as shipped; the launcher finds the run's stand-in `cruma` (version 99.0.0) in
// ~/.local/bin and runs `cruma mcp`, which execs this server. Like the Claude eval CLI's mocks,
// it lists `_tools.json` and answers every call with the case's `<tool>.md` (else the suite's),
// unchanged; no answer is sequenced or generated. Each request is appended to the log as one
// JSON line, which the runner reads as the run's `mock_calls`.
//   node codex-mcp-stand-in.mjs <case mock dir> <suite mock dir> <log file>
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { LOCAL_SERVER, STAND_IN_VERSION } from "./eval-cases.mjs";

const [caseMocks, suiteMocks, log] = process.argv.slice(2);
const mockFile = (name) => [caseMocks, suiteMocks].map((directory) => join(directory, name)).find((file) => existsSync(file));
const tools = JSON.parse(readFileSync(mockFile("_tools.json"), "utf8")).tools;
const send = (message) => process.stdout.write(`${JSON.stringify({ jsonrpc: "2.0", ...message })}\n`);

function answer({ id, method, params }) {
  switch (method) {
    case "initialize":
      return send({ id, result: { protocolVersion: params?.protocolVersion ?? "2025-06-18", capabilities: { tools: {} }, serverInfo: { name: LOCAL_SERVER, version: STAND_IN_VERSION } } });
    case "ping":
      return send({ id, result: {} });
    case "tools/list":
      return send({ id, result: { tools } });
    case "tools/call": {
      const file = mockFile(`${params?.name}.md`);
      return send({
        id,
        result: file
          ? { content: [{ type: "text", text: readFileSync(file, "utf8") }] }
          : { isError: true, content: [{ type: "text", text: `cruma (eval stand-in): no mock for ${params?.name} in this case` }] },
      });
    }
    default:
      return send({ id, error: { code: -32601, message: `cruma (eval stand-in): unsupported method ${method}` } });
  }
}

createInterface({ input: process.stdin }).on("line", (line) => {
  if (!line.trim()) return;
  const request = JSON.parse(line);
  appendFileSync(log, `${JSON.stringify({ method: request.method, tool: request.params?.name, arguments: request.params?.arguments })}\n`);
  if (request.id !== undefined) answer(request);
});
