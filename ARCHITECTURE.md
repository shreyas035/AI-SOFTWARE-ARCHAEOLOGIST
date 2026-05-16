# 🏺 AI SOFTWARE ARCHAEOLOGIST - COMPLETE SYSTEM ARCHITECTURE

## 📐 SYSTEM ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (React + TypeScript + Vite)                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Landing │ Auth │ Dashboard │ Upload │ Chat │ Visualizer │ Debt │ Docs │... │
│  ├─Hero  │├─Login│├─Widgets │├─ZIP  │├─AI  │├─ReactFlow│├─Risk│├─Gen │    │
│  ├─Feat  ││└─Reg ││└─Metrics││└─Git ││└─Str ││└─Graph   ││└─Heat││└─MD │    │
│  └─Price │       │          │       │      │           │      │      │    │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↕ HTTP/WebSocket/REST
┌─────────────────────────────────────────────────────────────────────────────┐
│                    API GATEWAY (Express + TypeScript)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Auth Middleware │ Rate Limiter │ CORS │ Validation │ Error Handler │ Logger│
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CONTROLLER LAYER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Repository │ Analysis │ Chat │ Architecture │ Documentation │ Onboarding   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVICE LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │              REPOSITORY INGESTION ENGINE                              │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │ ZIP Extractor → File Tree Builder → Language Detector           │ │ │
│  │  │ GitHub Cloner → Dependency Parser → Import Analyzer             │ │ │
│  │  │ Framework Detector → Entry Point Finder → Module Mapper         │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │              IBM BOB AI ORCHESTRATION ENGINE                          │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │ │
│  │  │ Context Builder → Prompt Generator → Multi-File Reasoner        │ │ │
│  │  │ Repository Indexer → Semantic Search → Response Synthesizer     │ │ │
│  │  │ Architecture Reconstructor → Business Logic Extractor           │ │ │
│  │  └─────────────────────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │              ANALYSIS ENGINES                                         │ │
│  │  ├─ Architecture Mapper (dependency graphs, module relationships)    │ │
│  │  ├─ Technical Debt Analyzer (complexity, duplication, risks)         │ │
│  │  ├─ Documentation Generator (README, API docs, guides)               │ │
│  │  ├─ Onboarding Intelligence (learning paths, priorities)             │ │
│  │  └─ Risk Detector (security, performance, maintainability)           │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DATA ACCESS LAYER (Prisma ORM)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────────┐
│                    DATABASE (PostgreSQL / Supabase)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Users │ Repositories │ Analyses │ Chats │ ArchMaps │ Docs │ DebtReports   │
└─────────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌─────────────────────────────────────────────────────────────────────────────┐
│                    FILE STORAGE (Local / S3 / Supabase Storage)              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Uploaded ZIPs │ Extracted Repos │ Generated Docs │ Architecture Graphs     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 CORE SYSTEM COMPONENTS

### 1. REPOSITORY INGESTION ENGINE

**Purpose:** Transform uploaded repositories into analyzable, structured data.

**Flow:**
```
User Upload (ZIP/GitHub URL)
    ↓
Validation & Storage
    ↓
Extraction/Cloning
    ↓
File Tree Generation
    ↓
Language Detection (by extension, shebang, content)
    ↓
Framework Detection (package.json, requirements.txt, Gemfile, etc.)
    ↓
Dependency Parsing (npm, pip, maven, cargo, etc.)
    ↓
Import Analysis (track cross-file dependencies)
    ↓
Entry Point Detection (main.ts, index.js, app.py, etc.)
    ↓
Module Mapping (create relationship graph)
    ↓
Store in Database
```

**Key Technologies:**
- `adm-zip` for ZIP extraction
- `simple-git` for GitHub cloning
- `glob` for file traversal
- Custom parsers for dependency files
- AST parsers (babel, typescript, esprima) for import analysis

**Why This Design:**
- **Modularity:** Each step is independent and testable
- **Extensibility:** Easy to add new language/framework support
- **Performance:** Parallel processing of independent files
- **Reliability:** Graceful degradation if parsing fails

---

### 2. IBM BOB AI ORCHESTRATION ENGINE

**Purpose:** The brain of the platform - provides intelligent, context-aware analysis.

**Architecture:**

