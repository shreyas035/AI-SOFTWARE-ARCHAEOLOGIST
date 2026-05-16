# Troubleshooting Guide - New Features

## Quick Verification Steps

### 1. Verify Server is Running
The server logs show it's running successfully:
```
✅ Database connected successfully
🚀 Server is running on port 3000
🔗 API URL: http://localhost:3000/api/v1
```

### 2. Verify Routes are Registered
Check the server startup logs for route registration. All routes should be mounted at:
- `/api/v1/search/*`
- `/api/v1/comparison/*`
- `/api/v1/export/*`

### 3. Test Endpoints Manually

#### Get Your Auth Token
1. Login to get JWT token:
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

2. Copy the `token` from the response

#### Test Search Endpoints

**Search Repositories:**
```bash
curl -X GET "http://localhost:3000/api/v1/search/repositories?query=test&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Search Code in Repository:**
```bash
curl -X POST http://localhost:3000/api/v1/search/code/YOUR_REPO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "function",
    "options": {
      "regex": true,
      "maxResults": 10
    }
  }'
```

**Search Functions:**
```bash
curl -X GET http://localhost:3000/api/v1/search/functions/YOUR_REPO_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Search TODOs:**
```bash
curl -X GET http://localhost:3000/api/v1/search/todos/YOUR_REPO_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Comparison Endpoints

**Compare Two Repositories:**
```bash
curl -X POST http://localhost:3000/api/v1/comparison/compare \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "repositoryId1": "REPO_ID_1",
    "repositoryId2": "REPO_ID_2"
  }'
```

**Get Comparison History:**
```bash
curl -X GET "http://localhost:3000/api/v1/comparison/history?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Repository Trends:**
```bash
curl -X GET "http://localhost:3000/api/v1/comparison/trends/YOUR_REPO_ID?metric=complexity&period=30d" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Get Benchmark Comparison:**
```bash
curl -X GET http://localhost:3000/api/v1/comparison/benchmark/YOUR_REPO_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Export Endpoints

**Generate Executive Summary:**
```bash
curl -X GET http://localhost:3000/api/v1/export/summary/YOUR_REPO_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Export Repository:**
```bash
curl -X POST http://localhost:3000/api/v1/export/repository/YOUR_REPO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "format": "json",
    "includeAnalysis": true,
    "includeArchitecture": true
  }'
```

**Create Share Link:**
```bash
curl -X POST http://localhost:3000/api/v1/export/share/YOUR_REPO_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "expiresIn": 86400
  }'
```

---

## Common Issues and Solutions

### Issue 1: "Repository not found"
**Cause:** Invalid repository ID or repository doesn't belong to the user

**Solution:**
1. Get your repository IDs:
```bash
curl -X GET http://localhost:3000/api/v1/repositories \
  -H "Authorization: Bearer YOUR_TOKEN"
```

2. Use a valid repository ID from the response

### Issue 2: "401 Unauthorized"
**Cause:** Missing or invalid JWT token

**Solution:**
1. Login again to get a fresh token
2. Make sure you're including the token in the Authorization header
3. Check token hasn't expired (default: 7 days)

### Issue 3: "404 Not Found"
**Cause:** Incorrect endpoint URL

**Solution:**
1. Verify the endpoint path matches the routes
2. Check for typos in the URL
3. Ensure you're using the correct HTTP method (GET/POST)

### Issue 4: Search returns no results
**Cause:** Repository files not indexed or query doesn't match

**Solution:**
1. Verify repository has been processed (status: 'completed')
2. Check repository has a valid `filePath`
3. Try a broader search query
4. Use regex patterns for more flexible matching

### Issue 5: Comparison fails
**Cause:** Repositories don't have analysis data

**Solution:**
1. Run analysis on both repositories first
2. Ensure repositories have metadata populated
3. Check both repositories belong to the same user

---

## Using the Test Script

1. **Edit the test script:**
```bash
cd backend
nano test-endpoints.js
```

2. **Update these values:**
```javascript
const AUTH_TOKEN = 'your-actual-jwt-token';
const REPO_ID = 'your-actual-repository-id';
```

3. **Run the tests:**
```bash
node test-endpoints.js
```

---

## Debugging Tips

### Enable Detailed Logging
The server already logs all incoming requests. Check the terminal for:
```
[info]: Incoming request {"method":"POST","path":"/api/v1/search/code/..."}
```

### Check Database
Verify the new tables exist:
```bash
cd backend
npx prisma studio
```

Look for:
- SearchHistory
- ComparisonHistory  
- ShareLink

### Verify Prisma Client
If you see Prisma-related errors, regenerate the client:
```bash
cd backend
npx prisma generate
```

### Check File Permissions
Ensure the backend can read repository files:
```bash
ls -la uploads/repositories/
```

---

## Expected Responses

### Successful Search Response:
```json
{
  "success": true,
  "data": {
    "query": "function",
    "resultsCount": 5,
    "results": [
      {
        "file": "src/app.ts",
        "line": 25,
        "content": "function initialize() {",
        "context": {
          "before": ["...", "..."],
          "after": ["...", "..."]
        }
      }
    ]
  }
}
```

### Successful Comparison Response:
```json
{
  "success": true,
  "data": {
    "repositories": [...],
    "comparison": {
      "techStack": {...},
      "complexity": {...},
      "metrics": {...}
    },
    "recommendations": [...]
  }
}
```

### Successful Export Response:
```json
{
  "success": true,
  "data": {
    "summary": {
      "overview": {...},
      "keyMetrics": {...},
      "recommendations": [...]
    }
  }
}
```

---

## Frontend Integration

Once endpoints are verified, integrate into frontend:

1. **Create API service methods:**
```typescript
// frontend/src/services/api.ts
export const searchCode = async (repositoryId: string, query: string) => {
  return api.post(`/search/code/${repositoryId}`, { query });
};

export const compareRepositories = async (repo1: string, repo2: string) => {
  return api.post('/comparison/compare', { 
    repositoryId1: repo1, 
    repositoryId2: repo2 
  });
};

export const exportRepository = async (repositoryId: string, format: string) => {
  return api.post(`/export/repository/${repositoryId}`, { format });
};
```

2. **Create UI components** for each feature
3. **Add navigation** to access new features

---

## Need Help?

If features still aren't working after following this guide:

1. **Check server logs** for specific error messages
2. **Verify database migration** was successful
3. **Test with curl** before testing in frontend
4. **Check network tab** in browser DevTools for API errors
5. **Review the implementation files** for any TypeScript errors

---

**Last Updated:** 2026-05-16