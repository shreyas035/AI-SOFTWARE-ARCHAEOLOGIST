/**
 * Test script to verify new feature endpoints
 * Run with: node test-endpoints.js
 */

const BASE_URL = 'http://localhost:3000/api/v1';

// You'll need to replace this with a valid JWT token from your login
const AUTH_TOKEN = 'YOUR_JWT_TOKEN_HERE';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

async function testEndpoint(name, method, url, body = null) {
  console.log(`\n🧪 Testing: ${name}`);
  console.log(`   ${method} ${url}`);
  
  try {
    const options = {
      method,
      headers,
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Success (${response.status})`);
      console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200) + '...');
    } else {
      console.log(`   ❌ Failed (${response.status})`);
      console.log(`   Error:`, data);
    }
    
    return { success: response.ok, status: response.status, data };
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log('🚀 Testing New Feature Endpoints');
  console.log('=' .repeat(50));
  
  // Note: You need to replace REPO_ID with an actual repository ID from your database
  const REPO_ID = 'YOUR_REPOSITORY_ID_HERE';
  
  console.log('\n📋 SEARCH ENDPOINTS');
  console.log('-'.repeat(50));
  
  // Test 1: Search repositories
  await testEndpoint(
    'Search Repositories',
    'GET',
    `${BASE_URL}/search/repositories?query=test&page=1&limit=10`
  );
  
  // Test 2: Search code (requires repository ID)
  await testEndpoint(
    'Search Code',
    'POST',
    `${BASE_URL}/search/code/${REPO_ID}`,
    {
      query: 'function',
      options: {
        regex: true,
        maxResults: 10
      }
    }
  );
  
  // Test 3: Search functions
  await testEndpoint(
    'Search Functions',
    'GET',
    `${BASE_URL}/search/functions/${REPO_ID}`
  );
  
  // Test 4: Search TODOs
  await testEndpoint(
    'Search TODOs',
    'GET',
    `${BASE_URL}/search/todos/${REPO_ID}`
  );
  
  console.log('\n📊 COMPARISON ENDPOINTS');
  console.log('-'.repeat(50));
  
  // Test 5: Compare repositories (requires 2 repository IDs)
  await testEndpoint(
    'Compare Repositories',
    'POST',
    `${BASE_URL}/comparison/compare`,
    {
      repositoryId1: REPO_ID,
      repositoryId2: REPO_ID // Replace with different ID
    }
  );
  
  // Test 6: Get comparison history
  await testEndpoint(
    'Comparison History',
    'GET',
    `${BASE_URL}/comparison/history?page=1&limit=10`
  );
  
  // Test 7: Get repository trends
  await testEndpoint(
    'Repository Trends',
    'GET',
    `${BASE_URL}/comparison/trends/${REPO_ID}?metric=complexity&period=30d`
  );
  
  // Test 8: Get benchmark comparison
  await testEndpoint(
    'Benchmark Comparison',
    'GET',
    `${BASE_URL}/comparison/benchmark/${REPO_ID}`
  );
  
  console.log('\n📤 EXPORT ENDPOINTS');
  console.log('-'.repeat(50));
  
  // Test 9: Generate summary
  await testEndpoint(
    'Generate Summary',
    'GET',
    `${BASE_URL}/export/summary/${REPO_ID}`
  );
  
  // Test 10: Export repository
  await testEndpoint(
    'Export Repository',
    'POST',
    `${BASE_URL}/export/repository/${REPO_ID}`,
    {
      format: 'json',
      includeAnalysis: true
    }
  );
  
  // Test 11: Create share link
  await testEndpoint(
    'Create Share Link',
    'POST',
    `${BASE_URL}/export/share/${REPO_ID}`,
    {
      expiresIn: 86400 // 24 hours
    }
  );
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Test run complete!');
  console.log('\n📝 Instructions:');
  console.log('1. Replace AUTH_TOKEN with your JWT token from login');
  console.log('2. Replace REPO_ID with an actual repository ID');
  console.log('3. Run: node test-endpoints.js');
}

// Run tests
runTests().catch(console.error);

// Made with Bob
