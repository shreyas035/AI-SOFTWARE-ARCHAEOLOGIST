# AI Archaeologist - User Guide

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- Git installed

### Initial Setup

1. **Clone and Install:**
```bash
cd "d:/bob hackathon"
npm install
```

2. **Setup Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
```

3. **Setup Database:**
```bash
cd backend
npx prisma migrate dev
npx prisma db seed  # Optional: Add sample data
```

4. **Setup Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
```

5. **Start the Application:**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

6. **Access the Application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api/v1

---

## 📖 Using the Application

### 1. User Registration & Login

#### Register a New Account
1. Open http://localhost:5173
2. Click "Register" or navigate to `/register`
3. Fill in:
   - Name
   - Email
   - Password
4. Click "Create Account"

#### Login
1. Navigate to `/login`
2. Enter your email and password
3. Click "Login"
4. You'll be redirected to the dashboard

---

### 2. Adding Repositories

#### Option A: Upload ZIP File
1. Go to "Repositories" page
2. Click "Add Repository"
3. Select "Upload ZIP"
4. Choose your repository ZIP file
5. Enter repository name
6. Click "Upload"

#### Option B: Clone from GitHub
1. Go to "Repositories" page
2. Click "Add Repository"
3. Select "GitHub URL"
4. Enter GitHub repository URL (e.g., `https://github.com/user/repo`)
5. Enter repository name
6. Click "Clone"

#### What Happens Next:
- Repository is uploaded/cloned
- Files are extracted and analyzed
- Language detection runs
- Dependency analysis starts
- Status changes from "processing" → "completed"

---

### 3. Viewing Repository Details

1. Click on any repository from the list
2. You'll see:
   - **Overview Tab**: Basic info, languages, file count
   - **Files Tab**: Browse repository file structure
   - **Analysis Tab**: Code quality metrics
   - **Architecture Tab**: System architecture diagram
   - **Documentation Tab**: Auto-generated docs
   - **Chat Tab**: Ask questions about the code

---

### 4. 🔍 NEW: Code Search Features

#### Search Across All Repositories
1. Go to "Repositories" page
2. Use the search bar at the top
3. Filter by:
   - Repository name
   - Language (JavaScript, Python, etc.)
   - Framework (React, Express, etc.)
   - Date range
   - Status

**Example:**
```
Search: "authentication"
Language: TypeScript
Framework: Express
```

#### Search Within a Repository

**Method 1: Using the UI (when implemented)**
1. Open a repository
2. Click "Search" tab
3. Enter your search query
4. Select search type:
   - Code patterns
   - Functions
   - Classes
   - Imports
   - TODOs

**Method 2: Using API Directly**
```bash
# Get your auth token first
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'

# Search for code patterns
curl -X POST http://localhost:3000/api/v1/search/code/YOUR_REPO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "async function",
    "options": {
      "regex": true,
      "maxResults": 50,
      "filePattern": "*.ts"
    }
  }'
```

#### Search Types Available:

**1. Code Pattern Search**
- Endpoint: `POST /api/v1/search/code/:repositoryId`
- Search for any code pattern using regex
- Example: Find all async functions, class definitions, etc.

**2. Function Search**
- Endpoint: `GET /api/v1/search/functions/:repositoryId`
- Find all function definitions
- Optional: Filter by function name

**3. Class Search**
- Endpoint: `GET /api/v1/search/classes/:repositoryId`
- Find all class definitions
- Optional: Filter by class name

**4. Import Search**
- Endpoint: `GET /api/v1/search/imports/:repositoryId`
- Find all import statements
- Optional: Filter by module name

**5. TODO Search**
- Endpoint: `GET /api/v1/search/todos/:repositoryId`
- Find all TODO/FIXME comments
- Great for tracking pending work

---

### 5. 📊 NEW: Repository Comparison

#### Compare Two Repositories

**Using API:**
```bash
curl -X POST http://localhost:3000/api/v1/comparison/compare \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "repositoryId1": "first-repo-id",
    "repositoryId2": "second-repo-id"
  }'
```

**What You Get:**
- **Tech Stack Comparison**: Languages, frameworks used
- **Complexity Metrics**: Which repo is more complex
- **Dependencies**: Common and unique dependencies
- **Architecture**: Structural differences
- **Code Metrics**: File counts, lines of code, etc.
- **Recommendations**: Suggestions for improvements

