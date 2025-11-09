# Deployment Guide

This guide will help you deploy the C# Unity Script to GLB Converter API so others can access it.

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)

1. Go to [Railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `c-toglb` repository
6. Railway will automatically detect Node.js and deploy
7. Your API will be live at: `https://your-app-name.railway.app`

**No configuration needed!** Railway will use the `railway.json` file.

### Option 2: Render (Free Tier Available)

1. Go to [Render.com](https://render.com)
2. Sign up/login with GitHub
3. Click "New +" → "Web Service"
4. Connect your GitHub repository `c-toglb`
5. Settings:
   - **Name:** c-toglb (or any name)
   - **Environment:** Node
   - **Build Command:** (leave empty)
   - **Start Command:** `node server.js`
   - **Plan:** Free (or paid)
6. Click "Create Web Service"
7. Your API will be live at: `https://c-toglb.onrender.com`

### Option 3: Heroku

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login:
   ```bash
   heroku login
   ```
3. Create app:
   ```bash
   heroku create c-toglb
   ```
4. Deploy:
   ```bash
   git push heroku main
   ```
5. Your API will be live at: `https://c-toglb.herokuapp.com`

### Option 4: Fly.io

1. Install Fly CLI: https://fly.io/docs/getting-started/installing-flyctl/
2. Login:
   ```bash
   fly auth login
   ```
3. Create app:
   ```bash
   fly launch
   ```
4. Follow prompts
5. Deploy:
   ```bash
   fly deploy
   ```

### Option 5: DigitalOcean App Platform

1. Go to [DigitalOcean](https://www.digitalocean.com)
2. Create App Platform project
3. Connect GitHub repository
4. Configure:
   - **Type:** Web Service
   - **Build Command:** (empty)
   - **Run Command:** `node server.js`
5. Deploy

## After Deployment

Once deployed, update your `index.html` to use the deployed URL instead of `localhost:3000`.

### Update index.html

Change this line in `index.html`:
```javascript
const response = await fetch('http://localhost:3000/api/upload', {
```

To:
```javascript
const response = await fetch('https://your-deployed-url.com/api/upload', {
```

Or make it dynamic:
```javascript
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : 'https://your-deployed-url.com';

const response = await fetch(`${API_URL}/api/upload`, {
```

## Environment Variables

The server uses:
- `PORT` - Automatically set by hosting platforms (defaults to 3000)

No additional environment variables needed!

## Testing Your Deployment

Once deployed, test with:

```bash
curl https://your-deployed-url.com/api/health
```

Should return:
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "..."
}
```

## Troubleshooting

### Port Issues
- Most platforms set `PORT` automatically via `process.env.PORT`
- The server already handles this correctly

### File Upload Issues
- Make sure the platform allows file uploads
- Check request size limits (may need to increase)

### CORS Issues
- The server already has CORS enabled for all origins
- Should work out of the box

## Recommended: Railway

Railway is the easiest option:
- ✅ Free tier available
- ✅ Automatic deployments from GitHub
- ✅ No configuration needed
- ✅ Custom domains available
- ✅ Easy to use

Just connect your GitHub repo and it deploys automatically!