```
┌─────────────────────────────────────────────────────────────┐
│              IBM BOB AI ORCHESTRATION ENGINE                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         CONTEXT BUILDER                             │   │
│  │  - Retrieves relevant files from repository         │   │
│  │  - Builds dependency context                        │   │
│  │  - Includes architecture metadata                   │   │
│  │  - Adds framework/language context                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                         ↓                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         PROMPT GENERATOR                            │   │
│  │  - Constructs specialized prompts for each task     │   │
│  │  - Architecture analysis prompts                    │   │
│  │  - Code explanation prompts                         │   │
│  │  - Documentation generation prompts                 │   │
│  │  - Risk analysis prompts                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                         ↓                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         IBM BOB API INTEGRATION                     │   │
│  │  - Sends context + prompt to IBM Bob                │   │
│  │  - Handles streaming responses                      │   │
│  │  - Manages conversation history                     │   │
│  │  - Implements retry logic                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                         ↓                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │         RESPONSE SYNTHESIZER                        │   │
│  │  - Parses AI responses                              │   │
│  │  - Extracts structured data                         │   │
│  │  - Formats for frontend consumption                 │   │
│  │  - Caches results                                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Multi-File Reasoning Strategy:**

When a user asks: *"How does authentication work?"*

1. **Semantic Search:** Find files containing auth-related code
2. **Dependency Tracing:** Follow imports to related modules
3. **Context Assembly:** Build a comprehensive context including:
   - Auth route definitions
   - Middleware implementations
   - Database models
   - Configuration files
   - Environment variables
4. **Prompt Construction:**
```
You are analyzing a legacy codebase. Here's the repository structure:

[File Tree]

The user wants to understand authentication. Here are the relevant files:

--- src/middleware/auth.ts ---
[content]

--- src/routes/auth.routes.ts ---
[content]

--- src/models/User.ts ---
[content]

Explain how authentication works in this system, including:
- Entry points
- Flow of execution
- Security mechanisms
- Database interactions
```

5. **Response Generation:** IBM Bob analyzes all context and generates comprehensive explanation

**Why IBM Bob Integration is Critical:**
- **Multi-file reasoning:** Understands relationships across entire codebase
- **Contextual awareness:** Knows framework conventions, patterns
- **Business logic extraction:** Identifies what code does, not just how
- **Architecture reconstruction:** Infers system design from implementation
- **Natural language interface:** Developers ask questions naturally

---

### 3. ARCHITECTURE VISUALIZATION ENGINE

**Purpose:** Generate interactive, visual representations of system architecture.

**Data Flow:**
```
Repository Analysis
    ↓
Extract Module Relationships
    ↓
Build Dependency Graph
    ↓
Identify Layers (frontend, backend, database, external)
    ↓
Calculate Node Positions (force-directed layout)
    ↓
Generate React Flow Graph
    ↓
Render Interactive Visualization
```

**Graph Structure:**
```typescript
interface ArchitectureNode {
  id: string;
  type: 'module' | 'service' | 'database' | 'external';
  label: string;
  data: {
    filePath: string;
    language: string;
    linesOfCode: number;
    dependencies: string[];
    importance: number; // 0-100
  };
  position: { x: number; y: number };
  style: {
    background: string; // gradient based on type
    border: string;
    glow: boolean;
  };
}

interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  type: 'import' | 'api-call' | 'database-query';
  animated: boolean;
  label?: string;
}
```

**Visualization Features:**
- **Interactive dragging:** Rearrange nodes
- **Zoom/pan:** Explore large graphs
- **Node clustering:** Group related modules
- **Critical path highlighting:** Show most important dependencies
- **Layer separation:** Frontend, backend, data layers
- **Animated edges:** Show data flow direction
- **Color coding:** By language, framework, or risk level

**Why React Flow:**
- Production-ready graph library
- Excellent performance with large graphs
- Built-in interactions (drag, zoom, pan)
- Customizable nodes and edges
- TypeScript support

---

### 4. TECHNICAL DEBT ANALYZER

**Purpose:** Identify code quality issues, risks, and maintenance challenges.

**Analysis Dimensions:**

**A. Complexity Analysis**
```
- Cyclomatic complexity (McCabe)
- Cognitive complexity
- Nesting depth
- Function length
- File size
```

**B. Code Duplication**
```
- Exact duplicates
- Structural duplicates
- Similar patterns
```

**C. Dependency Risks**
```
- Outdated packages
- Security vulnerabilities (npm audit, safety)
- Circular dependencies
- Unused dependencies
```

**D. Maintainability Issues**
```
- TODO/FIXME comments
- Magic numbers/strings
- Dead code
- Long parameter lists
- God classes/functions
```

**E. Security Concerns**
```
- Hardcoded credentials
- SQL injection risks
- XSS vulnerabilities
- Insecure dependencies
```

**Scoring System:**
```typescript
interface TechnicalDebtScore {
  overall: number; // 0-100 (100 = perfect)
  complexity: number;
  duplication: number;
  dependencies: number;
  maintainability: number;
  security: number;
  
