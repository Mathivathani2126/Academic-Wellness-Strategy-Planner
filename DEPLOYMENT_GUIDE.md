# Academic Wellness Strategy Planner - Deployment Guide

This guide covers the necessary steps to take your application from your local machine and deploy it live to the web. We will use **Render** for the Express backend and MongoDB, and **Vercel** for the Vite/React frontend.

## Prerequisites
- A GitHub account.
- The entire project folder (`academic-wellness-strategy-planner`) pushed to a GitHub repository.
- A free account on [Render.com](https://render.com).
- A free account on [Vercel.com](https://vercel.com).
- A MongoDB Atlas cluster (or any hosted MongoDB URL).

---

## Part 1: Deploying the Backend (Render)

Render will host your backend API (`server/`) securely.

1. Log into your Render dashboard and click **New +** -> **Web Service**.
2. Connect your GitHub account and select your repository.
3. Configure the settings exactly as follows:
   - **Name:** `wellness-server-api` (or any name you prefer)
   - **Root Directory:** `server` *(Important! This tells Render to only run the backend)*
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Expand the **Advanced** tab and add the following **Environment Variables**:
   - `MONGO_URI` : *(Your remote MongoDB connection string, e.g., from MongoDB Atlas)*
   - `JWT_SECRET` : *(A secure random string, e.g., `s0m3_v3ry_s3cr3t_string`)*
5. Click **Create Web Service**. 
6. Wait 2-5 minutes for the build to finish. Once it says "Live", **copy your Render URL** (e.g., `https://wellness-server-api.onrender.com`).

---

## Part 2: Linking Frontend securely to Backend

Now that your backend is live, we need to point the frontend to it so they can communicate. We use the included `vercel.json` file to securely proxy the routes.

1. Open `client/vercel.json` in your local code editor.
2. It should look like this:
   ```json
   {
     "rewrites": [
       {
         "source": "/api/:path*",
         "destination": "https://YOUR_BACKEND_RENDER_URL.onrender.com/api/:path*"
       },
       {
         "source": "/(.*)",
         "destination": "/index.html"
       }
     ]
   }
   ```
3. Replace the `YOUR_BACKEND_RENDER_URL` domain with the actual URL you copied from Render in Part 1.
4. **Commit and Sync your changes** to GitHub so Vercel gets the newest file.

---

## Part 3: Deploying the Frontend (Vercel)

Vercel will quickly host your Vite/React frontend (`client/`).

1. Log into your Vercel dashboard and click **Add New** -> **Project**.
2. Connect to GitHub and select the same repository.
3. On the configuration screen:
   - **Framework Preset:** Select `Vite`
   - **Root Directory:** Edit this and select the `client` folder.
4. Click **Deploy**.

Vercel will automatically look at your `vercel.json` routing configuration and proxy all your frontend `/api/...` calls across the web securely to your hosted Render database server. 

## 🎉 Success!
Once Vercel finishes building (usually under 60 seconds), it will provide you with a live domain link. Your **Academic Wellness Strategy Planner** and **Admin Panel** are now fully online!
