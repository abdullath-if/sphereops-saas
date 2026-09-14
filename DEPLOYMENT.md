# SphereOps — Production Deployment Guide

This guide walks you through deploying **SphereOps SaaS** to production across multiple hosting options.

---

## Architecture Overview

```
 [ Client: React 18 + Vite ]  --------(HTTPS REST / WSS)--------> [ Backend: Express / Node.js ]
   Hosted on: Vercel / Netlify                                       Hosted on: Render / Railway
                                                                                   |
                                                                                   v
                                                                        [ Database: MongoDB Atlas ]
```

---

## Option 1: Vercel (Frontend) + Render (Backend) + MongoDB Atlas [Recommended]

### Step 1: Database Setup (MongoDB Atlas)
1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and create a free account.
2. Create a new free cluster (Shared M0).
3. Under **Database Access**, create a user with read/write privileges (e.g. username: `sphereops_admin`, secure password).
4. Under **Network Access**, click **Add IP Address** and choose **Allow Access from Anywhere (`0.0.0.0/0`)**.
5. Under **Database > Clusters**, click **Connect > Drivers**, copy the connection string:
   ```
   mongodb+srv://sphereops_admin:<password>@cluster0.abcde.mongodb.net/company_saas?retryWrites=true&w=majority
   ```

---

### Step 2: Backend Deployment (Render)
1. Push your code to your GitHub repository:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git branch -M main
   git push -u origin main
   ```
2. Go to [render.com](https://render.com) and click **New > Web Service**.
3. Select your GitHub repository.
4. Configure the Web Service:
   - **Name**: `sphereops-api`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `MONGO_URI` | *Your MongoDB Atlas connection string from Step 1* |
   | `JWT_SECRET` | *A secure random string (at least 32 characters)* |
   | `JWT_EXPIRE` | `7d` |
   | `CLIENT_URL` | *Your Vercel frontend URL (e.g. `https://sphereops.vercel.app`), or `*` temporarily* |
6. Click **Deploy Web Service**.
7. Copy your backend live URL (e.g. `https://sphereops-api.onrender.com`).

---

### Step 3: Frontend Deployment (Vercel)
1. Go to [vercel.com](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. In the project configuration:
   - **Framework Preset**: `Vite`
   - **Root Directory**: click **Edit** and choose `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://sphereops-api.onrender.com` *(from Step 2)* |
   | `VITE_SOCKET_URL` | `https://sphereops-api.onrender.com` *(from Step 2)* |
5. Click **Deploy**.
6. Once deployed, update the `CLIENT_URL` environment variable on Render with your final Vercel domain (e.g. `https://your-project.vercel.app`).

---

## Option 2: Render Blueprint (1-Click Full Stack via `render.yaml`)

We have included a pre-configured `render.yaml` in the root of the project:

1. Push your repository to GitHub.
2. In Render dashboard, click **Blueprints > New Blueprint Instance**.
3. Select your repository.
4. Render will automatically detect `render.yaml` and provision:
   - `sphereops-api` (Backend Node.js web service)
   - `sphereops-web` (Frontend static site with SPA routing)
5. Fill in your `MONGO_URI` when prompted, and click **Apply**.

---

## Option 3: Docker & Docker Compose (Any VPS / Cloud Server)

To deploy on any Ubuntu, Debian, or cloud VM (AWS EC2, DigitalOcean Droplet, GCP):

1. Clone your repository on the server:
   ```bash
   git clone https://github.com/<your-username>/<your-repo>.git
   cd <your-repo>
   ```
2. Start the application with MongoDB using Docker Compose:
   ```bash
   docker compose up -d --build
   ```
3. The platform is now live on port `5000`!
   * Access via `http://<your-server-ip>:5000`
   * Set up an Nginx reverse proxy with Let's Encrypt SSL (`certbot`) for custom domain HTTPS.

---

## Pre-Seeding Demo Accounts on Production

To seed demo accounts, departments, projects, and tasks on your production database, you can run:

```bash
# Set your production MONGO_URI in server/.env or export it in your shell:
export MONGO_URI="mongodb+srv://sphereops_admin:<password>@cluster0.abcde.mongodb.net/company_saas?retryWrites=true&w=majority"
npm run seed
```

Or when the server starts up against an empty database for the first time, it will automatically populate the demo records!

### Seeded Credentials:
- **Admin**: `admin@company.com` / `Password123!`
- **Manager**: `manager.sarah@company.com` / `Password123!`
- **Manager**: `manager.david@company.com` / `Password123!`
- **Employee**: `marcus.v@company.com` / `Password123!`
- **Employee**: `elena.r@company.com` / `Password123!`
