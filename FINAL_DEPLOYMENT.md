# 🎯 Final Deployment Configuration

## ✅ Your Live URLs
- **Frontend**: https://collaborative-to-do-board.vercel.app
- **Backend**: https://collaborative-todo-backend.onrender.com

## 🔧 Update Environment Variables

### 1. In Render Dashboard (Backend):
Go to your service → Environment → Add these variables:

```
DATABASE_URL=postgresql://postgres.ovsnbcetazumscobnlbl:Jack@1234@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
JWT_SECRET=838c2d11ed710149bffefb43e13838cca78dd8f46e53103e79d07874828d4aeaa145b23ab5327f0813c76e4f7a7738178cb09161b213fccfe8ea58fade2e42e5
NODE_ENV=production
FRONTEND_URL=https://collaborative-to-do-board.vercel.app
```

### 2. In Vercel Dashboard (Frontend):
Go to your project → Settings → Environment Variables:

```
REACT_APP_API_URL=https://collaborative-todo-backend.onrender.com/api
```

## 🚀 Deploy Steps

### Step 1: Update Render
1. Go to Render dashboard
2. Click your backend service
3. Go to "Environment" tab
4. Add/update the environment variables above
5. Click "Save Changes" (will auto-redeploy)

### Step 2: Update Vercel  
1. Go to Vercel dashboard
2. Click your frontend project
3. Go to Settings → Environment Variables
4. Add `REACT_APP_API_URL` with the backend URL
5. Go to Deployments → Redeploy latest

## 🧪 Test Everything

### 1. Backend Test:
Visit: https://collaborative-todo-backend.onrender.com/api/users
Should return: `[]` (empty JSON array)

### 2. Frontend Test:
Visit: https://collaborative-to-do-board.vercel.app
Should show: Login page without errors

### 3. Full App Test:
1. Register new account
2. Create a task
3. Drag task between columns
4. Open second tab - test real-time sync
5. Check activity dropdown

## 🎉 Success!
Your collaborative to-do board is now live and ready to use!

**Share your app**: https://collaborative-to-do-board.vercel.app