import { ChatConversation, ChatMessage, ChatMessageRole } from '@prisma/client';

// ============================================
// CHAT TYPES
// ============================================

export interface ChatMessageMetadata {
  referencedFiles?: string[];
  codeSnippets?: CodeSnippet[];
  tokens?: number;
  model?: string;
  temperature?: number;
  processingTime?: number;
}

export interface CodeSnippet {
  file: string;
  language: string;
  startLine: number;
  endLine: number;
  code: string;
}

export interface CreateConversationDto {
  repositoryId: string;
  title?: string;
}

export interface CreateMessageDto {
  conversationId: string;
  content: string;
}

export interface ChatResponse {
  message: string;
  referencedFiles: string[];
  codeSnippets: CodeSnippet[];
  suggestions?: string[];
}

export interface StreamChunk {
  type: 'token' | 'file' | 'code' | 'complete';
  content: string;
  metadata?: Record<string, unknown>;
}

export type ConversationWithMessages = ChatConversation & {
  messages: ChatMessage[];
  repository: {
    id: string;
    name: string;
  };
};

export type MessageWithMetadata = ChatMessage & {
  metadata: ChatMessageMetadata;
};

// Made with Bob
