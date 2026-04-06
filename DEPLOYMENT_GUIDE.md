# Academic Wellness Strategy Planner - Deployment Guide

This guide covers the necessary steps to deploy your full-stack application (both Frontend and Backend) directly on **Render** as a single integrated web service.

## Prerequisites
- A GitHub account.
- The entire project folder pushed to a GitHub repository.
- A free account on [Render.com](https://render.com).
- A MongoDB Atlas cluster (for database hosting).

---

## Part 1: Setting up MongoDB
Before deploying on Render, you need a live internet database.
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and log in.
2. Create a **Free Shared Cluster (M0)**.
3. Set up **Database Access** by creating a Database User and Password.
4. Under **Network Access**, choose "Allow Access from Anywhere" (`0.0.0.0/0`).
5. Click **Connect**, choose "Connect your application", and copy your Connection String (it looks like `mongodb+srv://<username>:<password>@cluster...`).

---

## Part 2: Deploying the Full App to Render

Render will use the root `package.json` to automatically install dependencies for both the frontend and backend, build the frontend `dist` files, and boot the server which natively serves your React pages!

1. Log into your Render dashboard and click **New +** -> **Web Service**.
2. Connect your GitHub account and select your repository.
3. Configure the settings exactly as follows:
   - **Name:** `academic-wellness-app` (or any name)
   - **Root Directory:** *(Leave this blank! Do not type 'server')*
   - **Environment:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
4. Expand the **Advanced** tab and add the following **Environment Variables**:
   - `MONGO_URI` : *(Paste your MongoDB Atlas connection string here)*
   - `JWT_SECRET` : *(A secure random string, e.g., `s0m3_v3ry_s3cr3t_str1ng!&`)*
5. Click **Create Web Service**. 

Wait approximately 3-5 minutes for Render to execute the build. It will install all modules, compile the Vite frontend, and start your Express server. Once it says "Live", click the provided URL at the top left of your dashboard!

## 🎉 Success!
Your **Academic Wellness Strategy Planner** and **Admin Panel** are now fully online, backed by MongoDB and entirely hosted on Render.
