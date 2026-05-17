import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { CreateConversationDto, CreateMessageDto } from '../types/chat.types';
import logger from '../config/logger';

export class ChatController {
  private chatService: ChatService;

  constructor(chatService: ChatService) {
    this.chatService = chatService;
  }

  /**
   * Create a new conversation
   * POST /api/v1/chat/conversations
   */
  createConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const data: CreateConversationDto = req.body;

      const conversation = await this.chatService.createConversation(userId, data);

      res.status(201).json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all conversations for the authenticated user
   * GET /api/v1/chat/conversations
   */
  getUserConversations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;

      const conversations = await this.chatService.getUserConversations(userId);

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get conversations for a specific repository
   * GET /api/v1/chat/repositories/:repositoryId/conversations
   */
  getRepositoryConversations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { repositoryId } = req.params;

      const conversations = await this.chatService.getRepositoryConversations(
        repositoryId,
        userId
      );

      res.json({
        success: true,
        data: conversations,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get a specific conversation with messages
   * GET /api/v1/chat/conversations/:conversationId
   */
  getConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;

      const conversation = await this.chatService.getConversation(conversationId, userId);

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send a message (non-streaming)
   * POST /api/v1/chat/messages
   */
  sendMessage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const data: CreateMessageDto = req.body;

      const result = await this.chatService.sendMessage(userId, data);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Send a message with streaming response
   * POST /api/v1/chat/messages/stream
   */
  sendMessageStream = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const data: CreateMessageDto = req.body;

      // Set headers for SSE (Server-Sent Events)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

      // Send initial connection message
      res.write('data: {"type":"connected"}\n\n');

      logger.info('Starting message stream', { userId, conversationId: data.conversationId });

      // Stream the response
      const streamGenerator = this.chatService.sendMessageStream(userId, data);

      for await (const chunk of streamGenerator) {
        // Send chunk as SSE
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        
        // Flush the response to ensure immediate delivery
        if (res.flush) {
          res.flush();
        }
      }

      // Close the connection
      res.write('data: {"type":"done"}\n\n');
      res.end();

    } catch (error) {
      logger.error('Message stream error', { error, userId: req.user?.id });
      
      // Send error as SSE
      res.write(`data: ${JSON.stringify({ type: 'error', content: 'Stream failed' })}\n\n`);
      res.end();
      
      next(error);
    }
  };

  /**
   * Update conversation title
   * PATCH /api/v1/chat/conversations/:conversationId
   */
  updateConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;
      const { title } = req.body;

      const conversation = await this.chatService.updateConversationTitle(
        conversationId,
        userId,
        title
      );

      res.json({
        success: true,
        data: conversation,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a conversation
   * DELETE /api/v1/chat/conversations/:conversationId
   */
  deleteConversation = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;

      await this.chatService.deleteConversation(conversationId, userId);

      res.json({
        success: true,
        message: 'Conversation deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get conversation context
   * GET /api/v1/chat/conversations/:conversationId/context
   */
  getConversationContext = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user!.id;
      const { conversationId } = req.params;

      const context = await this.chatService.getConversationContext(conversationId, userId);

      res.json({
        success: true,
        data: { context },
      });
    } catch (error) {
      next(error);
    }
  };
}

// Made with Bob