# Security Notes

This repository is planned to be public. Treat it as public by default.

## Do Not Commit

Never commit:

- `.env` or `.env.*` files with real values
- OpenAI, ComfyUI gateway, GitHub, cloud, or license keys
- customer scenes, product files, private textures, renders, screenshots, videos, or generated outputs
- local 3ds Max / Blender project files unless they are deliberate public samples

## API Key Rule

The browser frontend must not contain private API keys.

The current prototype reads `OPENAI_API_KEY` only from the local Node server environment. Keep it that way. If a cloud demo is added later, route requests through a backend or hosted function with proper authentication and rate limits.

## Before Making Public

Before publishing or releasing:

1. Run a secret scan locally.
2. Check `git status` and the staged file list.
3. Search for common key names such as `OPENAI_API_KEY`, `sk-`, `token`, `secret`, and `password`.
4. Make sure sample files are intentional and do not contain customer data.
5. Enable GitHub secret scanning and push protection if available for the repository/account.

## If a Secret Leaks

If a secret is committed or pushed:

1. Revoke or rotate the secret immediately.
2. Remove it from the repository and history if needed.
3. Review logs for suspicious use.
4. Do not rely on deleting the file alone; old commits may still expose it.