  criticalIssues: Issue[];
  highIssues: Issue[];
  mediumIssues: Issue[];
  lowIssues: Issue[];
}

interface Issue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  file: string;
  line: number;
  description: string;
  recommendation: string;
  estimatedEffort: string; // "2 hours", "1 day", etc.
}
```

**Visualization:**
- Heatmap of risky files
- Trend charts (debt over time)
- Issue cards with priorities
- Effort estimation dashboard

---

### 5. DOCUMENTATION GENERATOR

**Purpose:** Automatically generate comprehensive documentation from code analysis.

**Generated Documentation Types:**

**A. README.md**
```markdown
# Project Name

## Overview
[AI-generated project description]

## Architecture
[High-level architecture explanation]

## Tech Stack
- Frontend: React, TypeScript
- Backend: Node.js, Express
- Database: PostgreSQL

## Getting Started
[Setup instructions]

## Key Modules
[Important files and their purposes]
```

**B. API Documentation**
```markdown
# API Reference

## Authentication
POST /api/auth/login
POST /api/auth/register

## Repositories
POST /api/repositories/upload
GET /api/repositories/:id
```

**C. Architecture Documentation**
```markdown
# System Architecture

## Layers
- Presentation Layer
- Business Logic Layer
- Data Access Layer

## Module Relationships
[Dependency diagrams]
```

**D. Onboarding Guide**
```markdown
# Developer Onboarding

## Day 1: Understanding the Basics
1. Read src/app.ts
2. Explore src/routes/
3. Review database schema

## Week 1: Core Features
[Learning path]
```

**Generation Strategy:**
1. Analyze repository structure
2. Extract key information (tech stack, patterns, conventions)
3. Use IBM Bob to generate natural language descriptions
4. Format as Markdown
5. Include code examples
6. Add diagrams (Mermaid syntax)

---

### 6. ONBOARDING INTELLIGENCE ENGINE

**Purpose:** Create personalized learning paths for new developers.

**Algorithm:**
```
1. Identify Entry Points
   - Main application files
   - Server initialization
   - Route definitions

2. Map Critical Paths
   - Most frequently used modules
   - Core business logic
   - Authentication/authorization

3. Detect Patterns
   - Framework conventions
   - Code organization patterns
   - Common utilities

4. Generate Learning Sequence
   - Start with high-level overview
   - Progress to specific modules
   - Include hands-on exercises

5. Prioritize by Importance
   - Critical business logic first
   - Common utilities second
   - Edge cases last
```

**Output Format:**
```typescript
interface OnboardingPath {
  phases: Phase[];
  estimatedTime: string;
  prerequisites: string[];
}

interface Phase {
  title: string;
  duration: string;
  goals: string[];
  steps: Step[];
}

