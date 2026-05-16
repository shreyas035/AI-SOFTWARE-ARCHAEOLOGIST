import { PrismaClient } from '@prisma/client';
import axios, { AxiosInstance } from 'axios';
import { ContextBuilder, CodeContext } from './context-builder';
import { PromptGenerator, PromptType, GeneratedPrompt } from './prompt-generator';
import { BobAIRequest, BobAIResponse, BobAIStreamChunk } from '../../types/ai.types';
import logger from '../../config/logger';

export interface BobOrchestratorConfig {
  apiKey: string;
  apiUrl: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export class BobOrchestrator {
  private prisma: PrismaClient;
  private contextBuilder: ContextBuilder;
  private promptGenerator: PromptGenerator;
  private axiosInstance: AxiosInstance;
  private config: BobOrchestratorConfig;

  constructor(prisma: PrismaClient, config: BobOrchestratorConfig) {
    this.prisma = prisma;
    this.contextBuilder = new ContextBuilder(prisma);
    this.promptGenerator = new PromptGenerator();
    this.config = {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4000,
      ...config,
    };

    this.axiosInstance = axios.create({
      baseURL: this.config.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      timeout: 60000, // 60 seconds
    });
  }

  /**
   * Query IBM Bob AI with repository context
   */
  async query(
    repositoryId: string,
    query: string,
    rootPath: string,
    promptType?: PromptType
  ): Promise<BobAIResponse> {
    try {
      logger.info('Querying IBM Bob AI', { repositoryId, query });

      // Build context
      const context = await this.contextBuilder.buildContext(repositoryId, query, rootPath);

      // Detect prompt type if not provided
      const type = promptType || this.promptGenerator.detectPromptType(query);

      // Generate prompt
      const prompt = this.promptGenerator.generatePrompt(query, context, type);

      // Call IBM Bob API
      const response = await this.callBobAPI(prompt);

      logger.info('IBM Bob AI query completed', {
        repositoryId,
        tokensUsed: response.usage?.totalTokens,
      });

      return response;
    } catch (error) {
      logger.error('IBM Bob AI query failed', { error, repositoryId, query });
      throw error;
    }
  }

  /**
   * Stream response from IBM Bob AI
   */
  async *queryStream(
    repositoryId: string,
    query: string,
    rootPath: string,
    promptType?: PromptType
  ): AsyncGenerator<BobAIStreamChunk> {
    try {
      logger.info('Streaming from IBM Bob AI', { repositoryId, query });

      // Build context
      const context = await this.contextBuilder.buildContext(repositoryId, query, rootPath);

      // Detect prompt type if not provided
      const type = promptType || this.promptGenerator.detectPromptType(query);

      // Generate prompt
      const prompt = this.promptGenerator.generatePrompt(query, context, type);

      // Stream from IBM Bob API
      yield* this.streamBobAPI(prompt);

      logger.info('IBM Bob AI streaming completed', { repositoryId });
    } catch (error) {
      logger.error('IBM Bob AI streaming failed', { error, repositoryId, query });
      throw error;
    }
  }

  /**
   * Analyze repository architecture
   */
  async analyzeArchitecture(repositoryId: string, rootPath: string): Promise<BobAIResponse> {
    logger.info('Analyzing architecture with IBM Bob', { repositoryId });

    const context = await this.contextBuilder.buildContext(
      repositoryId,
      'architecture analysis',
      rootPath
    );

    const prompt = this.promptGenerator.generateArchitecturePrompt(context);
    return this.callBobAPI(prompt);
  }

  /**
   * Analyze technical debt
   */
  async analyzeTechnicalDebt(repositoryId: string, rootPath: string): Promise<BobAIResponse> {
    logger.info('Analyzing technical debt with IBM Bob', { repositoryId });

    const context = await this.contextBuilder.buildContext(
      repositoryId,
      'technical debt analysis',
      rootPath
    );

    const prompt = this.promptGenerator.generateTechnicalDebtPrompt(context);
    return this.callBobAPI(prompt);
  }

  /**
   * Generate documentation
   */
  async generateDocumentation(
    repositoryId: string,
    rootPath: string,
    docType: string
  ): Promise<BobAIResponse> {
    logger.info('Generating documentation with IBM Bob', { repositoryId, docType });

    const context = await this.contextBuilder.buildContext(
      repositoryId,
      `${docType} documentation`,
      rootPath
    );

    const prompt = this.promptGenerator.generateDocumentationPrompt(context, docType);
    return this.callBobAPI(prompt);
  }

  /**
   * Generate onboarding path
   */
  async generateOnboardingPath(repositoryId: string, rootPath: string): Promise<BobAIResponse> {
    logger.info('Generating onboarding path with IBM Bob', { repositoryId });

    const context = await this.contextBuilder.buildContext(
      repositoryId,
      'onboarding guide',
      rootPath
    );

    const prompt = this.promptGenerator.generateOnboardingPrompt(context);
    return this.callBobAPI(prompt);
  }

  /**
   * Generate executive summary
   */
  async analyzeExecutiveSummary(repositoryId: string, rootPath: string): Promise<BobAIResponse> {
    logger.info('Analyzing executive summary with IBM Bob', { repositoryId });

    const context = await this.contextBuilder.buildContext(
      repositoryId,
      'executive summary',
      rootPath
    );

    const prompt = this.promptGenerator.generateExecutiveSummaryPrompt(context);
    return this.callBobAPI(prompt);
  }

  /**
   * Call IBM Bob API
   */
  private async callBobAPI(prompt: GeneratedPrompt): Promise<BobAIResponse> {
    try {
      const request: BobAIRequest = {
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: prompt.systemPrompt,
          },
          {
            role: 'user',
            content: prompt.userPrompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      };

      const response = await this.axiosInstance.post('/chat/completions', request);

      return {
        id: response.data.id,
        content: response.data.choices[0].message.content,
        model: response.data.model,
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
        finishReason: response.data.choices[0].finish_reason,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('IBM Bob API error', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw new Error(`IBM Bob API error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Stream from IBM Bob API
   */
  private async *streamBobAPI(prompt: GeneratedPrompt): AsyncGenerator<BobAIStreamChunk> {
    try {
      const request: BobAIRequest = {
        model: this.config.model!,
        messages: [
          {
            role: 'system',
            content: prompt.systemPrompt,
          },
          {
            role: 'user',
            content: prompt.userPrompt,
          },
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: true,
      };

      const response = await this.axiosInstance.post('/chat/completions', request, {
        responseType: 'stream',
      });

      // Parse SSE stream
      let buffer = '';

      for await (const chunk of response.data) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            if (data === '[DONE]') {
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;

              if (content) {
                yield {
                  id: parsed.id,
                  content,
                  model: parsed.model,
                  finishReason: parsed.choices[0]?.finish_reason,
                };
              }
            } catch (error) {
              logger.warn('Failed to parse SSE chunk', { error, data });
            }
          }
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error('IBM Bob API streaming error', {
          status: error.response?.status,
          data: error.response?.data,
        });
        throw new Error(`IBM Bob API streaming error: ${error.response?.data?.error?.message || error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get conversation context for follow-up questions
   */
  async getConversationContext(
    conversationId: string,
    repositoryId: string,
    rootPath: string
  ): Promise<CodeContext> {
    // Get previous messages
    const messages = await this.prisma.chatMessage.findMany({
      where: {
        conversation: {
          id: conversationId,
          repositoryId,
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 10, // Last 10 messages for context
    });

    // Extract topics from conversation
    const conversationText = messages.map((m) => m.content).join(' ');

    // Build context based on conversation
    return this.contextBuilder.buildContext(repositoryId, conversationText, rootPath);
  }
}

// Made with Bob
