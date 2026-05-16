# Setup Guide - AI Software Archaeologist

## Prerequisites Installation

### 1. Install Node.js and npm

**Windows:**
1. Download Node.js LTS from: https://nodejs.org/
2. Run the installer (includes npm)
3. Verify installation:
   ```powershell
   node --version
   npm --version
   ```

**Alternative - Using Chocolatey (Windows Package Manager):**
```powershell
# Install Chocolatey first (if not installed)
# Then install Node.js
choco install nodejs-lts
```

**Alternative - Using Winget:**
```powershell
winget install OpenJS.NodeJS.LTS
```

### 2. Install PostgreSQL

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer
3. Set password for postgres user
4. Note the port (default: 5432)

**Alternative - Using Chocolatey:**
```powershell
choco install postgresql
```

## Project Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```powershell
   cd backend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Configure environment:**
   ```powershell
   # Copy example env file
   copy .env.example .env
   
   # Edit .env file with your settings:
   # - DATABASE_URL (PostgreSQL connection)
   # - JWT_SECRET (generate a random string)
   # - ANTHROPIC_API_KEY (your Claude API key)
   ```

4. **Setup database:**
   ```powershell
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed database (optional)
   npx prisma db seed
   ```

5. **Start backend server:**
   ```powershell
   npm run dev
   ```
   Backend will run on: http://localhost:3000

### Frontend Setup

1. **Navigate to frontend directory:**
   ```powershell
   cd frontend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Configure environment:**
   ```powershell
   # The .env file is already created with defaults
   # Edit if needed to change API URL
   ```

4. **Start frontend dev server:**
   ```powershell
   npm run dev
   ```
   Frontend will run on: http://localhost:5173

## Verification

### Check Backend
1. Open browser: http://localhost:3000/api/health
2. Should see: `{"status":"ok"}`

### Check Frontend
1. Open browser: http://localhost:5173
2. Should see login page
3. Register a new account
4. Login and explore dashboard

## Common Issues

### Port Already in Use
```powershell
# Backend (port 3000)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Frontend (port 5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Ensure database exists: `createdb archaeologist`

### TypeScript Errors
- Run: `npm install` in both directories
- Restart VS Code
- Run: `npx tsc --noEmit` to check types

### Module Not Found
```powershell
# Clear node_modules and reinstall
rm -r node_modules
rm package-lock.json
npm install
```

## Development Workflow

### Running Both Servers

**Option 1 - Two Terminals:**
```powershell
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Option 2 - Using Concurrently (from root):**
```powershell
# Install concurrently globally
npm install -g concurrently

# Run both
npm run dev
```

### Building for Production

**Backend:**
```powershell
cd backend
npm run build
npm start
```

**Frontend:**
```powershell
cd frontend
npm run build
npm run preview
```

## Project Structure

```
d:/bob hackathon/
├── backend/                 # Node.js + Express + Prisma
│   ├── src/
│   ├── prisma/
│   ├── package.json
│   └── .env
├── frontend/               # React + TypeScript + Vite
│   ├── src/
│   ├── package.json
│   └── .env
├── ARCHITECTURE.md
├── PHASE_10_SUMMARY.md
└── SETUP_GUIDE.md (this file)
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user
- POST `/api/auth/logout` - Logout user

### Repositories
- GET `/api/repositories` - List repositories
- POST `/api/repositories` - Create repository
- GET `/api/repositories/:id` - Get repository details
- DELETE `/api/repositories/:id` - Delete repository

### Analysis
- GET `/api/analysis/:repositoryId` - Get analysis
- GET `/api/analysis/:repositoryId/technical-debt` - Get technical debt

### Architecture
- GET `/api/architecture/:repositoryId` - Get architecture map
- POST `/api/architecture/:repositoryId/generate` - Generate map

### Chat
- GET `/api/chat/:repositoryId/sessions` - List chat sessions
- POST `/api/chat/:repositoryId/sessions` - Create session
- POST `/api/chat/:repositoryId/sessions/:sessionId/messages` - Send message

### Documentation
- GET `/api/documentation/:repositoryId` - Get documentation
- POST `/api/documentation/:repositoryId/generate` - Generate docs

## Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:password@localhost:5432/archaeologist
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=your-anthropic-api-key
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=104857600
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=AI Software Archaeologist
VITE_APP_VERSION=1.0.0
```

## Testing

### Backend Tests
```powershell
cd backend
npm test
npm run test:coverage
```

### Frontend Tests
```powershell
cd frontend
npm test
npm run test:ui
```

## Deployment

### Backend Deployment (Example: Railway/Render)
1. Set environment variables
2. Connect PostgreSQL database
3. Run migrations: `npx prisma migrate deploy`
4. Start: `npm start`

### Frontend Deployment (Example: Vercel/Netlify)
1. Build: `npm run build`
2. Deploy `dist` folder
3. Set environment variables
4. Configure API URL

## Support

For issues or questions:
1. Check ARCHITECTURE.md for system design
2. Check PHASE_10_SUMMARY.md for implementation details
3. Review error logs in console
4. Check database connections

## Next Steps After Setup

1. ✅ Install Node.js and PostgreSQL
2. ✅ Setup backend and run migrations
3. ✅ Setup frontend
4. ✅ Test authentication flow
5. 🚀 Start building features!

---

Made with ❤️ by Bob AI