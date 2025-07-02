# Deployment Guide

## 🗄️ Supabase Database Setup 

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Choose organization and enter:
   - **Project Name**: `collaborative-todo`
   - **Database Password**: (save this password!)
   - **Region**: Choose closest to your users

### Step 2: Get Database Credentials
After project creation, go to **Settings** → **Database**:

**You'll need these values:**
- **Host**: `db.[YOUR-PROJECT-REF].supabase.co`
- **Database**: `postgres`
- **Username**: `postgres`
- **Password**: (the one you set during creation)
- **Port**: `5432`

**Connection String Format:**
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### Step 3: Enable Row Level Security (Optional)
In Supabase Dashboard → **Authentication** → **Settings**:
- Enable RLS if you want additional security
- For this app, you can disable it since we handle auth with JWT

---

## 🚀 Backend Deployment (Render)

### Step 1: Prepare Repository
1. Push your code to GitHub
2. Make sure `.env.example` is in your repo (not `.env`)

### Step 2: Deploy on Render
1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - **Name**: `collaborative-todo-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: Leave empty

### Step 3: Set Environment Variables
In Render dashboard → **Environment**:
```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your_random_secret_key_here
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
```

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository
5. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`

### Step 2: Set Environment Variables
In Vercel dashboard → **Settings** → **Environment Variables**:
```
REACT_APP_API_URL=https://your-render-app.onrender.com/api
```

---

## 📋 Required Credentials Checklist

### From Supabase:
- [ ] **Database Password** (you set this)
- [ ] **Project Reference** (from URL: `db.[THIS-PART].supabase.co`)
- [ ] **Full Connection String**

### Generate Yourself:
- [ ] **JWT Secret** (random string, e.g., use: `openssl rand -base64 32`)

### After Deployment:
- [ ] **Backend URL** (from Render: `https://your-app.onrender.com`)
- [ ] **Frontend URL** (from Vercel: `https://your-app.vercel.app`)

---

## 🔧 Testing Deployment

1. **Backend Health Check**: Visit `https://your-render-app.onrender.com/api/users`
2. **Frontend**: Visit your Vercel URL
3. **Database**: Check Supabase dashboard for table creation
4. **Real-time**: Test with multiple browser tabs

---

## 🚨 Common Issues

### Backend Issues:
- **Database Connection**: Check DATABASE_URL format
- **CORS Errors**: Ensure FRONTEND_URL is set correctly
- **Cold Starts**: Render free tier has cold starts (~30s delay)

### Frontend Issues:
- **API Calls Fail**: Check REACT_APP_API_URL
- **Socket Connection**: Ensure backend URL is correct
- **Build Errors**: Check all imports and dependencies

---

## 💡 Next Steps After Deployment

1. **Custom Domain**: Add your own domain in Vercel
2. **SSL**: Both Render and Vercel provide HTTPS automatically
3. **Monitoring**: Set up error tracking (Sentry, LogRocket)
4. **Performance**: Monitor with Vercel Analytics
5. **Scaling**: Upgrade to paid plans for better performance

Your app will be live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend**: `https://your-app.onrender.com`