#### Compare Multiple Repositories

```bash
curl -X POST http://localhost:3000/api/v1/comparison/compare-multiple \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "repositoryIds": ["repo1-id", "repo2-id", "repo3-id"]
  }'
```

#### View Repository Trends

Track how your repository metrics change over time:

```bash
curl -X GET "http://localhost:3000/api/v1/comparison/trends/YOUR_REPO_ID?metric=complexity&period=30d" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Available Metrics:**
- `complexity` - Code complexity over time
- `debt` - Technical debt score
- `files` - Number of files
- `lines` - Lines of code

#### Benchmark Against Industry Standards

```bash
curl -X GET http://localhost:3000/api/v1/comparison/benchmark/YOUR_REPO_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

See how your repository compares to industry benchmarks for:
- Code complexity
- File sizes
- Test coverage
- Overall code quality

---

### 6. 📤 NEW: Export & Reporting

#### Generate Executive Summary

Get a high-level overview perfect for stakeholders:

```bash
curl -X GET http://localhost:3000/api/v1/export/summary/YOUR_REPO_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Includes:**
- Repository overview
- Key metrics and statistics
- Top issues and recommendations
- Technology stack summary

#### Export Repository Data

**JSON Format** (for API integration):
```bash
curl -X POST http://localhost:3000/api/v1/export/repository/YOUR_REPO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "format": "json",
    "includeAnalysis": true,
    "includeArchitecture": true,
    "includeTechnicalDebt": true
  }' \
  -o repository-export.json
```

**Markdown Format** (for documentation):
```bash
curl -X POST http://localhost:3000/api/v1/export/repository/YOUR_REPO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "format": "markdown",
    "includeAnalysis": true,
    "includeArchitecture": true
  }' \
  -o repository-report.md
```

**HTML Format** (for presentations):
```bash
curl -X POST http://localhost:3000/api/v1/export/repository/YOUR_REPO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "format": "html",
    "includeAnalysis": true,
    "includeArchitecture": true
  }' \
  -o repository-report.html
```

#### Create Shareable Links

Share analysis results with team members:

```bash
curl -X POST http://localhost:3000/api/v1/export/share/YOUR_REPO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "expiresIn": 86400
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shareLink": "http://localhost:3000/api/v1/export/share/abc123xyz",
    "token": "abc123xyz",
    "expiresAt": "2026-05-17T12:00:00Z"
  }
}
```

Share the link with anyone - no authentication required until expiration!

#### Export Comparison Reports

```bash
curl -X POST http://localhost:3000/api/v1/export/comparison \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "repositoryIds": ["repo1-id", "repo2-id"],
    "format": "markdown"
  }' \
  -o comparison-report.md
```

#### Bulk Export Multiple Repositories

```bash
curl -X POST http://localhost:3000/api/v1/export/bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "repositoryIds": ["repo1-id", "repo2-id", "repo3-id"],
    "format": "json"
  }' \
  -o bulk-export.zip
```

---

### 7. 💬 Chat with Your Code

1. Open a repository
2. Go to "Chat" tab
3. Ask questions like:
   - "What does this repository do?"
   - "Explain the authentication flow"
   - "What are the main dependencies?"
   - "Show me the API endpoints"
   - "What security issues should I be aware of?"

The AI will analyze your code and provide detailed answers!

---

### 8. 📊 View Analysis Results

#### Technical Debt Report
1. Open repository
2. Go to "Analysis" tab
3. View:
   - Overall debt score
   - Code smells
   - Complexity issues
   - Maintainability index
   - Recommendations

#### Architecture Diagram
1. Open repository
2. Go to "Architecture" tab
3. See:
   - System components
   - Dependencies between modules
   - Entry points
   - Data flow

---

## 🔧 Advanced Usage

### Using the API Directly

All features are available via REST API. Here's the base structure:

**Base URL:** `http://localhost:3000/api/v1`

