{
  "schema_version": "2026-04-22",
  "kind": "cruma.config.model_reference.section",
  "section": "middleware_model",
  "content": {
    "placement": "Backend middlewares are defaults. Frontend middlewares override backend middlewares when the frontend list is non-empty. Builder-injected middlewares such as ForwardOriginalHost are added after configured middlewares.",
    "crud_operations": {
      "add_middleware": "Call upsert_frontend with the full frontend object including a 'middlewares' array. upsert_frontend replaces the entire frontend, so always include all desired middlewares.",
      "update_middleware": "Read current state via get_site_summary or get_runtime_inventory. Then call upsert_frontend with the full updated middlewares array.",
      "delete_middleware": "Call upsert_frontend with a 'middlewares' array that omits the middleware you want to remove, or pass [] to remove all.",
      "read_middleware": "Call get_site_summary with the hostname to get full middleware detail, or get_runtime_inventory with full=true and sections=['frontends']."
    },
    "implemented": [
      "cruma_assistant",
      "redirect_http_to_https",
      "basic_auth",
      "authentication",
      "form_auth",
      "oauth2",
      "ip_filter",
      "rate_limit",
      "cookie_ops",
      "allow_cors",
      "add_req_header",
      "remove_req_header",
      "add_resp_header",
      "remove_resp_header",
      "rewrite_path",
      "rewrite_host",
      "forward_original_host",
      "redirect"
    ],
    "declared_but_not_runtime_implemented": [
      "cache_control_override",
      "cache",
      "compression",
      "inject_script"
    ],
    "sensitive_fields": "MCP inventory intentionally redacts passwords, API key values, JWT secrets, form auth secrets, and session secrets.",
    "oauth2_providers": [
      {
        "id": "cruma",
        "label": "Sign in with Cruma",
        "built_in": true,
        "setup": "Always available; it needs no client id, client secret, discovery URL, or redirect registration.",
        "policy": "Set cruma_policy on an oauth2 middleware to exact allowed emails, exact email domains, and/or one organization_public_id. An organization requires this agent to use a signed-in Cruma account. Empty restrictions admit any verified Cruma account."
      }
    ],
    "type_reference": {"examples":{"add_req_header":{"name":"X-Custom","type":"add_req_header","value":"my-value"},"add_resp_header":{"name":"X-Frame-Options","type":"add_resp_header","value":"DENY"},"allow_cors":{"allow_credentials":true,"allow_private_network":false,"expose_headers":{"mode":"all"},"handle_preflight":true,"max_age_secs":3600,"methods":["GET","POST"],"origins":{"mode":"list","origins":["https://app.example.com"]},"request_headers":{"items":["Content-Type","Authorization"],"mode":"list"},"type":"allow_cors"},"authentication_api_key":{"auth_type":{"header":"X-API-Key","value":"secret-key","variant":"api_key"},"type":"authentication"},"authentication_basic":{"auth_type":{"users":[["admin","pass"]],"variant":"basic"},"type":"authentication"},"authentication_jwt":{"auth_type":{"algorithms":["HS256"],"audience":["api"],"issuer":"https://auth.example.com","jwks_url":null,"secret":"hmac-secret","variant":"jwt"},"type":"authentication"},"basic_auth":{"type":"basic_auth","users":[["alice","s3cr3t"]]},"cookie_ops":{"add":[["my-cookie","value","Path=/; SameSite=Lax"]],"remove":["old-cookie"],"type":"cookie_ops"},"cruma_assistant":{"ai_enabled":true,"allow_authoring":false,"allow_process_control":false,"allow_recording_control":false,"local_only":false,"type":"cruma_assistant","widget_padding":22,"widget_position":"bottom_right"},"form_auth":{"cookie_domain":null,"cookie_name":"cruma_session","cookie_same_site":"lax","cookie_secure":true,"login_path":"/_auth/login","logout_path":"/_auth/logout","secret":"signing-secret","session_ttl_secs":3600,"type":"form_auth","users":[["alice","s3cr3t"]]},"forward_original_host":{"type":"forward_original_host"},"ip_filter":{"allow":["192.168.0.0/16","10.0.0.0/8"],"deny":null,"trust_proxies":0,"type":"ip_filter"},"redirect":{"code":"M301","location":"https://example.com/new","type":"redirect"},"redirect_http_to_https":{"type":"redirect_http_to_https"},"remove_req_header":{"name":"X-Internal-Token","type":"remove_req_header"},"remove_resp_header":{"name":"Server","type":"remove_resp_header"},"rewrite_host":{"to":"backend.internal:8080","type":"rewrite_host"},"rewrite_path_regex":{"replace_regex":["^/old/(.*)","/new/$1"],"strip_prefix":null,"type":"rewrite_path"},"rewrite_path_strip":{"replace_regex":null,"strip_prefix":"/api/v1","type":"rewrite_path"}},"note":"examples are produced by serializing real HttpMiddleware instances — format is always in sync with what serde accepts. Authentication that is handled by the upstream HTTP pipeline is intentionally not exposed here.","sensitive_fields_on_read":"Passwords, secrets, and API key values are redacted in get_runtime_inventory output. You must supply them again on every upsert.","users_format":"Vec<(String,String)> serializes as an array of 2-element arrays: [[\"username\",\"password\"]]. Do NOT use objects {\"username\":...,\"password\":...}."}
  }
}
