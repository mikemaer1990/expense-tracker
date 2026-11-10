# Deploying Supabase Edge Functions

Edge functions live in `supabase/functions/<name>/index.ts` and are configured in `supabase/config.toml`.

Current functions:
- `generate-recurring-transactions`: creates due recurring expenses and income

## Option 1: Supabase CLI (recommended)

1. Install the CLI:
   ```powershell
   scoop install supabase
   ```
   or `npm install -g supabase`
2. Log in: `supabase login`
3. Link the project: `supabase link --project-ref YOUR_PROJECT_REF`
   (the ref is in the dashboard URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`)
4. Deploy: `supabase functions deploy <name>`
5. Verify: `supabase functions list`

To remove a function: `supabase functions delete <name>`

## Option 2: Supabase Dashboard

1. Open your project, then **Edge Functions** in the sidebar
2. Create a new function with the same name as the folder
3. Paste the code from `supabase/functions/<name>/index.ts` and deploy

## Troubleshooting

- **"Function not found"**: check that you deployed to the right project and that the name matches exactly
- **Auth errors**: check `verify_jwt` for the function in `supabase/config.toml`

## Cost

The free tier includes 500,000 invocations/month, far more than this app uses.
