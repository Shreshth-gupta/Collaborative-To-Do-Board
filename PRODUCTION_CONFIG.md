# 🚀 Production Configuration

## ✅ Your Deployed URLs
- **Frontend**: https://collaborative-to-do-board.vercel.app/
- **Backend**: https://collaborative-todo-backend.onrender.com
- **Database**: Supabase (configured)

## 🔧 Environment Variables to Set

### In Render (Backend) Dashboard:
```
DATABASE_URL=postgresql://postgres.ovsnbcetazumscobnlbl:Jack@1234@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
JWT_SECRET=838c2d11ed710149bffefb43e13838cca78dd8f46e53103e79d07874828d4aeaa145b23ab5327f0813c76e4f7a7738178cb09161b213fccfe8ea58fade2e42e5
NODE_ENV=production
FRONTEND_URL=https://collaborative-to-do-board.vercel.app
```

### In Vercel (Frontend) Dashboard:
```
REACT_APP_API_URL=https://collaborative-todo-backend.onrender.com/api
```

## 🧪 Test Your Deployment

1. **Backend API Test**: 
   Visit: https://collaborative-todo-backend.onrender.com/api/users
   Should return: `[]` (empty array)

2. **Frontend Test**:
   Visit: https://collaborative-to-do-board.vercel.app/
   Should show: Login/Register page

3. **Full Flow Test**:
   - Register a new account
   - Create a task
   - Test drag & drop
   - Test real-time updates (open 2 tabs)

## 🚨 If Not Working

### Check Render Logs:
1. Go to Render dashboard
2. Click your service
3. Check "Logs" tab for errors

### Check Vercel Logs:
1. Go to Vercel dashboard  
2. Click your project
3. Check "Functions" tab for errors

### Common Fixes:
- **CORS Error**: Update FRONTEND_URL in Render
- **API Error**: Update REACT_APP_API_URL in Vercel
- **Database Error**: Check DATABASE_URL format

## 🎉 Success Indicators
- ✅ Backend logs show "Database initialized successfully"
- ✅ Frontend loads without console errors
- ✅ Can register/login users
- ✅ Can create/edit/delete tasks
- ✅ Real-time updates work between tabs