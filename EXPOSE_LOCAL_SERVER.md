# How to Expose Your Local Server to Others

When you run the server locally, only you can access it. To let others use it from GitHub Pages or anywhere else, you need to expose your local server to the internet.

## Quick Setup with ngrok (Recommended)

### Step 1: Install ngrok

**Windows:**
1. Download from https://ngrok.com/download
2. Extract the zip file
3. Add ngrok.exe to your PATH or use it directly

**Or use Chocolatey:**
```powershell
choco install ngrok
```

**Or use npm:**
```bash
npm install -g ngrok
```

### Step 2: Start Your Server

In one terminal, start your Node.js server:
```bash
node server.js
```

The server should be running on `http://localhost:3000`

### Step 3: Expose with ngrok

In another terminal, run:
```bash
ngrok http 3000
```

You'll see output like:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

### Step 4: Share the URL

Copy the `https://abc123.ngrok.io` URL and share it with others.

**For GitHub Pages users:**
Tell them to add `?api=https://abc123.ngrok.io` to the GitHub Pages URL:
```
https://neerajsingh-07.github.io/c-toglb/?api=https://abc123.ngrok.io
```

## Alternative: localtunnel

### Install localtunnel:
```bash
npm install -g localtunnel
```

### Expose your server:
```bash
lt --port 3000
```

You'll get a URL like: `https://random-name.loca.lt`

Share this URL with others.

## Alternative: Cloudflare Tunnel

### Install cloudflared:
Download from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/

### Expose your server:
```bash
cloudflared tunnel --url http://localhost:3000
```

## Important Notes

1. **Keep the server running** - The exposed URL only works while your server is running
2. **ngrok free tier** - The URL changes each time you restart ngrok (unless you have a paid plan)
3. **Security** - Anyone with the URL can access your API. Only share with trusted people
4. **Rate limits** - Free tiers may have rate limits

## For Permanent Deployment

If you want a permanent URL that doesn't require your local machine, deploy to:
- **Railway** (recommended) - https://railway.app
- **Render** - https://render.com
- **Heroku** - https://heroku.com

See [DEPLOYMENT.md](DEPLOYMENT.md) for details.

## Testing

Once you have your exposed URL (e.g., `https://abc123.ngrok.io`):

1. Test the API directly:
   ```bash
   curl https://abc123.ngrok.io/api/health
   ```

2. Use with GitHub Pages:
   ```
   https://neerajsingh-07.github.io/c-toglb/?api=https://abc123.ngrok.io
   ```

3. The API URL will be saved in localStorage, so users don't need to add it every time.

