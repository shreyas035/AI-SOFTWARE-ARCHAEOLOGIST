import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';
import { chatLimiter } from '../middleware/rate-limit.middleware';
import { prisma } from '../config/database';
import { BobOrchestrator } from '../services/ai/bob-orchestrator';
import { ChatService } from '../services/chat.service';

const router = Router();

// Initialize services
const bobOrchestrator = new BobOrchestrator(prisma, {
  apiKey: process.env.IBM_BOB_API_KEY || '',
  apiUrl: process.env.IBM_BOB_API_URL || 'https://api.ibm.com/bob',
  model: process.env.IBM_BOB_MODEL || 'gpt-4',
  temperature: parseFloat(process.env.IBM_BOB_TEMPERATURE || '0.7'),
  maxTokens: parseInt(process.env.IBM_BOB_MAX_TOKENS || '4000'),
});

const chatService = new ChatService(prisma, bobOrchestrator);
const chatController = new ChatController(chatService);

// All routes require authentication
router.use(authenticate);

// Apply rate limiting to chat routes
router.use(chatLimiter);

// ============================================
// CONVERSATION ROUTES
// ============================================

/**
 * @route   POST /api/v1/chat/conversations
 * @desc    Create a new conversation
 * @access  Private
 */
router.post('/conversations', chatController.createConversation);

/**
 * @route   GET /api/v1/chat/conversations
 * @desc    Get all conversations for the authenticated user
 * @access  Private
 */
router.get('/conversations', chatController.getUserConversations);

/**
 * @route   GET /api/v1/chat/conversations/:conversationId
 * @desc    Get a specific conversation with messages
 * @access  Private
 */
router.get('/conversations/:conversationId', chatController.getConversation);

/**
 * @route   PATCH /api/v1/chat/conversations/:conversationId
 * @desc    Update conversation title
 * @access  Private
 */
router.patch('/conversations/:conversationId', chatController.updateConversation);

/**
 * @route   DELETE /api/v1/chat/conversations/:conversationId
 * @desc    Delete a conversation
 * @access  Private
 */
router.delete('/conversations/:conversationId', chatController.deleteConversation);

/**
 * @route   GET /api/v1/chat/conversations/:conversationId/context
 * @desc    Get conversation context for follow-up questions
 * @access  Private
 */
router.get('/conversations/:conversationId/context', chatController.getConversationContext);

// ============================================
// MESSAGE ROUTES
// ============================================

/**
 * @route   POST /api/v1/chat/messages
 * @desc    Send a message (non-streaming)
 * @access  Private
 */
router.post('/messages', chatController.sendMessage);

/**
 * @route   POST /api/v1/chat/messages/stream
 * @desc    Send a message with streaming response (SSE)
 * @access  Private
 */
router.post('/messages/stream', chatController.sendMessageStream);

// ============================================
// REPOSITORY-SPECIFIC ROUTES
// ============================================

/**
 * @route   GET /api/v1/chat/repositories/:repositoryId/conversations
 * @desc    Get all conversations for a specific repository
 * @access  Private
 */
router.get('/repositories/:repositoryId/conversations', chatController.getRepositoryConversations);

// ============================================
// SIMPLE QUERY ROUTE (used by frontend ChatPage)
// Auto-creates conversation if needed, provides fallback when Bob API is unavailable
// ============================================

/**
 * @route   POST /api/v1/chat/:repositoryId/query
 * @desc    Simple query endpoint - auto-creates conversation, returns AI response
 * @access  Private
 */
router.post('/:repositoryId/query', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { repositoryId } = req.params;
    const { query } = req.body;

    if (!query) {
      res.status(400).json({ success: false, message: 'Query is required' });
      return;
    }

    // Verify repository ownership
    const repository = await prisma.repository.findFirst({
      where: { id: repositoryId, userId },
    });

    if (!repository) {
      res.status(404).json({ success: false, message: 'Repository not found' });
      return;
    }

    const metadata = repository.metadata as any;

    // Try IBM Bob AI first
    try {
      // Find or create conversation
      let conversation = await prisma.chatConversation.findFirst({
        where: { repositoryId, userId },
        orderBy: { updatedAt: 'desc' },
      });

      if (!conversation) {
        conversation = await prisma.chatConversation.create({
          data: { userId, repositoryId, title: query.slice(0, 50) },
        });
      }

      // Save user message
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'USER',
          content: query,
        },
      });

      // Try Bob AI
      const rootPath = repository.filePath || '';
      const aiResponse = await bobOrchestrator.query(repositoryId, query, rootPath);

      // Save AI message
      await prisma.chatMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'ASSISTANT',
          content: aiResponse.content,
        },
      });

      res.json({
        success: true,
        data: { content: aiResponse.content, conversationId: conversation.id },
      });
      return;
    } catch (aiError: any) {
      // Fallback: generate intelligent local response from metadata
      const localResponse = generateLocalResponse(query, repository.name, metadata);

      res.json({
        success: true,
        data: { content: localResponse, source: 'local-analysis' },
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/v1/chat/:repositoryId/messages
 * @desc    Get chat history for a repository
 * @access  Private
 */
router.get('/:repositoryId/messages', async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { repositoryId } = req.params;

    const conversation = await prisma.chatConversation.findFirst({
      where: { repositoryId, userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } }
      }
    });

    res.json({
      success: true,
      data: conversation?.messages || [],
    });
  } catch (error) {
    next(error);
  }
});

