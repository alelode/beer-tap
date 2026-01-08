# Deployment Guide

This app consists of a React frontend (Vite) and an Express backend. Here are several deployment options:

## Prerequisites

1. Build the frontend:
```bash
npm run build
```

This creates the `dist/` folder with production-ready static files.

## Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. Sign up at [railway.app](https://railway.app)
2. Create a new project and connect your GitHub repository
3. Railway will auto-detect Node.js
4. Set the start command: `node server.js`
5. Railway will automatically:
   - Run `npm install`
   - Run `npm run build` (if you add it to build command)
   - Start your server

**Note:** Add a build command in Railway settings:
```
npm install && npm run build
```

**Environment Variables:**
- `PORT` - Railway will set this automatically (your server.js uses 3001, but Railway provides PORT env var)

**Update server.js for Railway:**
You may need to update the PORT to use `process.env.PORT || 3001`

### Option 2: Render

1. Sign up at [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your GitHub repository
4. Settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `node server.js`
   - **Environment:** Node
5. Render will handle the rest

**Update server.js for Render:**
Use `process.env.PORT || 3001` for the port

### Option 3: Fly.io

1. Install Fly CLI: `npm install -g @fly/cli`
2. Login: `fly auth login`
3. Initialize: `fly launch`
4. Deploy: `fly deploy`

### Option 4: Traditional VPS (DigitalOcean, AWS EC2, etc.)

1. **On your server:**
```bash
# Install Node.js (v18 or later)
# Clone your repository
git clone <your-repo-url>
cd beer

# Install dependencies
npm install

# Build the frontend
npm run build

# Install PM2 for process management
npm install -g pm2

# Start the server with PM2
pm2 start server.js --name beer-app

# Make PM2 start on boot
pm2 startup
pm2 save
```

2. **Set up Nginx as reverse proxy (optional but recommended):**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. **Set up SSL with Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 5: Separate Frontend/Backend (Advanced)

**Frontend (Vercel/Netlify):**
- Deploy the `dist/` folder to Vercel or Netlify
- Configure API proxy to your backend URL

**Backend (Railway/Render):**
- Deploy only the backend API
- Update frontend API calls to use backend URL

## Important Notes

### Update server.js for Production

For most platforms, you should update `server.js` to use environment variables:

```javascript
const PORT = process.env.PORT || 3001;
```

### State Persistence

The app uses `state.json` for data storage. On platforms like Railway/Render:
- The file system is ephemeral (data may be lost on restart)
- Consider using a database (MongoDB, PostgreSQL) or external storage for production

### Environment Variables

If deploying to a platform, you may want to make the port configurable:
- Update `server.js` to use `process.env.PORT || 3001`

## Quick Deploy Checklist

- [ ] Run `npm run build` locally to test
- [ ] Update `server.js` to use `process.env.PORT || 3001`
- [ ] Test production build locally: `npm run preview` (frontend only)
- [ ] Test full production: `node server.js` and visit `http://localhost:3001`
- [ ] Choose deployment platform
- [ ] Deploy and test

## Testing Production Build Locally

```bash
# Build the frontend
npm run build

# Start the production server
node server.js

# Visit http://localhost:3001
```




