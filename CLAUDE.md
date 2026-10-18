# Instructions for Claude Code

This is **Ohm Sweet Ohm IT Support**, a retro-futuristic help desk portfolio project for the fictional Tomorrow Industries. Follow the theme section in PLAN.md for all styling. The full plan is in `PLAN.md`. Read it before starting any work.

## How to work with me
- I'm learning. After each change, explain in plain language what you did and why, in a few sentences.
- Work one phase (or one step) at a time. Stop and let me test before moving on.
- Tell me exactly how to test each change (a URL to visit, or a Thunder Client request with the JSON body).
- If something in PLAN.md seems wrong or there's a better approach, say so before changing it.
- I'm on Windows and use PowerShell in VS Code.

## Project rules
- Next.js App Router with TypeScript. Database is Neon PostgreSQL via `@neondatabase/serverless`.
- No Express and no MongoDB.
- SQL always uses parameters (`$1, $2`). Never build SQL from strings with user input.
- Every API route checks the session, role, and ownership on the server, following the permissions table in PLAN.md.
- Validate every request body with Zod.
- Never return `password_hash` from any route.
- `submitted_by` and other "who did this" values come from the session, never from the request body.
- Secrets only in environment variables. Never commit `.env.local`.
- Keep files small and readable. Add short comments on anything non-obvious.
