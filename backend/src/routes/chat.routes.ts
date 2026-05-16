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

export default router;

// Made with Bob