function generateLocalResponse(query: string, repoName: string, metadata: any): string {
  const q = query.toLowerCase();
  const languages = metadata?.languages || [];
  const fileCount = metadata?.fileCount || 0;
  const totalLines = metadata?.totalLines || 0;
  const deps = metadata?.dependencies || {};
  const depNames = Object.keys(deps);
  const entryPoints = metadata?.entryPoints || [];
  const frameworks = metadata?.frameworks || [];

  if (q.includes('structure') || q.includes('organized') || q.includes('architecture')) {
    return `## 📁 Project Structure — "${repoName}"

This repository contains **${fileCount} files** with **${totalLines.toLocaleString()} lines of code**.

**Languages detected:** ${languages.join(', ') || 'Unknown'}
${frameworks.length > 0 ? `**Frameworks:** ${frameworks.join(', ')}` : ''}

**Entry points to start exploring:**
${entryPoints.map((ep: string) => `- \`${ep}\``).join('\n') || '- No clear entry points detected'}

${depNames.length > 0 ? `**Key dependencies:** ${depNames.slice(0, 10).join(', ')}${depNames.length > 10 ? ` (+${depNames.length - 10} more)` : ''}` : ''}

> 💡 Start by reading the entry point files to understand the main application flow.`;
  }

  if (q.includes('entry') || q.includes('start') || q.includes('main')) {
    return `## 🚀 Entry Points — "${repoName}"

The following files are the main entry points for this project:

${entryPoints.map((ep: string, i: number) => `**Step ${i + 1}:** \`${ep}\` — Start reading here`).join('\n') || 'No entry points detected.'}

> 💡 These files are where execution begins. Trace the imports from here to understand the full application flow.`;
  }

  if (q.includes('tech') || q.includes('language') || q.includes('stack')) {
    return `## 🛠 Technology Stack — "${repoName}"

| Category | Details |
|----------|---------|
| Languages | ${languages.join(', ') || 'Unknown'} |
| Total Files | ${fileCount} |
| Total Lines | ${totalLines.toLocaleString()} |
| Dependencies | ${depNames.length} packages |
${frameworks.length > 0 ? `| Frameworks | ${frameworks.join(', ')} |` : ''}

${depNames.length > 0 ? `**Top dependencies:** ${depNames.slice(0, 15).map(d => `\`${d}\``).join(', ')}` : ''}`;
  }

  if (q.includes('risk') || q.includes('danger') || q.includes('problem') || q.includes('debt')) {
    const avgLines = fileCount > 0 ? Math.round(totalLines / fileCount) : 0;
    const risks: string[] = [];
    if (avgLines > 300) risks.push(`⚠️ Average file size is ${avgLines} lines — consider splitting large files`);
    if (depNames.length > 30) risks.push(`⚠️ ${depNames.length} dependencies — heavy dependency tree increases security surface`);
    if (languages.length > 4) risks.push(`⚠️ ${languages.length} languages detected — polyglot projects are harder to maintain`);
    if (risks.length === 0) risks.push('✅ No major risks detected in the metadata analysis');

    return `## 🛡 Risk Assessment — "${repoName}"

${risks.join('\n')}

**Recommendations:**
- Review any files over 300 lines for refactoring opportunities
- Run \`npm audit\` to check for known vulnerabilities in dependencies
- Ensure all entry points have proper error handling`;
  }

  if (q.includes('auth') || q.includes('login') || q.includes('security')) {
    return `## 🔐 Authentication Analysis — "${repoName}"

Based on the repository metadata, I can provide the following insights:

${depNames.some(d => d.includes('jwt') || d.includes('passport') || d.includes('auth'))
  ? `**Auth-related dependencies found:** ${depNames.filter(d => d.includes('jwt') || d.includes('passport') || d.includes('auth') || d.includes('bcrypt')).map(d => `\`${d}\``).join(', ')}`
  : 'No specific authentication libraries detected in dependencies.'}

> 💡 Search for files containing "auth", "login", or "session" to find authentication logic.`;
  }

  // Default response
  return `## 🏺 Analysis — "${repoName}"

I analyzed this repository based on its metadata:

- **${fileCount} files** across **${languages.length} language(s)**: ${languages.join(', ') || 'Unknown'}
- **${totalLines.toLocaleString()} total lines** of code
- **${depNames.length} dependencies** tracked
${frameworks.length > 0 ? `- **Frameworks:** ${frameworks.join(', ')}` : ''}

${entryPoints.length > 0 ? `**Key files to explore:**\n${entryPoints.map((ep: string) => `- \`${ep}\``).join('\n')}` : ''}

> 💡 For deeper analysis, try asking about specific topics like "structure", "risks", "tech stack", or "authentication".`;
}

export default router;

// Made with Bob