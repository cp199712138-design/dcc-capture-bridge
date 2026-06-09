# Security

This repository is public-safe by default. Do not commit API keys, customer files,
render outputs, screenshots, private models, or generated texture/material data.

The browser UI never stores an API key. API calls are proxied through the local
Node server, which reads `OPENAI_API_KEY` from the environment.

Before sharing a test build:

- Keep `.env` local only.
- Use `.env.example` for setup instructions.
- Check `git status --short` before pushing.
- Keep customer assets out of the repository.
