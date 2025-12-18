# Supabase Storage Setup Guide

This guide will help you set up Supabase Storage for your GoldenMunch POS System to fix the disappearing images issue.

## Why Supabase Storage?

Your images were disappearing because they were stored on the local filesystem, which is **ephemeral** on cloud platforms like:
- **Render**: Files are lost on container restarts/redeployments
- **Vercel**: Doesn't support persistent file uploads (serverless architecture)

**Supabase Storage** provides:
- ✅ Persistent cloud storage
- ✅ Free tier: 1GB storage
- ✅ CDN-backed image delivery
- ✅ Public URLs that never change
- ✅ Easy integration

## Setup Steps

### 1. Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

### 2. Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (looks like: `https://xxxxxxxxxxxxx.supabase.co`)
   - **service_role key** (⚠️ Use the **service_role** key, NOT the anon key!)

### 3. Configure Environment Variables

Add these to your environment variables in **Render** (or your hosting platform):

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here
```

**For Render:**
1. Go to your Render dashboard
2. Select your service
3. Go to **Environment** tab
4. Add the two variables above
5. Click **Save Changes**

**For local development:**
Add the variables to your `.env` file:
```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here
```

### 4. Create Storage Buckets

Run this command to create the required storage buckets:

```bash
npm run supabase:setup
```

This will create three buckets:
- **products**: Menu items, categories, cake flavors, themes
- **payment-qr**: Payment QR codes (GCash, PayMaya)
- **session-qr**: Custom cake session QR codes

### 5. Make Buckets Public

1. Go to **Storage** in your Supabase dashboard
2. For each bucket (`products`, `payment-qr`, `session-qr`):
   - Click on the bucket
   - Click **Settings** (gear icon)
   - Toggle **Public bucket** to ON
   - Click **Save**

### 6. Deploy Your Application

Redeploy your application on Render/Vercel:

**Render:**
- The service will automatically redeploy after you save environment variables
- Or manually trigger: **Manual Deploy** → **Deploy latest commit**

**Vercel:**
- Redeploy your frontend

### 7. Verify Everything Works

1. Log into your admin panel
2. Try uploading a product image
3. Check that the image appears correctly
4. Restart your Render service and verify the image is still there

## What Changed?

### Before (Local Filesystem)
```
[Upload] → Local /uploads folder → ❌ Lost on restart
```

### After (Supabase Storage)
```
[Upload] → Supabase Cloud Storage → ✅ Persists forever
```

### Image URLs

**Before:**
```
/uploads/products/product-1234567890.jpg
```

**After:**
```
https://xxxxx.supabase.co/storage/v1/object/public/products/products/product-1234567890.jpg
```

## Storage Buckets Structure

```
products/
  └── products/
      ├── product-1234567890.jpg
      ├── product-1234567891.png
      └── ...

payment-qr/
  ├── gcash-qr-1234567890.png
  └── paymaya-qr-1234567891.png

session-qr/
  ├── qr-1234567890.png
  └── ...
```

## Troubleshooting

### Images not uploading?
1. Check that `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set correctly
2. Verify buckets are created and set to **PUBLIC**
3. Check server logs for error messages

### Old images still showing local paths?
- Old images in the database still have local paths (`/uploads/...`)
- New uploads will use Supabase URLs
- You can manually update old records in the database, or re-upload images

### Storage quota exceeded?
- Free tier: 1GB storage
- Upgrade to Pro plan for more storage
- Optimize images before uploading

### CORS errors?
- Make sure buckets are set to PUBLIC in Supabase dashboard
- Check that your frontend URLs are allowed in CORS settings

## Migration Complete! 🎉

Your images will now persist across deployments and never disappear again!

## Support

If you encounter any issues:
1. Check the server logs in Render
2. Verify Supabase credentials are correct
3. Ensure buckets are public
4. Check the network tab in browser dev tools for failed requests

## Cost

**Supabase Free Tier:**
- 1GB storage
- 2GB bandwidth per month
- Unlimited API requests

For most small to medium POS systems, the free tier is sufficient. If you exceed limits, you can upgrade to the Pro plan ($25/month).
