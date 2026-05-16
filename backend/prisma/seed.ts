import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create demo users
  const hashedPassword = await bcrypt.hash('demo123456', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@ai-archaeologist.com' },
    update: {},
    create: {
      email: 'demo@ai-archaeologist.com',
      passwordHash: hashedPassword,
      name: 'Demo User',
      role: 'USER',
    },
  });

  console.log('✅ Created demo user:', demoUser.email);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@ai-archaeologist.com' },
    update: {},
    create: {
      email: 'admin@ai-archaeologist.com',
      passwordHash: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', adminUser.email);

  // Create a sample repository
  const sampleRepo = await prisma.repository.create({
    data: {
      userId: demoUser.id,
      name: 'Sample E-Commerce Platform',
      description: 'A legacy e-commerce platform built with Node.js and React',
      sourceType: 'ZIP',
      filePath: '/sample/ecommerce-platform',
      status: 'COMPLETED',
      metadata: {
        languages: ['JavaScript', 'TypeScript', 'CSS', 'HTML'],
        frameworks: ['React', 'Express', 'Redux'],
        fileCount: 247,
        totalLines: 15432,
        dependencies: {
          react: '^17.0.2',
          express: '^4.17.1',
          redux: '^4.1.0',
        },
        entryPoints: ['src/index.js', 'server/app.js'],
      },
      processedAt: new Date(),
    },
  });

  console.log('✅ Created sample repository:', sampleRepo.name);

  // Create sample architecture map
  await prisma.architectureMap.create({
    data: {
      repositoryId: sampleRepo.id,
      nodes: [
        {
          id: '1',
          type: 'module',
          label: 'Frontend (React)',
          data: { filePath: 'src/', language: 'JavaScript', linesOfCode: 8500 },
          position: { x: 100, y: 100 },
        },
        {
          id: '2',
          type: 'module',
          label: 'Backend (Express)',
          data: { filePath: 'server/', language: 'JavaScript', linesOfCode: 5200 },
          position: { x: 400, y: 100 },
        },
        {
          id: '3',
          type: 'database',
          label: 'PostgreSQL',
          data: { type: 'database' },
          position: { x: 400, y: 300 },
        },
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2', type: 'api-call', animated: true },
        { id: 'e2-3', source: '2', target: '3', type: 'database-query', animated: true },
      ],
      metadata: {
        totalNodes: 3,
        totalEdges: 2,
        layoutAlgorithm: 'force-directed',
      },
    },
  });

  console.log('✅ Created sample architecture map');

  // Create sample technical debt report
  await prisma.technicalDebtReport.create({
    data: {
      repositoryId: sampleRepo.id,
      overallScore: 72,
      complexityScore: 68,
      duplicationScore: 75,
      dependencyScore: 80,
      maintainabilityScore: 70,
      securityScore: 65,
      issues: [
        {
          severity: 'high',
          category: 'security',
          file: 'server/auth/jwt.js',
          line: 45,
          description: 'Hardcoded JWT secret detected',
          recommendation: 'Move JWT secret to environment variables',
          estimatedEffort: '30 minutes',
        },
        {
          severity: 'medium',
          category: 'complexity',
          file: 'src/components/ProductList.js',
          line: 120,
          description: 'High cyclomatic complexity (15)',
          recommendation: 'Break down into smaller functions',
          estimatedEffort: '2 hours',
        },
        {
          severity: 'medium',
          category: 'duplication',
          file: 'src/utils/validation.js',
          line: 78,
          description: 'Duplicated validation logic',
          recommendation: 'Extract to shared utility function',
          estimatedEffort: '1 hour',
        },
        {
          severity: 'low',
          category: 'maintainability',
          file: 'server/routes/products.js',
          line: 200,
          description: 'Long function (150 lines)',
          recommendation: 'Split into smaller, focused functions',
          estimatedEffort: '3 hours',
        },
      ],
      metrics: {
        totalFiles: 247,
        totalLines: 15432,
        averageComplexity: 8.5,
        duplicationPercentage: 12.3,
        testCoverage: 45.2,
        outdatedDependencies: 8,
      },
    },
  });

  console.log('✅ Created sample technical debt report');

  // Create sample chat conversation
  const conversation = await prisma.chatConversation.create({
    data: {
      repositoryId: sampleRepo.id,
      userId: demoUser.id,
      title: 'Understanding Authentication Flow',
    },
  });

  await prisma.chatMessage.createMany({
    data: [
      {
        conversationId: conversation.id,
        role: 'USER',
        content: 'How does authentication work in this application?',
      },
      {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: `Based on the repository analysis, authentication in this application works as follows:

1. **Entry Point**: The authentication flow starts in \`server/routes/auth.js\`

2. **Login Process**:
   - User submits credentials to POST /api/auth/login
   - \`server/controllers/auth.controller.js\` validates credentials
   - Password is verified using bcrypt in \`server/utils/hash.js\`
   - JWT token is generated in \`server/auth/jwt.js\`

3. **Token Management**:
   - Access token (15min expiry) stored in httpOnly cookie
   - Refresh token (7 days) stored in database
   - Tokens include user ID and role

4. **Protected Routes**:
   - \`server/middleware/auth.middleware.js\` validates JWT
   - Extracts user info and attaches to request object
   - Returns 401 if token invalid/expired

5. **Frontend Integration**:
   - \`src/services/auth.service.js\` handles API calls
   - \`src/store/authStore.js\` manages auth state
   - Axios interceptor refreshes tokens automatically

**Security Note**: The JWT secret is currently hardcoded (line 45 in jwt.js). This should be moved to environment variables.`,
        metadata: {
          referencedFiles: [
            'server/routes/auth.js',
            'server/controllers/auth.controller.js',
            'server/auth/jwt.js',
            'server/middleware/auth.middleware.js',
          ],
          tokens: 245,
        },
      },
    ],
  });

  console.log('✅ Created sample chat conversation');

  // Create sample documentation
  await prisma.generatedDocumentation.create({
    data: {
      repositoryId: sampleRepo.id,
      docType: 'README',
      title: 'E-Commerce Platform - README',
      format: 'MARKDOWN',
      content: `# E-Commerce Platform

## Overview
A full-stack e-commerce platform built with React and Node.js.

## Tech Stack
- **Frontend**: React 17, Redux, TailwindCSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Authentication**: JWT

## Getting Started

### Prerequisites
- Node.js 14+
- PostgreSQL 12+

### Installation
\`\`\`bash
npm install
npm run db:migrate
npm run dev
\`\`\`

## Architecture
- Frontend: \`src/\`
- Backend: \`server/\`
- Database: \`db/\`

## Key Features
- User authentication
- Product catalog
- Shopping cart
- Order management
- Payment processing

## API Endpoints
- POST /api/auth/login
- POST /api/auth/register
- GET /api/products
- POST /api/orders

## Contributing
See CONTRIBUTING.md for guidelines.`,
    },
  });

  console.log('✅ Created sample documentation');

  // Create sample onboarding path
  await prisma.onboardingPath.create({
    data: {
      repositoryId: sampleRepo.id,
      estimatedTime: '2-3 days',
      prerequisites: ['JavaScript', 'React basics', 'Node.js fundamentals'],
      phases: [
        {
          title: 'Foundation (Day 1)',
          duration: '4-6 hours',
          goals: [
            'Understand project structure',
            'Set up development environment',
            'Run the application locally',
          ],
          steps: [
            {
              order: 1,
              title: 'Review Project Structure',
              description: 'Familiarize yourself with the directory layout',
              files: ['package.json', 'README.md', 'src/', 'server/'],
              tasks: ['Identify tech stack', 'Locate entry points', 'Review dependencies'],
            },
            {
              order: 2,
              title: 'Setup Development Environment',
              description: 'Install dependencies and configure environment',
              files: ['.env.example', 'package.json'],
              tasks: ['Install Node.js dependencies', 'Configure database', 'Set environment variables'],
            },
            {
              order: 3,
              title: 'Run the Application',
              description: 'Start development servers',
              files: ['package.json'],
              tasks: ['Start backend server', 'Start frontend dev server', 'Verify application runs'],
            },
          ],
        },
        {
          title: 'Core Features (Day 2)',
          duration: '6-8 hours',
          goals: [
            'Understand authentication flow',
            'Learn product management',
            'Explore order processing',
          ],
          steps: [
            {
              order: 1,
              title: 'Authentication System',
              description: 'Learn how user authentication works',
              files: [
                'server/routes/auth.js',
                'server/controllers/auth.controller.js',
                'server/middleware/auth.middleware.js',
              ],
              tasks: ['Trace login flow', 'Understand JWT implementation', 'Review password hashing'],
            },
            {
              order: 2,
              title: 'Product Catalog',
              description: 'Understand product management',
              files: ['server/routes/products.js', 'src/components/ProductList.js'],
              tasks: ['Review product API', 'Explore frontend components', 'Test CRUD operations'],
            },
          ],
        },
        {
          title: 'Advanced Topics (Day 3)',
          duration: '4-6 hours',
          goals: [
            'Understand payment processing',
            'Learn deployment process',
            'Review testing strategy',
          ],
          steps: [
            {
              order: 1,
              title: 'Payment Integration',
              description: 'Learn how payments are processed',
              files: ['server/services/payment.service.js'],
              tasks: ['Review payment gateway integration', 'Understand order flow', 'Test payment scenarios'],
            },
          ],
        },
      ],
    },
  });

  console.log('✅ Created sample onboarding path');

  // Create sample analysis
  await prisma.analysis.create({
    data: {
      repositoryId: sampleRepo.id,
      analysisType: 'ARCHITECTURE',
      status: 'COMPLETED',
      result: {
        layers: ['Frontend', 'Backend', 'Database'],
        patterns: ['MVC', 'REST API', 'JWT Authentication'],
        technologies: ['React', 'Express', 'PostgreSQL'],
        entryPoints: ['src/index.js', 'server/app.js'],
        criticalModules: ['auth', 'products', 'orders'],
      },
      completedAt: new Date(),
    },
  });

  console.log('✅ Created sample analysis');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📝 Demo Credentials:');
  console.log('   Email: demo@ai-archaeologist.com');
  console.log('   Password: demo123456');
  console.log('\n👤 Admin Credentials:');
  console.log('   Email: admin@ai-archaeologist.com');
  console.log('   Password: demo123456');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

// Made with Bob
