import { PrismaClient, ChatConversation, ChatMessage, ChatMessageRole } from '@prisma/client';
import { BobOrchestrator } from './ai/bob-orchestrator';
import { 
  CreateConversationDto, 
  CreateMessageDto, 
  ChatResponse,
  ConversationWithMessages,
  ChatMessageMetadata,
  StreamChunk
} from '../types/chat.types';
import { BobAIStreamChunk } from '../types/ai.types';
import logger from '../config/logger';

export class ChatService {
  private prisma: PrismaClient;
  private bobOrchestrator: BobOrchestrator;

  constructor(prisma: PrismaClient, bobOrchestrator: BobOrchestrator) {
    this.prisma = prisma;
    this.bobOrchestrator = bobOrchestrator;
  }

  /**
   * Create a new chat conversation
   */
  async createConversation(
    userId: string,
    data: CreateConversationDto
  ): Promise<ChatConversation> {
    try {
      // Verify repository exists and user has access
      const repository = await this.prisma.repository.findFirst({
        where: {
          id: data.repositoryId,
          userId,
        },
      });

      if (!repository) {
        throw new Error('Repository not found or access denied');
      }

      // Create conversation
      const conversation = await this.prisma.chatConversation.create({
        data: {
          userId,
          repositoryId: data.repositoryId,
          title: data.title || 'New Conversation',
        },
      });

      logger.info('Chat conversation created', {
        conversationId: conversation.id,
        userId,
        repositoryId: data.repositoryId,
      });

      return conversation;
    } catch (error) {
      logger.error('Failed to create conversation', { error, userId, data });
      throw error;
    }
  }

