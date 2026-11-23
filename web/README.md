# CONVERGE Web Platform — foundational rebuild

This is a separate web-first platform branch. The existing Electron prototype is preserved on `main`.

## Vision
CONVERGE is a collaborative human–AI workspace, not merely a chat UI. It combines conversations, project context, durable memory, tools, web research, and task execution behind a user-controllable interface.

## Architecture (initial scaffold)
- `server/`: private server-side AI gateway; API key remains in environment variables and never in browser code.
- `public/`: browser interface.
- Project and memory endpoints are currently lightweight local JSON persistence for development. Production needs authenticated users, durable database, backups, and deployment secrets.
- Web search is a future tool integration; this scaffold does not pretend search is available until configured.

## Run locally
1. Install Node.js 22+.
2. From this folder: `npm install`
3. Set `OPENAI_API_KEY` in the server environment.
4. `npm start`
5. Open `http://localhost:3000`

Do not deploy publicly until authentication, authorization, rate limits, and secure database storage are implemented.