**Authentication:**
All endpoints (except login/register) require JWT token:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Get Your Token:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpass"}'
```

### API Endpoints Reference

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `GET /auth/me` - Get current user

#### Repositories
- `GET /repositories` - List all repositories
- `POST /repositories` - Create repository
- `GET /repositories/:id` - Get repository details
- `DELETE /repositories/:id` - Delete repository

#### Search (NEW)
- `POST /search/code/:repositoryId` - Search code patterns
- `GET /search/functions/:repositoryId` - Search functions
- `GET /search/classes/:repositoryId` - Search classes
- `GET /search/imports/:repositoryId` - Search imports
- `GET /search/todos/:repositoryId` - Search TODOs
- `GET /search/repositories` - Advanced repository search

#### Comparison (NEW)
- `POST /comparison/compare` - Compare two repositories
- `POST /comparison/compare-multiple` - Compare multiple repositories
- `GET /comparison/history` - Get comparison history
- `GET /comparison/trends/:repositoryId` - Get repository trends
- `GET /comparison/benchmark/:repositoryId` - Benchmark comparison

#### Export (NEW)
- `POST /export/repository/:repositoryId` - Export repository
- `GET /export/summary/:repositoryId` - Generate summary
- `POST /export/share/:repositoryId` - Create share link
- `POST /export/comparison` - Export comparison
- `GET /export/analysis/:analysisId` - Export analysis
- `POST /export/bulk` - Bulk export

#### Analysis
- `POST /analysis/:repositoryId` - Run analysis
- `GET /analysis/:repositoryId` - Get analysis results

#### Chat
- `POST /chat/:repositoryId` - Send chat message
- `GET /chat/:repositoryId/history` - Get chat history

---

## 💡 Tips & Best Practices

### For Best Search Results:
1. Use regex patterns for flexible matching
2. Specify file patterns to narrow results (e.g., `*.ts` for TypeScript only)
3. Adjust `maxResults` based on your needs
4. Use `contextLines` to see surrounding code

### For Accurate Comparisons:
1. Ensure both repositories are fully analyzed first
2. Compare repositories of similar type/size for meaningful results
3. Use trends to track improvements over time

### For Effective Exports:
1. Choose JSON for API integration
2. Choose Markdown for documentation
3. Choose HTML for presentations
4. Set appropriate expiration times for share links

### For Better Analysis:
1. Upload complete repositories (not partial code)
2. Include dependency files (package.json, requirements.txt, etc.)
3. Wait for processing to complete before viewing results
4. Re-run analysis after major code changes

---

## 🐛 Troubleshooting

### "Repository not found"
- Verify you're using the correct repository ID
- Check the repository belongs to your account
- Ensure repository processing is complete

### "Unauthorized" errors
- Your JWT token may have expired - login again
- Check you're including the Authorization header
- Verify token format: `Bearer YOUR_TOKEN`

### Search returns no results
- Repository may not be fully processed
- Try broader search terms
- Check file patterns aren't too restrictive
- Verify repository has code files

### Export fails
- Check repository has analysis data
- Verify format is supported (json/markdown/html)
- Ensure you have permission to access the repository

For more detailed troubleshooting, see [`TROUBLESHOOTING_GUIDE.md`](TROUBLESHOOTING_GUIDE.md)

---

## 📚 Additional Resources

- **Architecture**: See [`ARCHITECTURE.md`](ARCHITECTURE.md)
- **Setup Guide**: See [`SETUP_GUIDE.md`](SETUP_GUIDE.md)
- **API Testing**: See [`backend/test-endpoints.js`](backend/test-endpoints.js)
- **Troubleshooting**: See [`TROUBLESHOOTING_GUIDE.md`](TROUBLESHOOTING_GUIDE.md)

---

## 🎯 Quick Reference

### Most Common Commands

**Start the app:**
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2  
cd frontend && npm run dev
```

**Get auth token:**
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"pass"}'
```

**List repositories:**
```bash
curl http://localhost:3000/api/v1/repositories \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Search code:**
```bash
curl -X POST http://localhost:3000/api/v1/search/code/REPO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query":"function","options":{"regex":true}}'
```

**Compare repositories:**
```bash
curl -X POST http://localhost:3000/api/v1/comparison/compare \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"repositoryId1":"ID1","repositoryId2":"ID2"}'
```

**Export repository:**
```bash
curl -X POST http://localhost:3000/api/v1/export/repository/REPO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"format":"markdown"}' \
  -o report.md
```

---

**Need Help?** Check the troubleshooting guide or review the API documentation!

**Last Updated:** 2026-05-16