  /**
   * Get conversation by ID with messages
   */
  async getConversation(
    conversationId: string,
    userId: string
  ): Promise<ConversationWithMessages> {
    try {
      const conversation = await this.prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          repository: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      return conversation as ConversationWithMessages;
    } catch (error) {
      logger.error('Failed to get conversation', { error, conversationId, userId });
      throw error;
    }
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<ConversationWithMessages[]> {
    try {
      const conversations = await this.prisma.chatConversation.findMany({
        where: {
          userId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
            take: 1, // Only get the first message for preview
          },
          repository: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return conversations as ConversationWithMessages[];
    } catch (error) {
      logger.error('Failed to get user conversations', { error, userId });
      throw error;
    }
  }

  /**
   * Get conversations for a specific repository
   */
  async getRepositoryConversations(
    repositoryId: string,
    userId: string
  ): Promise<ConversationWithMessages[]> {
    try {
      const conversations = await this.prisma.chatConversation.findMany({
        where: {
          repositoryId,
          userId,
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
            take: 1,
          },
          repository: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return conversations as ConversationWithMessages[];
    } catch (error) {
      logger.error('Failed to get repository conversations', { error, repositoryId, userId });
      throw error;
    }
  }

  /**
   * Send a message and get AI response (non-streaming)
   */
  async sendMessage(
    userId: string,
    data: CreateMessageDto
  ): Promise<{ userMessage: ChatMessage; aiMessage: ChatMessage }> {
    try {
      // Verify conversation exists and user has access
      const conversation = await this.prisma.chatConversation.findFirst({
        where: {
          id: data.conversationId,
          userId,
        },
        include: {
          repository: true,
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      // Save user message
      const userMessage = await this.prisma.chatMessage.create({
        data: {
          conversationId: data.conversationId,
          role: ChatMessageRole.USER,
          content: data.content,
          metadata: {},
        },
      });

      // Get repository root path
      const rootPath = conversation.repository.filePath || '';

      // Query IBM Bob AI
      const startTime = Date.now();
      const aiResponse = await this.bobOrchestrator.query(
        conversation.repositoryId,
        data.content,
        rootPath
      );
      const processingTime = Date.now() - startTime;

      // Prepare metadata
      const metadata: ChatMessageMetadata = {
        referencedFiles: aiResponse.referencedFiles || [],
        codeSnippets: aiResponse.codeSnippets || [],
        tokens: aiResponse.usage?.totalTokens,
        model: this.bobOrchestrator['config'].model,
        processingTime,
      };

      // Save AI response
      const aiMessage = await this.prisma.chatMessage.create({
        data: {
          conversationId: data.conversationId,
          role: ChatMessageRole.ASSISTANT,
          content: aiResponse.content,
          metadata: metadata as any,
        },
      });

      // Update conversation timestamp
      await this.prisma.chatConversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      });

      logger.info('Chat message processed', {
        conversationId: data.conversationId,
        userMessageId: userMessage.id,
        aiMessageId: aiMessage.id,
        processingTime,
      });

      return { userMessage, aiMessage };
    } catch (error) {
      logger.error('Failed to send message', { error, userId, data });
      throw error;
    }
  }

  /**
   * Send a message and stream AI response
   */
  async *sendMessageStream(
    userId: string,
    data: CreateMessageDto
  ): AsyncGenerator<StreamChunk> {
    try {
      // Verify conversation exists and user has access
      const conversation = await this.prisma.chatConversation.findFirst({
        where: {
          id: data.conversationId,
          userId,
        },
        include: {
          repository: true,
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      // Save user message
      const userMessage = await this.prisma.chatMessage.create({
        data: {
          conversationId: data.conversationId,
          role: ChatMessageRole.USER,
          content: data.content,
          metadata: {},
        },
      });

      // Yield user message confirmation
      yield {
        type: 'complete',
        content: JSON.stringify({ userMessageId: userMessage.id }),
        metadata: { phase: 'user_message_saved' },
      };

      // Get repository root path
      const rootPath = conversation.repository.filePath || '';

      // Stream from IBM Bob AI
      let fullResponse = '';
      const referencedFiles: string[] = [];
      const startTime = Date.now();

      const streamGenerator = this.bobOrchestrator.queryStream(
        conversation.repositoryId,
        data.content,
        rootPath
      );

      for await (const chunk of streamGenerator) {
        fullResponse += chunk.content;
        
        // Yield token to client
        yield {
          type: 'token',
          content: chunk.content,
          metadata: { chunkId: chunk.id },
        };
      }

      const processingTime = Date.now() - startTime;

      // Prepare metadata
      const metadata: ChatMessageMetadata = {
        referencedFiles,
        codeSnippets: [],
        model: this.bobOrchestrator['config'].model,
        processingTime,
      };

      // Save AI response
      const aiMessage = await this.prisma.chatMessage.create({
        data: {
          conversationId: data.conversationId,
          role: ChatMessageRole.ASSISTANT,
          content: fullResponse,
          metadata: metadata as any,
        },
      });

      // Update conversation timestamp
      await this.prisma.chatConversation.update({
        where: { id: data.conversationId },
        data: { updatedAt: new Date() },
      });

      // Yield completion
      yield {
        type: 'complete',
        content: JSON.stringify({
          aiMessageId: aiMessage.id,
          processingTime,
          metadata,
        }),
        metadata: { phase: 'complete' },
      };

      logger.info('Chat message streamed', {
        conversationId: data.conversationId,
        userMessageId: userMessage.id,
        aiMessageId: aiMessage.id,
        processingTime,
      });
    } catch (error) {
      logger.error('Failed to stream message', { error, userId, data });
      
      // Yield error
      yield {
        type: 'complete',
        content: JSON.stringify({ error: 'Failed to process message' }),
        metadata: { phase: 'error', error: (error as Error).message },
      };
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    try {
      // Verify ownership
      const conversation = await this.prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      // Delete conversation (messages will be cascade deleted)
      await this.prisma.chatConversation.delete({
        where: { id: conversationId },
      });

      logger.info('Chat conversation deleted', { conversationId, userId });
    } catch (error) {
      logger.error('Failed to delete conversation', { error, conversationId, userId });
      throw error;
    }
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(
    conversationId: string,
    userId: string,
    title: string
  ): Promise<ChatConversation> {
    try {
      // Verify ownership
      const conversation = await this.prisma.chatConversation.findFirst({
        where: {
          id: conversationId,
          userId,
        },
      });

      if (!conversation) {
        throw new Error('Conversation not found or access denied');
      }

      // Update title
      const updated = await this.prisma.chatConversation.update({
        where: { id: conversationId },
        data: { title },
      });

      logger.info('Conversation title updated', { conversationId, userId, title });

      return updated;
    } catch (error) {
      logger.error('Failed to update conversation title', { error, conversationId, userId });
      throw error;
    }
  }

  /**
   * Get conversation context for follow-up questions
   */
  async getConversationContext(conversationId: string, userId: string): Promise<string> {
    try {
      const conversation = await this.getConversation(conversationId, userId);
      
      // Build context from recent messages (last 10)
      const recentMessages = conversation.messages.slice(-10);
      
      const context = recentMessages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n\n');

      return context;
    } catch (error) {
      logger.error('Failed to get conversation context', { error, conversationId, userId });
      throw error;
    }
  }
}

// Made with Bob