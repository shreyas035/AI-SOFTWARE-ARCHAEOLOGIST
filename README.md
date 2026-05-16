# 🏺 AI Software Archaeologist

> **Understand legacy codebases like discovering ancient civilizations.**

An enterprise-grade AI-powered platform that transforms how developers understand, maintain, and modernize complex legacy systems. Built with IBM Bob AI intelligence for deep codebase comprehension.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-20-green)

---

## 🎯 What is AI Software Archaeologist?

AI Software Archaeologist is a complete AI-powered legacy software intelligence platform that:

- 📦 **Analyzes entire repositories** - Upload ZIP files or connect GitHub repos
- 🏗️ **Reconstructs architecture** - Visualize system relationships and dependencies
- 💬 **Explains business logic** - Ask questions, get contextual answers
- 🗺️ **Maps dependencies** - Interactive architecture graphs
- ⚠️ **Detects dangerous areas** - Technical debt and risk analysis
- 📚 **Generates documentation** - Automatic README, API docs, guides
- 🧭 **Guides onboarding** - Personalized learning paths for new developers

---

## 🚀 Key Features

### 🤖 IBM Bob AI Integration
- **Multi-file reasoning** - Understands relationships across entire codebase
- **Contextual awareness** - Knows framework conventions and patterns
- **Business logic extraction** - Identifies what code does, not just how
- **Architecture reconstruction** - Infers system design from implementation

### 📊 Repository Intelligence
- **Language detection** - Automatic identification of tech stack
- **Framework analysis** - Detects React, Express, Django, Rails, etc.
- **Dependency mapping** - Visualizes module relationships
- **Entry point detection** - Finds main application files

### 🎨 Interactive Visualizations
- **Architecture graphs** - Drag, zoom, explore system structure
- **Dependency trees** - Understand module relationships
- **Risk heatmaps** - Identify problematic areas
- **Flow diagrams** - Trace execution paths

### ⚠️ Technical Debt Analysis
- **Complexity scoring** - McCabe, cognitive complexity
- **Code duplication** - Find repeated patterns
- **Security risks** - Detect vulnerabilities
- **Maintainability metrics** - Track code quality

### 📚 Auto-Documentation
- **README generation** - Project overview and setup
- **API documentation** - Endpoint reference
- **Architecture docs** - System design explanations
- **Onboarding guides** - Learning paths for new devs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Frontend (React + TypeScript)               │
│  Landing │ Dashboard │ Chat │ Visualizer │ Analyzer     │
└─────────────────────────────────────────────────────────┘
                          ↕ REST API
┌─────────────────────────────────────────────────────────┐
│              Backend (Node.js + Express)                 │
│  Repository Engine │ AI Orchestration │ Analysis Engine │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              Database (PostgreSQL + Prisma)              │
│  Users │ Repos │ Analyses │ Chats │ Docs │ Reports     │
└─────────────────────────────────────────────────────────┘
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **React Flow** - Architecture visualization
- **React Query** - Server state management
- **Zustand** - Client state management
- **Framer Motion** - Animations

### Backend
- **Node.js 20** - Runtime
- **Express** - Web framework
- **TypeScript** - Type safety
- **Prisma** - ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Winston** - Logging
- **Bull** - Job queue

### AI & Analysis
- **IBM Bob** - AI intelligence engine
- **Babel** - AST parsing
- **TypeScript Compiler API** - Code analysis
- **ESLint** - Code quality
- **Simple Git** - Git operations

---

## 📦 Installation

### Prerequisites
- Node.js 20+
- PostgreSQL 14+
- npm or yarn

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/your-org/ai-software-archaeologist.git
cd ai-software-archaeologist
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

4. **Set up database**
```bash
npm run db:migrate
npm run db:seed
```

5. **Start development servers**
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

---

## 🎮 Usage

### 1. Upload a Repository
- Click "Upload Repository"
- Choose ZIP file or enter GitHub URL
- Wait for analysis to complete

### 2. Explore Architecture
- Navigate to "Architecture Explorer"
- View interactive dependency graph
- Zoom, pan, and explore relationships

### 3. Ask Questions
- Open "AI Chat"
- Ask: "How does authentication work?"
- Get contextual, file-referenced answers

### 4. Analyze Technical Debt
- Go to "Technical Debt Analyzer"
- View risk scores and issues
- Prioritize improvements

### 5. Generate Documentation
- Click "Generate Docs"
- Choose documentation type
- Download or view generated docs

---

## 📖 Documentation

- [Architecture Guide](./ARCHITECTURE.md) - System design and components
- [API Reference](./docs/API.md) - Backend API documentation
- [Frontend Guide](./docs/FRONTEND.md) - UI components and patterns
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

---

## 🎯 Use Cases

### For Engineering Teams
- **Onboard new developers faster** - Reduce ramp-up time from months to days
- **Understand legacy systems** - Decode undocumented codebases
- **Plan refactoring** - Identify technical debt and risks
- **Document systems** - Auto-generate comprehensive docs

### For CTOs & Engineering Managers
- **Assess technical debt** - Quantify maintenance costs
- **Evaluate acquisitions** - Understand acquired codebases
- **Plan modernization** - Identify refactoring priorities
- **Track code quality** - Monitor maintainability metrics

### For Consultants
- **Rapid codebase assessment** - Understand client systems quickly
- **Generate proposals** - Identify improvement opportunities
- **Knowledge transfer** - Document systems for clients
- **Risk analysis** - Identify security and performance issues

---

## 🏆 Why AI Software Archaeologist?

### The Problem
- Fortune 500 companies spend **$300B+ annually** maintaining legacy systems
- New developers take **3-6 months** to understand legacy codebases
- **60% of engineering time** is spent understanding existing code
- Technical debt compounds **15-20% annually**
- Critical business logic is **trapped in undocumented systems**

### The Solution
AI Software Archaeologist uses advanced AI to instantly analyze repositories, reconstruct architecture, and generate documentation - **reducing onboarding time from months to days**.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **IBM Bob** - AI intelligence engine
- **React Flow** - Architecture visualization
- **Prisma** - Database ORM
- All open-source contributors

---

## 📞 Support

- 📧 Email: support@ai-archaeologist.com
- 💬 Discord: [Join our community](https://discord.gg/ai-archaeologist)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/ai-software-archaeologist/issues)
- 📚 Docs: [Documentation](https://docs.ai-archaeologist.com)

---

<div align="center">

**Built with ❤️ by developers, for developers**

[Website](https://ai-archaeologist.com) • [Documentation](https://docs.ai-archaeologist.com) • [Blog](https://blog.ai-archaeologist.com)

</div>