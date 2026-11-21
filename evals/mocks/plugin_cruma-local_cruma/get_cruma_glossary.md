{
  "schema_version": "2026-04-22",
  "kind": "cruma.glossary",
  "terms": {
    "dir_server": "A built in type of backend that serves as the directory server for the tunnel agent. These can be used with directory indexing or only allow index.html. Can also render markdown as html if enabled, and also use index.md if no html file is present. You can have authentication in front of these just as with other types of backends and frontends. Used for serving files or websites.",
    "tunnel": "The live agent-to-Cruma ingress runtime context that produces an assigned public domain and carries tunneled traffic.",
    "assigned_domain": "The public hostname currently assigned to the running tunnel session.",
    "tunnel_plan": "The server-reported tier/subscription for the live tunnel session, such as anonymous or pro.",
    "listener": "A local ingress surface owned by the agent, such as http, https, or cruma. A listener binds locally and accepts inbound traffic into the proxy/runtime.",
    "frontend": "A routing rule that matches incoming traffic and maps it to a backend or process target. Frontends describe how requests enter the routing graph.",
    "backend": "An upstream destination or service that receives traffic from a frontend, such as a host:port target or local directory target.",
    "process": "A supervised local child process managed by Cruma's process-hosting subsystem.",
    "transport": "An underlying live tunnel connection/channel used by the runtime, such as a QUIC or HTTP/2 transport entry.",
    "listener_status": "Runtime state describing whether a configured local listener is actually bound and, if not, what the last bind error was.",
    "runtime_summary": "A compact live snapshot intended for quick orientation before using more specific tools.",
    "cruma_tunnel": "The live agent-to-Cruma ingress runtime context that produces an assigned public domain and carries tunneled traffic."
  }
}