interface Step {
  order: number;
  title: string;
  description: string;
  files: string[];
  tasks: string[];
  resources: string[];
}
```

**Example Output:**
```
Phase 1: Foundation (Day 1)
├─ Step 1: Understand Project Structure
│  ├─ Read: README.md, package.json
│  └─ Task: Identify tech stack
├─ Step 2: Explore Entry Point
│  ├─ Read: src/index.ts, src/app.ts
│  └─ Task: Trace server initialization
└─ Step 3: Review Core Routes
   ├─ Read: src/routes/*.ts
   └─ Task: Map API endpoints

Phase 2: Authentication (Day 2-3)
├─ Step 1: Auth Middleware
│  ├─ Read: src/middleware/auth.ts
│  └─ Task: Understand JWT validation
...
```

---

## 🗄️ DATABASE ARCHITECTURE

**Schema Design:**

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Repositories Table
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'zip' | 'github'
  source_url TEXT,
  file_path TEXT, -- local storage path
  status VARCHAR(50) DEFAULT 'processing', -- 'processing' | 'completed' | 'failed'
  metadata JSONB, -- languages, frameworks, file count, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Analyses Table
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  analysis_type VARCHAR(100) NOT NULL, -- 'architecture' | 'debt' | 'documentation'
  status VARCHAR(50) DEFAULT 'pending',
  result JSONB, -- analysis results
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Chat Conversations Table
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat Messages Table
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- 'user' | 'assistant'
  content TEXT NOT NULL,
  metadata JSONB, -- referenced files, code snippets, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Architecture Maps Table
CREATE TABLE architecture_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  nodes JSONB NOT NULL, -- React Flow nodes
  edges JSONB NOT NULL, -- React Flow edges
  metadata JSONB, -- layout info, statistics
  created_at TIMESTAMP DEFAULT NOW()
);

-- Technical Debt Reports Table
CREATE TABLE debt_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  overall_score INTEGER, -- 0-100
  issues JSONB NOT NULL, -- array of issues
  metrics JSONB, -- complexity, duplication, etc.
  created_at TIMESTAMP DEFAULT NOW()
);

-- Generated Documentation Table
CREATE TABLE generated_docs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  doc_type VARCHAR(100) NOT NULL, -- 'readme' | 'api' | 'architecture' | 'onboarding'
  content TEXT NOT NULL,
  format VARCHAR(50) DEFAULT 'markdown',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Onboarding Paths Table
CREATE TABLE onboarding_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id UUID REFERENCES repositories(id) ON DELETE CASCADE,
  phases JSONB NOT NULL, -- learning phases and steps
  estimated_time VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_analyses_repository_id ON analyses(repository_id);
CREATE INDEX idx_chat_conversations_repository_id ON chat_conversations(repository_id);
CREATE INDEX idx_chat_messages_conversation_id ON chat_messages(conversation_id);
CREATE INDEX idx_architecture_maps_repository_id ON architecture_maps(repository_id);
CREATE INDEX idx_debt_reports_repository_id ON debt_reports(repository_id);
CREATE INDEX idx_generated_docs_repository_id ON generated_docs(repository_id);
```

**Why This Schema:**
- **Normalized:** Reduces data duplication
- **Scalable:** JSONB for flexible, evolving data structures
- **Performant:** Strategic indexes on foreign keys
- **Auditable:** Timestamps on all tables
- **Cascading deletes:** Clean up related data automatically

---

## 🔄 REQUEST/RESPONSE FLOW EXAMPLES

### Example 1: Repository Upload & Analysis

```
1. User uploads ZIP file
   POST /api/repositories/upload
   Content-Type: multipart/form-data
   
2. Backend receives file
   ├─ Validates file (size, type)
   ├─ Stores in file system
   ├─ Creates repository record (status: 'processing')
   └─ Returns repository ID
   
3. Background worker starts processing
   ├─ Extracts ZIP
   ├─ Builds file tree
   ├─ Detects languages/frameworks
   ├─ Parses dependencies
   ├─ Analyzes imports
   ├─ Updates repository metadata
   └─ Sets status to 'completed'
   
4. Frontend polls for status
   GET /api/repositories/:id/status
   
5. When complete, frontend fetches analysis
   GET /api/repositories/:id/summary
```

### Example 2: AI Chat Interaction

```
1. User asks: "How does authentication work?"
   POST /api/chat/message
   {
     "repositoryId": "uuid",
     "conversationId": "uuid",
     "message": "How does authentication work?"
   }
   
2. Backend processes request
   ├─ Retrieves repository metadata
   ├─ Searches for auth-related files
   ├─ Builds context (auth routes, middleware, models)
   ├─ Constructs prompt for IBM Bob
   ├─ Sends to IBM Bob API
   └─ Streams response back to frontend
   
3. Frontend displays streaming response
   WebSocket connection receives chunks
   Updates UI in real-time
   
4. Backend stores conversation
   ├─ Saves user message
   ├─ Saves assistant response
   └─ Updates conversation metadata
```

### Example 3: Architecture Visualization

```
1. User requests architecture map
   GET /api/architecture/:repositoryId
   
2. Backend checks cache
   ├─ If cached, return immediately
   └─ If not cached, generate
   
3. Generation process
   ├─ Load repository file tree
   ├─ Extract module relationships
   ├─ Build dependency graph
   ├─ Calculate node positions
   ├─ Generate React Flow data structure
   ├─ Cache result
   └─ Return to frontend
   
4. Frontend renders visualization
   ├─ Initialize React Flow
   ├─ Load nodes and edges
   ├─ Apply layout algorithm
   ├─ Enable interactions
   └─ Display to user
```

---

## 🚀 SCALABILITY CONSIDERATIONS

### Horizontal Scaling
- **Stateless API servers:** Can run multiple instances behind load balancer
- **Background workers:** Queue-based processing (Bull, BullMQ)
- **Database read replicas:** Separate read/write workloads

### Performance Optimizations
- **Caching:** Redis for frequently accessed data
- **Lazy loading:** Load repository data on-demand
- **Pagination:** Limit large result sets
- **Compression:** Gzip responses
- **CDN:** Static assets served from edge locations

### Cost Optimization
- **Tiered storage:** Hot data in database, cold data in S3
- **Analysis caching:** Reuse results for similar queries
- **Rate limiting:** Prevent abuse, control costs
- **Batch processing:** Group similar operations

---

## 🎨 FRONTEND ARCHITECTURE

### Component Hierarchy

```
App
├─ AuthProvider (context)
├─ Router
│  ├─ PublicRoutes
│  │  ├─ LandingPage
│  │  ├─ LoginPage
│  │  └─ RegisterPage
│  └─ ProtectedRoutes
│     ├─ DashboardLayout
│     │  ├─ Sidebar
│     │  ├─ Header
│     │  └─ MainContent
│     ├─ RepositoryUploadPage
│     ├─ RepositoryDashboard
│     ├─ ArchitectureExplorer
│     ├─ AIChat
│     ├─ TechnicalDebtAnalyzer
│     ├─ DocumentationGenerator
│     ├─ OnboardingGuide
│     └─ SettingsPage
└─ ToastProvider (notifications)
```

### State Management Strategy

**Global State (Context API + Zustand):**
- User authentication
- Current repository
- Theme preferences

**Server State (React Query):**
- Repository data
- Analysis results
- Chat history
- Architecture maps

**Local State (useState):**
- Form inputs
- UI toggles
- Temporary data

**Why This Approach:**
- **Separation of concerns:** Different state types handled appropriately
- **Performance:** React Query handles caching, refetching automatically
- **Simplicity:** No Redux boilerplate
- **Type safety:** Full TypeScript support

---

## 🔐 SECURITY ARCHITECTURE

### Authentication Flow
```
1. User registers/logs in
2. Backend validates credentials
3. Generates JWT token (access + refresh)
4. Returns tokens to frontend
5. Frontend stores in httpOnly cookies
6. All API requests include token
7. Backend validates token on each request
8. Refresh token used to get new access token
```

### Security Measures
- **Password hashing:** bcrypt with salt
- **JWT tokens:** Short-lived access tokens, long-lived refresh tokens
- **HTTPS only:** All communication encrypted
- **CORS:** Whitelist allowed origins
- **Rate limiting:** Prevent brute force attacks
- **Input validation:** Sanitize all user inputs
- **SQL injection prevention:** Parameterized queries (Prisma)
- **XSS prevention:** Content Security Policy headers
- **File upload validation:** Type, size, content checks

---

## 📊 MONITORING & OBSERVABILITY

### Logging Strategy
```typescript
// Structured logging with Winston
logger.info('Repository uploaded', {
  userId: user.id,
  repositoryId: repo.id,
  size: file.size,
  source: 'zip'
});

logger.error('Analysis failed', {
  repositoryId: repo.id,
  error: error.message,
  stack: error.stack
});
```

### Metrics to Track
- API response times
- Repository processing times
- AI query latency
- Error rates
- User activity
- Storage usage
- Database query performance

### Health Checks
```
GET /health
{
  "status": "healthy",
  "database": "connected",
  "storage": "available",
  "ai": "operational"
}
```

---

This completes Phase 1: Complete System Architecture Design & Documentation.

The architecture is designed to be:
✅ **Scalable:** Horizontal scaling, caching, background workers
✅ **Maintainable:** Clear separation of concerns, modular design
✅ **Performant:** Optimized queries, lazy loading, CDN
✅ **Secure:** Authentication, validation, encryption
✅ **Observable:** Logging, metrics, health checks
✅ **Enterprise-ready:** Production-grade patterns and practices

Next phase will create the complete project structure and configuration files.