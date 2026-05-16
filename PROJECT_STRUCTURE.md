# 🏺 AI SOFTWARE ARCHAEOLOGIST - PROJECT STRUCTURE

## 📁 Complete Directory Structure

```
ai-software-archaeologist/
├── README.md                          # Main project documentation
├── ARCHITECTURE.md                    # System architecture documentation
├── PROJECT_STRUCTURE.md              # This file
├── package.json                       # Root workspace configuration
├── .gitignore                        # Git ignore rules
│
├── backend/                          # Backend API (Node.js + Express + TypeScript)
│   ├── package.json                  # Backend dependencies
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── .env.example                  # Environment variables template
│   ├── .eslintrc.json               # ESLint configuration
│   │
│   ├── prisma/                       # Database schema and migrations
│   │   ├── schema.prisma            # Prisma schema definition
│   │   ├── seed.ts                  # Database seeding script
│   │   └── migrations/              # Database migrations
│   │
│   ├── src/
│   │   ├── index.ts                 # Application entry point
│   │   ├── app.ts                   # Express app configuration
│   │   │
│   │   ├── config/                  # Configuration files
│   │   │   ├── database.ts          # Database configuration
│   │   │   ├── jwt.ts               # JWT configuration
│   │   │   ├── upload.ts            # File upload configuration
│   │   │   └── logger.ts            # Winston logger configuration
│   │   │
│   │   ├── controllers/             # Request handlers
│   │   │   ├── auth.controller.ts
│   │   │   ├── repository.controller.ts
│   │   │   ├── analysis.controller.ts
│   │   │   ├── chat.controller.ts
│   │   │   ├── architecture.controller.ts
│   │   │   ├── documentation.controller.ts
│   │   │   └── onboarding.controller.ts
│   │   │
│   │   ├── routes/                  # API route definitions
│   │   │   ├── index.ts             # Main router
│   │   │   ├── auth.routes.ts
│   │   │   ├── repository.routes.ts
│   │   │   ├── analysis.routes.ts
│   │   │   ├── chat.routes.ts
│   │   │   ├── architecture.routes.ts
│   │   │   ├── documentation.routes.ts
│   │   │   └── onboarding.routes.ts
│   │   │
│   │   ├── services/                # Business logic layer
│   │   │   ├── auth.service.ts
│   │   │   ├── repository/          # Repository ingestion engine
│   │   │   │   ├── ingestion.service.ts
│   │   │   │   ├── zip-extractor.ts
│   │   │   │   ├── github-cloner.ts
│   │   │   │   ├── file-tree-builder.ts
│   │   │   │   ├── language-detector.ts
│   │   │   │   ├── dependency-parser.ts
│   │   │   │   └── import-analyzer.ts
│   │   │   │
│   │   │   ├── ai/                  # IBM Bob AI integration
│   │   │   │   ├── bob-orchestrator.ts
│   │   │   │   ├── context-builder.ts
│   │   │   │   ├── prompt-generator.ts
│   │   │   │   ├── response-synthesizer.ts
│   │   │   │   └── semantic-search.ts
│   │   │   │
│   │   │   ├── analysis/            # Analysis engines
│   │   │   │   ├── architecture-mapper.ts
│   │   │   │   ├── technical-debt-analyzer.ts
│   │   │   │   ├── complexity-analyzer.ts
│   │   │   │   ├── duplication-detector.ts
│   │   │   │   └── risk-detector.ts
│   │   │   │
│   │   │   ├── documentation/       # Documentation generation
│   │   │   │   ├── doc-generator.ts
│   │   │   │   ├── readme-generator.ts
│   │   │   │   ├── api-doc-generator.ts
│   │   │   │   └── architecture-doc-generator.ts
│   │   │   │
│   │   │   ├── onboarding/          # Onboarding intelligence
│   │   │   │   ├── path-generator.ts
│   │   │   │   ├── priority-analyzer.ts
│   │   │   │   └── learning-sequence.ts
│   │   │   │
│   │   │   └── chat.service.ts      # Chat conversation management
│   │   │
│   │   ├── middleware/              # Express middleware
│   │   │   ├── auth.middleware.ts   # JWT authentication
│   │   │   ├── error.middleware.ts  # Error handling
│   │   │   ├── validation.middleware.ts
│   │   │   ├── rate-limit.middleware.ts
│   │   │   └── upload.middleware.ts # File upload handling
│   │   │
│   │   ├── models/                  # Data models (Prisma generated)
│   │   │   └── index.ts
│   │   │
│   │   ├── types/                   # TypeScript type definitions
│   │   │   ├── express.d.ts
│   │   │   ├── repository.types.ts
│   │   │   ├── analysis.types.ts
│   │   │   ├── chat.types.ts
│   │   │   └── ai.types.ts
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   ├── logger.ts
│   │   │   ├── jwt.ts
│   │   │   ├── hash.ts
│   │   │   ├── file-system.ts
│   │   │   └── validators.ts
│   │   │
│   │   └── workers/                 # Background job workers
│   │       ├── repository-processor.worker.ts
│   │       ├── analysis.worker.ts
│   │       └── documentation.worker.ts
│   │
│   ├── uploads/                     # Uploaded files (gitignored)
│   ├── repositories/                # Extracted repositories (gitignored)
│   ├── logs/                        # Application logs (gitignored)
│   └── dist/                        # Compiled JavaScript (gitignored)
│
├── frontend/                        # Frontend Application (React + TypeScript + Vite)
│   ├── package.json                 # Frontend dependencies
│   ├── tsconfig.json                # TypeScript configuration
│   ├── tsconfig.node.json           # Node TypeScript config
│   ├── vite.config.ts               # Vite configuration
│   ├── tailwind.config.js           # TailwindCSS configuration
│   ├── postcss.config.js            # PostCSS configuration
│   ├── .env.example                 # Environment variables template
│   ├── .eslintrc.cjs                # ESLint configuration
│   ├── index.html                   # HTML entry point
│   │
│   ├── public/                      # Static assets
│   │   ├── vite.svg
│   │   └── favicon.ico
│   │
│   ├── src/
│   │   ├── main.tsx                 # Application entry point
│   │   ├── App.tsx                  # Root component
│   │   ├── index.css                # Global styles
│   │   │
│   │   ├── pages/                   # Page components
│   │   │   ├── Landing/
│   │   │   │   ├── LandingPage.tsx
│   │   │   │   ├── Hero.tsx
│   │   │   │   ├── Features.tsx
│   │   │   │   ├── HowItWorks.tsx
│   │   │   │   ├── Pricing.tsx
│   │   │   │   └── CTA.tsx
│   │   │   │
│   │   │   ├── Auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   └── ForgotPasswordPage.tsx
│   │   │   │
│   │   │   ├── Dashboard/
│   │   │   │   ├── DashboardPage.tsx
│   │   │   │   ├── RepositoryCard.tsx
│   │   │   │   ├── MetricsWidget.tsx
│   │   │   │   └── RecentActivity.tsx
│   │   │   │
│   │   │   ├── Repository/
│   │   │   │   ├── UploadPage.tsx
│   │   │   │   ├── RepositoryDetailPage.tsx
│   │   │   │   └── RepositoryInsights.tsx
│   │   │   │
│   │   │   ├── Architecture/
│   │   │   │   ├── ArchitectureExplorer.tsx
│   │   │   │   ├── DependencyGraph.tsx
│   │   │   │   └── ModuleDetails.tsx
│   │   │   │
│   │   │   ├── Chat/
│   │   │   │   ├── ChatPage.tsx
│   │   │   │   ├── ChatInterface.tsx
│   │   │   │   ├── MessageList.tsx
│   │   │   │   ├── MessageInput.tsx
│   │   │   │   └── CodeReference.tsx
│   │   │   │
│   │   │   ├── TechnicalDebt/
│   │   │   │   ├── DebtAnalyzerPage.tsx
│   │   │   │   ├── DebtOverview.tsx
│   │   │   │   ├── IssueList.tsx
│   │   │   │   ├── RiskHeatmap.tsx
│   │   │   │   └── MetricsChart.tsx
│   │   │   │
│   │   │   ├── Documentation/
│   │   │   │   ├── DocumentationPage.tsx
│   │   │   │   ├── DocGenerator.tsx
│   │   │   │   ├── DocPreview.tsx
│   │   │   │   └── DocExport.tsx
│   │   │   │
│   │   │   ├── Onboarding/
│   │   │   │   ├── OnboardingPage.tsx
│   │   │   │   ├── LearningPath.tsx
│   │   │   │   ├── PhaseCard.tsx
│   │   │   │   └── StepDetails.tsx
│   │   │   │
│   │   │   └── Settings/
│   │   │       ├── SettingsPage.tsx
│   │   │       ├── ProfileSettings.tsx
│   │   │       └── PreferencesSettings.tsx
│   │   │
│   │   ├── components/              # Reusable components
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── DashboardLayout.tsx
│   │   │   │
│   │   │   ├── ui/                  # UI primitives
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Dropdown.tsx
│   │   │   │   ├── Tabs.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── Progress.tsx
│   │   │   │   └── Tooltip.tsx
│   │   │   │
│   │   │   ├── common/
│   │   │   │   ├── LoadingState.tsx
│   │   │   │   ├── ErrorState.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   └── SkeletonLoader.tsx
│   │   │   │
│   │   │   └── features/
│   │   │       ├── FileUploader.tsx
│   │   │       ├── CodeViewer.tsx
│   │   │       ├── MarkdownRenderer.tsx
│   │   │       └── ChartWrapper.tsx
│   │   │
│   │   ├── hooks/                   # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useRepository.ts
│   │   │   ├── useChat.ts
│   │   │   ├── useAnalysis.ts
│   │   │   ├── useDebounce.ts
│   │   │   ├── useLocalStorage.ts
│   │   │   └── useWebSocket.ts
│   │   │
│   │   ├── services/                # API client services
│   │   │   ├── api.ts               # Axios instance
│   │   │   ├── auth.service.ts
│   │   │   ├── repository.service.ts
│   │   │   ├── analysis.service.ts
│   │   │   ├── chat.service.ts
│   │   │   ├── architecture.service.ts
│   │   │   ├── documentation.service.ts
│   │   │   └── onboarding.service.ts
│   │   │
│   │   ├── store/                   # State management
│   │   │   ├── authStore.ts         # Zustand auth store
│   │   │   ├── repositoryStore.ts
│   │   │   └── themeStore.ts
│   │   │
│   │   ├── types/                   # TypeScript types
│   │   │   ├── auth.types.ts
│   │   │   ├── repository.types.ts
│   │   │   ├── analysis.types.ts
│   │   │   ├── chat.types.ts
│   │   │   └── common.types.ts
│   │   │
│   │   ├── utils/                   # Utility functions
│   │   │   ├── cn.ts                # Class name merger
│   │   │   ├── format.ts            # Formatting utilities
│   │   │   ├── validation.ts
│   │   │   └── constants.ts
│   │   │
│   │   └── assets/                  # Images, icons, etc.
│   │       ├── images/
│   │       └── icons/
│   │
│   └── dist/                        # Production build (gitignored)
│
└── docs/                            # Additional documentation
    ├── API.md                       # API documentation
    ├── FRONTEND.md                  # Frontend guide
    ├── DEPLOYMENT.md                # Deployment guide
    └── CONTRIBUTING.md              # Contributing guidelines
```

