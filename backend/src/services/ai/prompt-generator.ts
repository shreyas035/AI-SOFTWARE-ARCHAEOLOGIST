import { CodeContext } from './context-builder';
import logger from '../../config/logger';

export type PromptType =
  | 'code-explanation'
  | 'architecture-analysis'
  | 'technical-debt'
  | 'documentation'
  | 'onboarding'
  | 'executive-summary'
  | 'general-query';

export interface GeneratedPrompt {
  systemPrompt: string;
  userPrompt: string;
  context: CodeContext;
  type: PromptType;
}

export class PromptGenerator {
  /**
   * Generate prompt for IBM Bob AI
   */
  generatePrompt(
    query: string,
    context: CodeContext,
    type: PromptType = 'general-query'
  ): GeneratedPrompt {
    logger.info('Generating prompt', { type, query });

    const systemPrompt = this.buildSystemPrompt(type, context);
    const userPrompt = this.buildUserPrompt(query, context, type);

    return {
      systemPrompt,
      userPrompt,
      context,
      type,
    };
  }

  /**
   * Build system prompt based on type
   */
  private buildSystemPrompt(type: PromptType, context: CodeContext): string {
    const basePrompt = `You are an expert software archaeologist analyzing a legacy codebase. You have deep knowledge of software architecture, design patterns, and best practices across multiple programming languages and frameworks.

Repository: ${context.repositoryName}
Languages: ${context.metadata.languages.join(', ')}
Frameworks: ${context.metadata.frameworks.join(', ')}
Total Files: ${context.metadata.totalFiles}
Total Lines: ${context.metadata.totalLines}`;

    const typeSpecificPrompts: Record<PromptType, string> = {
      'code-explanation': `
Your task is to explain how the code works in clear, understandable terms. Focus on:
- The purpose and functionality of the code
- How different components interact
- The flow of data and control
- Key design decisions and patterns
- Potential gotchas or important details`,

      'architecture-analysis': `
Your task is to analyze the system architecture. Focus on:
- High-level system design and structure
- Component relationships and dependencies
- Data flow and communication patterns
- Architectural patterns used (MVC, microservices, etc.)
- Strengths and potential improvements`,

      'technical-debt': `
Your task is to identify technical debt and code quality issues. Focus on:
- Code complexity and maintainability concerns
- Potential bugs or error-prone patterns
- Security vulnerabilities
- Performance bottlenecks
- Outdated dependencies or practices
- Recommendations for improvement`,

      documentation: `
Your task is to generate comprehensive documentation. Focus on:
- Clear, concise explanations
- Code examples where relevant
- Setup and usage instructions
- API documentation
- Architecture diagrams (in Mermaid syntax)
- Best practices and conventions`,

      onboarding: `
Your task is to create an onboarding guide for new developers. Focus on:
- Where to start exploring the codebase
- Key files and their purposes
- Important concepts and patterns
- Common workflows and tasks
- Learning path recommendations
- Tips for understanding the system`,

      'executive-summary': `
Your task is to provide a high-level "Executive Summary" of the codebase. 
Imagine you are explaining the project to a new lead developer. Focus on:
- The core purpose and business value of the system
- The primary tech stack and why it was chosen
- The high-level architecture (e.g., Modular Monolith, Microservices, Event-driven)
- How data flows through the system at a high level
- Any unique or standout features of the implementation
Keep the tone professional, insightful, and concise (2-3 paragraphs).`,

      'general-query': `
Your task is to answer the developer's question accurately and helpfully. Focus on:
- Directly addressing their question
- Providing relevant code examples
- Explaining context and relationships
- Offering additional insights when helpful
- Being clear and concise`,
    };

    return `${basePrompt}\n\n${typeSpecificPrompts[type]}`;
  }

