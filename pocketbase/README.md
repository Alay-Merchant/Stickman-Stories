# PocketBase integration

PocketBase is the optional private project store for a hosted studio. It keeps the source, structured editorial data, QA report, and publishing metadata behind owner-only collection rules. The Next.js app talks to it only from server routes using a private superuser API token; that token must never be exposed to the browser.

## Start PocketBase

1. Download PocketBase for your worker host and put this repository's `pocketbase/pb_migrations` directory beside the executable.
2. Start it with a persistent `pb_data` volume, create a `studio_users` user in the dashboard, and record that user's ID.
3. Set the following private values in the Next.js runtime and worker:

```dotenv
POCKETBASE_URL=https://pocketbase.example.com
POCKETBASE_SUPERUSER_TOKEN=server-only-api-token
POCKETBASE_OWNER_ID=the-studio-users-record-id
POCKETBASE_PROJECT_COLLECTION=studio_projects
```

The migration creates `studio_users`, `studio_projects`, and `studio_jobs`. Source and artifact fields are protected, and records are limited to `owner = @request.auth.id` for direct client access.

## Hosting boundary

Vercel or Netlify can host the Next.js editor. Run PocketBase and the render worker on a persistent VM or container with a mounted volume. Do not render multi-minute Remotion/FFmpeg jobs inside a serverless function. Use PocketBase's protected file fields with S3-compatible file storage for large exports; keep its rate limiter, SMTP, backups, encryption setting, MFA, and superuser IP restrictions enabled.
