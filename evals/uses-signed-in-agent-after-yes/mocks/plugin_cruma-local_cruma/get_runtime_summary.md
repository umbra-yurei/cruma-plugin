{
  "schema_version": "2026-04-22",
  "kind": "cruma.runtime.summary",
  "assigned_domain": "acme.tun.example.test",
  "tunnel_plan": "free",
  "transport_count": 2,
  "listener_status_count": 1,
  "active_listener_count": 1,
  "process_count": 1,
  "ipv6_assigned_addresses": [],
  "ipv6_tunnel_dns_name": null,
  "ipv6_tcp_port_dns_name": null,
  "overview": {
    "tunnel_account": "registered",
    "frontend_count": 1,
    "frontend_hostnames": [
      "api.acme.tun.example.test"
    ],
    "processes": [
      {
        "id": "api",
        "phase": "Failed"
      }
    ],
    "allow_persistent_changes": false,
    "http_mcp": {
      "enabled": true,
      "url": "http://mcp.localhost/mcp"
    }
  },
  "account": {
    "state": "signed_in"
  },
  "version": {
    "installed_version": "1.0.16",
    "latest_stable_version": "1.0.16",
    "update_available": false,
    "installed_via": "homebrew"
  },
  "field_definitions": {
    "assigned_domain": "Public hostname currently assigned to the live running tunnel session. Runtime value; not merely persisted config.",
    "tunnel_plan": "Server-reported subscription/tier for the current live tunnel session, if known.",
    "transport_count": "Number of transport entries currently tracked by the runtime snapshot. These are the underlying tunnel connections/channels, not frontends or backends.",
    "listener_status_count": "Number of local listener status records currently tracked by the runtime.",
    "active_listener_count": "Number of tracked local listeners currently bound and accepting connections.",
    "process_count": "Number of hosted process definitions currently configured in Cruma. This is not the total number of OS processes on the machine.",
    "ipv6_assigned_addresses": "IPv6 CIDR addresses assigned to the local tunnel interface by the server (e.g. '2001:db8::1/64'). Empty when IPv6 tunnel is inactive or not yet assigned.",
    "ipv6_tunnel_dns_name": "DNS name for direct IPv6 connectivity to this agent, assigned by the server. Resolves to the agent's IPv6 address.",
    "ipv6_tcp_port_dns_name": "DNS name used for IPv6 TCP port forwarding. Combine with a configured TCP port number to form an access address, e.g. '<dns>:2222'. See the tcp_ports section in get_runtime_inventory for configured ports.",
    "overview": "Typed overview of this live agent so a bridge can list running agents from tool output alone. tunnel_account: 'anonymous' (unregistered ANON tunnel) or 'registered'. frontend_hostnames and processes list at most 20 entries each, in configured order; frontend_count and process_count give the true totals. processes: id and lifecycle phase of each configured hosted process (empty when process hosting is unavailable). allow_persistent_changes: whether configuration changes a coding agent makes over the local socket are saved to disk (otherwise they apply only to the running session). http_mcp: enabled says whether this agent also serves MCP over HTTP at /mcp, and url is where it is reachable (absent when not served).",
    "account": "The tunnel's account. state: 'anonymous' (a time-limited tunnel with no account) or 'signed_in'. sign_up_url, present only when anonymous, is where the user creates a free Cruma account; tell the user about it once rather than on every result. expires_at (RFC 3339) and remaining_secs, present only on an anonymous tunnel whose time limit the server has reported, say when that limit runs out and how many seconds are left; when they are absent, state no time.",
    "version": "Version of this Cruma agent. installed_version: the agent that answers. latest_stable_version: the newest stable release, absent when it could not be checked (offline, or the first check is still running: call again later) and always absent for microsoft_store installs, which the Microsoft Store updates by itself. update_available: true only when latest_stable_version is newer. installed_via: how the binary was installed (homebrew, npm, cargo, nix, macos_app, linux_installer, microsoft_store, direct). upgrade_hint: how to upgrade, present only when update_available. Tell the user about an update once, with the upgrade_hint."
  }
}