  /**
   * Build user prompt with context
   */
  private buildUserPrompt(query: string, context: CodeContext, type: PromptType): string {
    let prompt = `# Repository Structure\n\n\`\`\`\n${context.fileTree}\n\`\`\`\n\n`;

    if (context.relevantFiles.length > 0) {
      prompt += `# Relevant Files\n\n`;

      for (const file of context.relevantFiles) {
        prompt += `## ${file.path} (${file.language}, ${file.lineCount} lines)\n\n`;
        prompt += `\`\`\`${this.getLanguageIdentifier(file.language)}\n${file.content}\n\`\`\`\n\n`;
      }
    }

    prompt += `# Question\n\n${query}\n\n`;

    // Add type-specific instructions
    const typeInstructions: Record<PromptType, string> = {
      'code-explanation': 'Please explain how this code works, including the flow of execution and key components.',
      'architecture-analysis': 'Please analyze the architecture of this system, including its structure, patterns, and design decisions.',
      'technical-debt': 'Please identify technical debt, code quality issues, and provide recommendations for improvement.',
      documentation: 'Please generate comprehensive documentation for this code, including usage examples and explanations.',
      onboarding: 'Please create an onboarding guide to help new developers understand and navigate this codebase.',
      'general-query': 'Please answer this question based on the codebase provided.',
    };

    prompt += `${typeInstructions[type]}`;

    return prompt;
  }

  /**
   * Get language identifier for code blocks
   */
  private getLanguageIdentifier(language: string): string {
    const identifiers: Record<string, string> = {
      JavaScript: 'javascript',
      TypeScript: 'typescript',
      Python: 'python',
      Java: 'java',
      Go: 'go',
      Rust: 'rust',
      Ruby: 'ruby',
      PHP: 'php',
      'C#': 'csharp',
      'C++': 'cpp',
      C: 'c',
      Swift: 'swift',
      Kotlin: 'kotlin',
    };

    return identifiers[language] || language.toLowerCase();
  }

  /**
   * Generate architecture analysis prompt
   */
  generateArchitecturePrompt(context: CodeContext): GeneratedPrompt {
    const query = 'Analyze the architecture of this system and create a comprehensive overview.';
    return this.generatePrompt(query, context, 'architecture-analysis');
  }

  /**
   * Generate technical debt analysis prompt
   */
  generateTechnicalDebtPrompt(context: CodeContext): GeneratedPrompt {
    const query = 'Analyze this codebase for technical debt, code quality issues, and provide improvement recommendations.';
    return this.generatePrompt(query, context, 'technical-debt');
  }

  /**
   * Generate documentation prompt
   */
  generateDocumentationPrompt(context: CodeContext, docType: string): GeneratedPrompt {
    const queries: Record<string, string> = {
      readme: 'Generate a comprehensive README.md file for this project.',
      api: 'Generate API documentation for this project.',
      architecture: 'Generate architecture documentation with diagrams.',
      onboarding: 'Generate an onboarding guide for new developers.',
    };

    const query = queries[docType] || queries.readme;
    return this.generatePrompt(query, context, 'documentation');
  }

  /**
   * Generate onboarding path prompt
   */
  generateOnboardingPrompt(context: CodeContext): GeneratedPrompt {
    const query = `Create a structured onboarding path for new developers joining this project. Include:
1. Day 1 tasks (understanding the basics)
2. Week 1 goals (core features and patterns)
3. Month 1 objectives (becoming productive)
4. Key files to study in order
5. Common workflows and tasks`;

    return this.generatePrompt(query, context, 'onboarding');
  }

  /**
   * Generate executive summary prompt
   */
  generateExecutiveSummaryPrompt(context: CodeContext): GeneratedPrompt {
    const query = 'Provide a high-level executive summary of this repository. Explain what the code is doing, its primary purpose, and its architecture.';
    return this.generatePrompt(query, context, 'executive-summary');
  }

  /**
   * Detect prompt type from query
   */
  detectPromptType(query: string): PromptType {
    const queryLower = query.toLowerCase();

    if (
      queryLower.includes('architecture') ||
      queryLower.includes('structure') ||
      queryLower.includes('design')
    ) {
      return 'architecture-analysis';
    }

    if (
      queryLower.includes('technical debt') ||
      queryLower.includes('code quality') ||
      queryLower.includes('improve')
    ) {
      return 'technical-debt';
    }

    if (
      queryLower.includes('document') ||
      queryLower.includes('readme') ||
      queryLower.includes('api doc')
    ) {
      return 'documentation';
    }

    if (
      queryLower.includes('onboard') ||
      queryLower.includes('getting started') ||
      queryLower.includes('learn')
    ) {
      return 'onboarding';
    }

    if (
      queryLower.includes('how does') ||
      queryLower.includes('explain') ||
      queryLower.includes('what is')
    ) {
      return 'code-explanation';
    }

    return 'general-query';
  }
}

// Made with Bob
