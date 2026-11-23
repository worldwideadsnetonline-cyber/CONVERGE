# CONVERGE Web Platform

Web-first human-AI collaborative workspace. The original Electron prototype is preserved on main; this web rebuild is on web-platform.

## Current features
- Portuguese interface, chat, project selector and project creation
- Project memory create/list/delete and injection into assistant context
- OpenAI key stored server-side, not browser-side
- Responses API chat endpoint with web-search tool enabled
- Password login, HttpOnly session cookie, basic rate limit and security headers

## Local run
Node.js 20+.
1. `cd web`
2. `npm install`
3. PowerShell: `$env:OPENAI_API_KEY="your-key"` and `$env:CONVERGE_ADMIN_PASSWORD="long-password"`
   macOS/Linux: export both variables
4. `npm start`
5. Visit http://localhost:3000

## Deploy
Deploy the `web/` folder as a Node service. Set OPENAI_API_KEY and CONVERGE_ADMIN_PASSWORD as secret environment variables and configure HTTPS. Do not commit secrets.

## Prototype limitations
- Sessions are in-memory and reset on restart. This is not production multi-user authentication.
- Workspace data is a local JSON file; ephemeral hosting may lose it after redeploy. Production should use a managed database.
- Web search tool support depends on API model/account and must be verified at runtime.
- Before public production: durable auth/session, per-user access controls, CSRF protections as appropriate, backups, audit logs, privacy controls, and monitoring are required.
