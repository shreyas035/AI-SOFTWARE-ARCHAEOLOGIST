import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../../config/logger';

interface ExportOptions {
  format: 'json' | 'markdown' | 'html';
  includeAnalysis?: boolean;
  includeArchitecture?: boolean;
  includeTechnicalDebt?: boolean;
  includeChat?: boolean;
}

interface ReportData {
  repository: any;
  analysis?: any;
  architecture?: any;
  technicalDebt?: any;
  chatHistory?: any;
  generatedAt: string;
}

export class ExportService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Export repository data and analysis results
   */
  async exportRepository(
    repositoryId: string,
    userId: string,
    options: ExportOptions
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    try {
      // Gather all requested data
      const reportData = await this.gatherReportData(repositoryId, userId, options);

      // Generate export based on format
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (options.format) {
        case 'json':
          content = this.generateJSON(reportData);
          filename = `${reportData.repository.name}-report.json`;
          mimeType = 'application/json';
          break;
        case 'markdown':
          content = this.generateMarkdown(reportData);
          filename = `${reportData.repository.name}-report.md`;
          mimeType = 'text/markdown';
          break;
        case 'html':
          content = this.generateHTML(reportData);
          filename = `${reportData.repository.name}-report.html`;
          mimeType = 'text/html';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      logger.info('Repository export completed', {
        repositoryId,
        userId,
        format: options.format,
      });

      return { content, filename, mimeType };
    } catch (error) {
      logger.error('Repository export failed', { error, repositoryId });
      throw error;
    }
  }

  /**
   * Generate executive summary report
   */
  async generateExecutiveSummary(
    repositoryId: string,
    userId: string
  ): Promise<string> {
    try {
      const reportData = await this.gatherReportData(repositoryId, userId, {
        format: 'markdown',
        includeAnalysis: true,
        includeArchitecture: true,
        includeTechnicalDebt: true,
      });

      const summary = this.createExecutiveSummary(reportData);

      logger.info('Executive summary generated', { repositoryId, userId });

      return summary;
    } catch (error) {
      logger.error('Executive summary generation failed', { error, repositoryId });
      throw error;
    }
  }

  /**
   * Create shareable link for repository analysis
   */
  async createShareableLink(
    repositoryId: string,
    userId: string,
    expiresIn: number = 7 * 24 * 60 * 60 * 1000 // 7 days
  ): Promise<{ shareId: string; expiresAt: Date }> {
    try {
      // Generate unique share ID
      const shareId = this.generateShareId();
      const expiresAt = new Date(Date.now() + expiresIn);

      // Store share metadata in database (you'd need to add a Share model)
      // For now, we'll return the generated data
      
      logger.info('Shareable link created', { repositoryId, userId, shareId });

      return { shareId, expiresAt };
    } catch (error) {
      logger.error('Shareable link creation failed', { error, repositoryId });
      throw error;
    }
  }

  /**
   * Export comparison report
   */
  async exportComparison(
    comparisonData: any,
    format: 'json' | 'markdown' | 'html'
  ): Promise<{ content: string; filename: string; mimeType: string }> {
    try {
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case 'json':
          content = JSON.stringify(comparisonData, null, 2);
          filename = 'repository-comparison.json';
          mimeType = 'application/json';
          break;
        case 'markdown':
          content = this.generateComparisonMarkdown(comparisonData);
          filename = 'repository-comparison.md';
          mimeType = 'text/markdown';
          break;
        case 'html':
          content = this.generateComparisonHTML(comparisonData);
          filename = 'repository-comparison.html';
          mimeType = 'text/html';
          break;
        default:
          throw new Error('Unsupported export format');
      }

      return { content, filename, mimeType };
    } catch (error) {
      logger.error('Comparison export failed', { error });
      throw error;
    }
  }

  // ============================================
  // DATA GATHERING
  // ============================================

  private async gatherReportData(
    repositoryId: string,
    userId: string,
    options: ExportOptions
  ): Promise<ReportData> {
    const repository = await this.prisma.repository.findFirst({
      where: { id: repositoryId, userId },
    });

    if (!repository) {
      throw new Error('Repository not found');
    }

    const reportData: ReportData = {
      repository,
      generatedAt: new Date().toISOString(),
    };

    if (options.includeAnalysis) {
      reportData.analysis = await this.prisma.analysis.findMany({
        where: { repositoryId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    }

    if (options.includeArchitecture) {
      reportData.architecture = await this.prisma.architectureMap.findFirst({
        where: { repositoryId },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (options.includeTechnicalDebt) {
      reportData.technicalDebt = await this.prisma.technicalDebtReport.findFirst({
        where: { repositoryId },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (options.includeChat) {
      reportData.chatHistory = await this.prisma.chatConversation.findMany({
        where: { repositoryId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      });
    }

    return reportData;
  }

  // ============================================
  // FORMAT GENERATORS
  // ============================================

  private generateJSON(data: ReportData): string {
    return JSON.stringify(data, null, 2);
  }

  private generateMarkdown(data: ReportData): string {
    const { repository, analysis, architecture, technicalDebt, generatedAt } = data;
    const metadata = repository.metadata as any;

    let markdown = `# Repository Analysis Report: ${repository.name}\n\n`;
    markdown += `**Generated:** ${new Date(generatedAt).toLocaleString()}\n\n`;
    markdown += `---\n\n`;

    // Overview
    markdown += `## 📊 Overview\n\n`;
    markdown += `- **Source Type:** ${repository.sourceType}\n`;
    markdown += `- **Status:** ${repository.status}\n`;
    markdown += `- **Created:** ${new Date(repository.createdAt).toLocaleDateString()}\n`;
    if (repository.sourceUrl) {
      markdown += `- **Source URL:** ${repository.sourceUrl}\n`;
    }
    markdown += `\n`;

    // Tech Stack
    if (metadata?.languages) {
      markdown += `## 💻 Tech Stack\n\n`;
      markdown += `### Languages\n\n`;
      Object.entries(metadata.languages).forEach(([lang, percentage]: [string, any]) => {
        markdown += `- **${lang}:** ${percentage}%\n`;
      });
      markdown += `\n`;
    }

    if (metadata?.frameworks && metadata.frameworks.length > 0) {
      markdown += `### Frameworks\n\n`;
      metadata.frameworks.forEach((framework: string) => {
        markdown += `- ${framework}\n`;
      });
      markdown += `\n`;
    }

    // Metrics
    markdown += `## 📈 Metrics\n\n`;
    markdown += `- **Total Files:** ${metadata?.fileCount || 0}\n`;
    markdown += `- **Total Lines:** ${metadata?.totalLines || 0}\n`;
    markdown += `- **Entry Points:** ${(metadata?.entryPoints || []).length}\n`;
    markdown += `\n`;

    // Technical Debt
    if (technicalDebt) {
      markdown += `## ⚠️ Technical Debt Analysis\n\n`;
      markdown += `- **Overall Score:** ${technicalDebt.overallScore}/100\n`;
      
      const issues = technicalDebt.issues as any;
      if (issues && Array.isArray(issues)) {
        const criticalCount = issues.filter((i: any) => i.severity === 'critical').length;
        const highCount = issues.filter((i: any) => i.severity === 'high').length;
        const mediumCount = issues.filter((i: any) => i.severity === 'medium').length;
        
        markdown += `- **Critical Issues:** ${criticalCount}\n`;
        markdown += `- **High Priority Issues:** ${highCount}\n`;
        markdown += `- **Medium Priority Issues:** ${mediumCount}\n`;
      }
      markdown += `\n`;
    }

    // Architecture
    if (architecture) {
      markdown += `## 🏗️ Architecture\n\n`;
      const nodes = architecture.nodes as any;
      const edges = architecture.edges as any;
      markdown += `- **Modules:** ${Array.isArray(nodes) ? nodes.length : 0}\n`;
      markdown += `- **Dependencies:** ${Array.isArray(edges) ? edges.length : 0}\n`;
      markdown += `\n`;
    }

    // Dependencies
    if (metadata?.dependencies) {
      markdown += `## 📦 Dependencies\n\n`;
      Object.entries(metadata.dependencies).forEach(([type, deps]: [string, any]) => {
        if (deps && Object.keys(deps).length > 0) {
          markdown += `### ${type}\n\n`;
          Object.entries(deps).forEach(([name, version]: [string, any]) => {
            markdown += `- ${name}: ${version}\n`;
          });
          markdown += `\n`;
        }
      });
    }

    markdown += `---\n\n`;
    markdown += `*Report generated by AI Software Archaeologist*\n`;

    return markdown;
  }

  private generateHTML(data: ReportData): string {
    const markdownContent = this.generateMarkdown(data);
    
    // Convert markdown to HTML (basic conversion)
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Repository Analysis Report - ${data.repository.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; border-bottom: 2px solid #ecf0f1; padding-bottom: 8px; }
        h3 { color: #7f8c8d; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
        ul { padding-left: 20px; }
        li { margin: 5px 0; }
        .metadata { background: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ecf0f1; text-align: center; color: #7f8c8d; }
    </style>
</head>
<body>
    ${this.markdownToHTML(markdownContent)}
</body>
</html>`;

    return html;
  }

  private generateComparisonMarkdown(comparisonData: any): string {
    let markdown = `# Repository Comparison Report\n\n`;
    markdown += `**Generated:** ${new Date().toLocaleString()}\n\n`;
    markdown += `---\n\n`;

    // Repositories being compared
    markdown += `## 📚 Repositories\n\n`;
    comparisonData.repositories.forEach((repo: any, index: number) => {
      markdown += `${index + 1}. **${repo.name}** (${repo.sourceType})\n`;
    });
    markdown += `\n`;

    // Tech Stack Comparison
    if (comparisonData.comparison?.techStack) {
      const ts = comparisonData.comparison.techStack;
      markdown += `## 💻 Tech Stack Comparison\n\n`;
      markdown += `### Common Languages\n`;
      ts.languages.common.forEach((lang: string) => {
        markdown += `- ${lang}\n`;
      });
      markdown += `\n`;

      markdown += `### Common Frameworks\n`;
      ts.frameworks.common.forEach((fw: string) => {
        markdown += `- ${fw}\n`;
      });
      markdown += `\n`;
    }

    // Recommendations
    if (comparisonData.recommendations && comparisonData.recommendations.length > 0) {
      markdown += `## 💡 Recommendations\n\n`;
      comparisonData.recommendations.forEach((rec: string) => {
        markdown += `- ${rec}\n`;
      });
      markdown += `\n`;
    }

    markdown += `---\n\n`;
    markdown += `*Report generated by AI Software Archaeologist*\n`;

    return markdown;
  }

  private generateComparisonHTML(comparisonData: any): string {
    const markdownContent = this.generateComparisonMarkdown(comparisonData);
    return this.generateHTML({ ...comparisonData, repository: { name: 'Comparison' }, generatedAt: new Date().toISOString() });
  }

  private createExecutiveSummary(data: ReportData): string {
    const { repository, technicalDebt } = data;
    const metadata = repository.metadata as any;

    let summary = `# Executive Summary: ${repository.name}\n\n`;
    
    // Key Metrics
    summary += `## Key Metrics\n\n`;
    summary += `- **Codebase Size:** ${metadata?.totalLines || 0} lines across ${metadata?.fileCount || 0} files\n`;
    summary += `- **Primary Language:** ${this.getPrimaryLanguage(metadata?.languages)}\n`;
    summary += `- **Technical Debt Score:** ${technicalDebt?.overallScore || 'N/A'}/100\n\n`;

    // Health Assessment
    const score = technicalDebt?.overallScore || 0;
    let health = 'Unknown';
    if (score >= 80) health = 'Excellent';
    else if (score >= 60) health = 'Good';
    else if (score >= 40) health = 'Fair';
    else health = 'Needs Attention';

    summary += `## Health Assessment: ${health}\n\n`;

    // Top Priorities
    summary += `## Top Priorities\n\n`;
    if (technicalDebt?.issues) {
      const issues = technicalDebt.issues as any[];
      const criticalIssues = issues.filter((i: any) => i.severity === 'critical').slice(0, 3);
      
      if (criticalIssues.length > 0) {
        criticalIssues.forEach((issue: any, index: number) => {
          summary += `${index + 1}. ${issue.description || issue.category}\n`;
        });
      } else {
        summary += `No critical issues detected.\n`;
      }
    }

    return summary;
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getPrimaryLanguage(languages: Record<string, number> | undefined): string {
    if (!languages) return 'Unknown';
    
    const entries = Object.entries(languages);
    if (entries.length === 0) return 'Unknown';
    
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  private generateShareId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private markdownToHTML(markdown: string): string {
    // Basic markdown to HTML conversion
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$2</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li>$1</li>')
      .replace(/\n/gim, '<br>');
  }
}

// Made with Bob