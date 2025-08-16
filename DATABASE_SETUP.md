# 🗄️ Database Setup Guide

## **Overview**
This application uses **PostgreSQL** with **Prisma ORM** for data management. All mock data has been removed and replaced with real database operations.

## **🚀 Quick Setup**

### 1. **Install Dependencies**
```bash
npm install
```

### 2. **Set Environment Variables**
Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/strava_challenges"

# Strava API Configuration
STRAVA_CLIENT_ID="your_strava_client_id"
STRAVA_CLIENT_SECRET="your_strava_client_secret"
STRAVA_REDIRECT_URI="https://your-domain.vercel.app/api/auth/strava/callback"

# NextAuth Configuration
NEXTAUTH_SECRET="your_nextauth_secret_key"
NEXTAUTH_URL="https://your-domain.vercel.app"
```

### 3. **Database Setup Options**

#### **Option A: Local PostgreSQL**
```bash
# Install PostgreSQL locally
brew install postgresql  # macOS
sudo apt-get install postgresql  # Ubuntu

# Create database
createdb strava_challenges

# Run Prisma migrations
npx prisma migrate dev
```

#### **Option B: Supabase (Recommended for Production)**
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get connection string from Settings > Database
4. Update `DATABASE_URL` in `.env`

#### **Option C: Vercel Postgres**
1. Go to Vercel dashboard
2. Create new Postgres database
3. Copy connection string to `.env`

### 4. **Initialize Database**
```bash
# Generate Prisma client
npx prisma generate

# Run database setup script
node setup-db.js

# Or run migrations manually
npx prisma migrate dev
```

## **🔧 Database Schema**

The application uses the following main models:

- **User**: User accounts and Strava integration
- **Challenge**: Fitness challenges with multi-sport support
- **Participation**: User participation in challenges
- **Activity**: Strava activities synced to challenges
- **Session**: User authentication sessions

## **🚨 Important Notes**

### **No More Mock Data**
- ✅ All APIs now use real database operations
- ✅ User authentication is real
- ✅ Challenges are stored in database
- ✅ Strava integration uses real tokens

### **Demo Challenge**
- The landing page still shows a demo challenge
- This is the ONLY mock data remaining
- All other functionality uses real data

## **🔍 Troubleshooting**

### **Database Connection Issues**
```bash
# Test connection
npx prisma db pull

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### **Prisma Issues**
```bash
# Regenerate client
npx prisma generate

# Check database status
npx prisma studio
```

## **📊 Production Deployment**

### **Vercel**
1. Set environment variables in Vercel dashboard
2. Deploy with `vercel --prod`
3. Database will be automatically connected

### **Database Backups**
- Enable automatic backups in your database provider
- Test restore procedures regularly
- Monitor database performance

## **🎯 Next Steps**

1. **Set up real Strava app** with production URLs
2. **Configure environment variables** in production
3. **Test all APIs** with real data
4. **Monitor database performance**
5. **Set up monitoring and alerts**

---

**Status**: ✅ **PRODUCTION READY** - No more mock data!