## 📊 Key Statistics

- **Total Directories**: ~50
- **Backend Files**: ~60+
- **Frontend Files**: ~80+
- **Configuration Files**: 15+
- **Documentation Files**: 5+

## 🎯 Module Responsibilities

### Backend Modules

#### Repository Ingestion Engine
- Handles ZIP uploads and GitHub cloning
- Extracts and analyzes repository structure
- Detects languages, frameworks, dependencies
- Builds file trees and import graphs

#### IBM Bob AI Orchestration
- Manages AI context and prompts
- Handles multi-file reasoning
- Provides semantic search capabilities
- Synthesizes AI responses

#### Analysis Engines
- Architecture mapping and visualization
- Technical debt analysis
- Complexity and duplication detection
- Risk assessment

#### Documentation Generation
- Auto-generates README files
- Creates API documentation
- Produces architecture diagrams
- Builds onboarding guides

### Frontend Modules

#### Pages
- Landing page with hero and features
- Authentication flows
- Dashboard with metrics
- Repository management
- Architecture visualization
- AI chat interface
- Technical debt analyzer
- Documentation generator
- Onboarding guide

#### Components
- Reusable UI primitives
- Layout components
- Feature-specific components
- Loading and error states

#### Services
- API communication layer
- WebSocket connections
- State management
- Local storage handling

## 🔄 Data Flow

```
User Action (Frontend)
    ↓
API Request (Axios)
    ↓
Express Route Handler
    ↓
Controller (Validation)
    ↓
Service Layer (Business Logic)
    ↓
Database/AI/File System
    ↓
Response Synthesis
    ↓
JSON Response
    ↓
React Query Cache
    ↓
UI Update
```

## 🚀 Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Set up database**
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development servers**
   ```bash
   npm run dev
   ```

## 📝 Notes

- All TypeScript files use strict mode
- ESLint and Prettier configured for code quality
- Prisma for type-safe database access
- React Query for server state management
- Zustand for client state management
- TailwindCSS for styling
- Framer Motion for animations