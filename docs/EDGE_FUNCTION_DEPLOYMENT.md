# Deploying the Splitwise Edge Function

## What Was Created

**Edge Function:** `supabase/functions/splitwise-proxy/index.ts`
- Proxies requests to Splitwise API (bypasses CORS)
- Runs on Supabase's servers (not in browser)
- Uses your Splitwise API key securely

## Deployment Options

### Option 1: Deploy via Supabase CLI (Recommended)

#### Step 1: Install Supabase CLI

**Windows (PowerShell):**
```powershell
scoop install supabase
```

**Or via npm:**
```bash
npm install -g supabase
```

#### Step 2: Login to Supabase
```bash
supabase login
```

#### Step 3: Link your project
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

To find your project ref:
1. Go to https://supabase.com/dashboard
2. Open your project
3. Look at the URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`

#### Step 4: Deploy the function
```bash
supabase functions deploy splitwise-proxy
```

#### Step 5: Verify deployment
```bash
supabase functions list
```

---

### Option 2: Deploy via Supabase Dashboard (Easiest)

#### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Open your project
3. Go to "Edge Functions" in the left sidebar

#### Step 2: Create new function
1. Click "Create a new function"
2. Name: `splitwise-proxy`
3. Copy the code from `supabase/functions/splitwise-proxy/index.ts`
4. Paste into the editor
5. Click "Deploy"

---

## Testing the Edge Function

After deployment, test it with curl:

```bash
curl -X GET "YOUR_SUPABASE_URL/functions/v1/splitwise-proxy?endpoint=/get_current_user" \
  -H "x-api-key: YOUR_SPLITWISE_API_KEY"
```

Replace:
- `YOUR_SUPABASE_URL` with your Supabase URL (from env file)
- `YOUR_SPLITWISE_API_KEY` with `3YQaxMeqJic5ZpZrDcAhBkPgABU369LcM2M46vXA`

**Expected response:** JSON with your Splitwise user data

---

## Troubleshooting

### "Function not found"
- Make sure you deployed to the correct project
- Check function name is exactly `splitwise-proxy`

### "Missing API key"
- Ensure you're passing `x-api-key` header
- API key should be in the header, not query params

### "CORS error"
- Edge function should handle CORS automatically
- Check that you're calling the function from your domain

---

## Cost Estimate

**Free tier limits:**
- 500,000 invocations/month
- 2GB bandwidth/month

**Your estimated usage:**
- ~1,000 invocations/month
- ~1MB bandwidth/month

**Cost:** $0 (well within free tier)
