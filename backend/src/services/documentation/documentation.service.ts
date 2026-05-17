import { PrismaClient } from '@prisma/client';
import { SummaryGenerator } from '../repository/summary-generator';
import { BobOrchestrator } from '../ai/bob-orchestrator';
import logger from '../../config/logger';

export enum DocumentationType {
  README = 'README',
  API_REFERENCE = 'API_REFERENCE',
  ARCHITECTURE = 'ARCHITECTURE',
  ONBOARDING = 'ONBOARDING'
}

export class DocumentationService {
  private prisma: PrismaClient;
  private summaryGenerator: SummaryGenerator;
  private aiOrchestrator: BobOrchestrator;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.summaryGenerator = new SummaryGenerator();
    this.aiOrchestrator = new BobOrchestrator(prisma, {
      apiKey: process.env.IBM_BOB_API_KEY || '',
      apiUrl: process.env.IBM_BOB_API_URL || '',
      model: process.env.IBM_BOB_MODEL,
    });
  }

  /**
   * Generate documentation for a repository
   */
  async generateDocs(repositoryId: string, type: DocumentationType): Promise<any> {
    try {
      logger.info('Generating documentation', { repositoryId, type });

      const repository = await this.prisma.repository.findUnique({
        where: { id: repositoryId },
      });

      if (!repository) throw new Error('Repository not found');

      // Use local summary generator for base context
      const metadata = repository.metadata as any;
      const baseSummary = await this.summaryGenerator.generateSummary(metadata);
      
      let content = '';
      let title = '';

      switch (type) {
        case DocumentationType.README:
          title = 'Project Overview (README)';
          content = this.generateReadmeContent(repository.name, baseSummary);
          break;
        case DocumentationType.API_REFERENCE:
          title = 'API Reference Guide';
          content = this.generateApiContent(repository.name, metadata);
          break;
        case DocumentationType.ARCHITECTURE:
          title = 'Architecture Deep-Dive';
          content = this.generateArchitectureContent(repository.name, metadata);
          break;
        case DocumentationType.ONBOARDING:
          title = 'New Developer Onboarding';
          content = this.generateOnboardingContent(repository.name, metadata);
          break;
      }

      // Save to database
      const doc = await this.prisma.generatedDocumentation.create({
        data: {
          repositoryId,
          docType: type as any,
          title,
          content,
          format: 'MARKDOWN'
        }
      });

      return doc;
    } catch (error) {
      logger.error('Failed to generate documentation', { error, repositoryId });
      throw error;
    }
  }

  private generateReadmeContent(name: string, summary: string): string {
    return `# ${name}\n\n${summary}\n\n## Getting Started\n\n1. Clone the repository\n2. Install dependencies\n3. Run the development server\n\n## Features\n\n- Auto-detected frameworks\n- Architecture mapping\n- AI-powered insights`;
  }

  private generateApiContent(name: string, metadata: any): string {
    return `# API Reference - ${name}\n\nThis document describes the API endpoints discovered in the codebase.\n\n## Endpoints\n\n${metadata.fileCount > 0 ? '- Scanned ' + metadata.fileCount + ' files for API definitions' : 'No API endpoints detected.'}`;
  }

  private generateArchitectureContent(name: string, metadata: any): string {
    return `# Architecture Guide - ${name}\n\n## Overview\n\nThis project uses a modern modular architecture.\n\n## Core Modules\n\n- **Frontend**: ${metadata.languages.join(', ')}\n- **Backend Services**: Node.js/Express\n\n## Data Flow\n\nThe system follows a unidirectional data flow pattern.`;
  }

  private generateOnboardingContent(name: string, metadata: any): string {
    return `# Onboarding Guide - ${name}\n\nWelcome to the team! Here is how to understand this legacy system.\n\n## Step 1: Core Concepts\n\nUnderstand the primary business logic located in the controllers directory.\n\n## Step 2: Running Locally\n\nEnsure you have the required environment variables set up.`;
  }
}

// Made with Bob
