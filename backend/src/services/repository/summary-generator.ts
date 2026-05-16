import { RepositoryMetadata } from '../../types/repository.types';
import logger from '../../config/logger';

/**
 * Generates a human-readable summary of a repository from its metadata.
 * This works locally without any AI API calls — it reads the detected
 * languages, frameworks, dependencies, and file structure to build
 * a clear, simple explanation of what the code does.
 */
export class SummaryGenerator {
  /**
   * Generate a full narrative summary from repository metadata
   */
  generateSummary(name: string, metadata: RepositoryMetadata): string {
    try {
      const sections: string[] = [];

      // 1. What is this project?
      sections.push(this.generateProjectOverview(name, metadata));

      // 2. Tech stack breakdown
      sections.push(this.generateTechStackSummary(metadata));

      // 3. Project size & complexity
      sections.push(this.generateSizeSummary(metadata));

      // 4. Dependencies insight
      if (Object.keys(metadata.dependencies || {}).length > 0) {
        sections.push(this.generateDependencySummary(metadata));
      }

      // 5. Entry points
      if (metadata.entryPoints && metadata.entryPoints.length > 0) {
        sections.push(this.generateEntryPointSummary(metadata));
      }

      return sections.join('\n\n');
    } catch (error) {
      logger.error('Failed to generate local summary', { error });
      return `This is a code repository called "${name}" with ${metadata.fileCount || 0} files and ${metadata.totalLines || 0} lines of code.`;
    }
  }

  private generateProjectOverview(name: string, metadata: RepositoryMetadata): string {
    const primaryLang = metadata.languages?.[0] || 'Unknown';
    const frameworks = metadata.frameworks || [];
    const fileCount = metadata.fileCount || 0;

    // Detect project type from frameworks and languages
    const projectType = this.detectProjectType(metadata);

    let overview = `📋 **Project Overview**\n`;
    overview += `"${name}" is a ${projectType} written primarily in ${primaryLang}`;

    if (frameworks.length > 0) {
      overview += ` using ${this.formatList(frameworks)}`;
    }

    overview += `. It contains ${fileCount} files across ${metadata.languages?.length || 0} programming language${(metadata.languages?.length || 0) !== 1 ? 's' : ''}.`;

    return overview;
  }

  private generateTechStackSummary(metadata: RepositoryMetadata): string {
    let summary = `🛠️ **Tech Stack**\n`;
    const items: string[] = [];

    // Languages
    if (metadata.languageStats && metadata.languageStats.length > 0) {
      for (const stat of metadata.languageStats.slice(0, 5)) {
        items.push(`• ${stat.language}: ${stat.fileCount} files, ${stat.totalLines.toLocaleString()} lines (${stat.percentage.toFixed(1)}%)`);
      }
    } else if (metadata.languages && metadata.languages.length > 0) {
      for (const lang of metadata.languages) {
        items.push(`• ${lang}`);
      }
    }

    if (metadata.frameworks && metadata.frameworks.length > 0) {
      items.push(`• Frameworks: ${metadata.frameworks.join(', ')}`);
    }

    if (metadata.packageManager) {
      items.push(`• Package Manager: ${metadata.packageManager}`);
    }

    summary += items.join('\n');
    return summary;
  }

  private generateSizeSummary(metadata: RepositoryMetadata): string {
    const totalLines = metadata.totalLines || 0;
    const fileCount = metadata.fileCount || 0;

    let sizeLabel: string;
    let complexityNote: string;

    if (totalLines < 500) {
      sizeLabel = 'small';
      complexityNote = 'This is a lightweight project — easy to read through and understand quickly.';
    } else if (totalLines < 5000) {
      sizeLabel = 'medium-sized';
      complexityNote = 'This is a moderately-sized project. You can explore the main files to understand the core logic.';
    } else if (totalLines < 50000) {
      sizeLabel = 'large';
      complexityNote = 'This is a substantial codebase. Start with the entry points and work your way through the key modules.';
    } else {
      sizeLabel = 'very large';
      complexityNote = 'This is a massive codebase. Focus on the architecture first, then drill into specific modules.';
    }

    let summary = `📏 **Project Size: ${sizeLabel.charAt(0).toUpperCase() + sizeLabel.slice(1)}**\n`;
    summary += `• ${totalLines.toLocaleString()} total lines of code across ${fileCount} files\n`;

    if (fileCount > 0) {
      const avgLines = Math.round(totalLines / fileCount);
      summary += `• Average file length: ~${avgLines} lines\n`;
    }

    summary += `• ${complexityNote}`;
    return summary;
  }

  private generateDependencySummary(metadata: RepositoryMetadata): string {
    const deps = metadata.dependencies || {};
    const depCount = Object.keys(deps).length;
    const depNames = Object.keys(deps).slice(0, 8);

    let summary = `📦 **Dependencies (${depCount} packages)**\n`;
    summary += `Key packages: ${depNames.join(', ')}`;

    if (depCount > 8) {
      summary += ` and ${depCount - 8} more`;
    }

    summary += '.';

    // Identify notable dependencies
    const notable = this.identifyNotableDeps(deps);
    if (notable.length > 0) {
      summary += `\n• Notable: ${notable.join(', ')}`;
    }

    return summary;
  }

  private generateEntryPointSummary(metadata: RepositoryMetadata): string {
    const entryPoints = metadata.entryPoints || [];

    let summary = `🚪 **Entry Points**\n`;
    summary += `Start exploring the code from these files:\n`;
    for (const ep of entryPoints.slice(0, 5)) {
      summary += `• ${ep}\n`;
    }

    if (entryPoints.length > 5) {
      summary += `• ...and ${entryPoints.length - 5} more`;
    }

    return summary.trimEnd();
  }

  /**
   * Detect the type of project from metadata
   */
  private detectProjectType(metadata: RepositoryMetadata): string {
    const frameworks = (metadata.frameworks || []).map(f => f.toLowerCase());
    const languages = (metadata.languages || []).map(l => l.toLowerCase());
    const deps = Object.keys(metadata.dependencies || {}).map(d => d.toLowerCase());

    // Web frontend
    if (frameworks.some(f => ['react', 'vue.js', 'angular', 'svelte', 'next.js', 'nuxt.js'].includes(f))) {
      if (frameworks.some(f => ['next.js', 'nuxt.js', 'gatsby', 'remix'].includes(f))) {
        return 'full-stack web application';
      }
      return 'frontend web application';
    }

    // Web backend
    if (frameworks.some(f => ['express', 'nestjs', 'fastify', 'koa', 'django', 'flask', 'fastapi', 'spring boot'].includes(f))) {
      return 'backend API / web server';
    }

    // Mobile
    if (frameworks.some(f => ['react native'].includes(f)) || deps.includes('react-native')) {
      return 'mobile application';
    }

    // CLI / tool
    if (deps.some(d => ['commander', 'yargs', 'inquirer', 'chalk'].includes(d))) {
      return 'command-line tool';
    }

    // Python project types
    if (languages.includes('python')) {
      if (deps.some(d => ['tensorflow', 'torch', 'keras', 'scikit-learn', 'numpy', 'pandas'].includes(d))) {
        return 'machine learning / data science project';
      }
      return 'Python application';
    }

    // Java
    if (languages.includes('java')) return 'Java application';
    if (languages.includes('go')) return 'Go application';
    if (languages.includes('rust')) return 'Rust application';

    // Generic
    if (languages.length > 0) {
      return `${languages[0]} software project`;
    }

    return 'software project';
  }

  private identifyNotableDeps(deps: Record<string, string>): string[] {
    const notable: string[] = [];
    const depNames = Object.keys(deps).map(d => d.toLowerCase());

    const categories: Record<string, string[]> = {
      'Uses a database': ['prisma', 'sequelize', 'typeorm', 'mongoose', 'knex', 'pg', 'mysql2', 'mongodb'],
      'Has testing': ['jest', 'mocha', 'vitest', 'cypress', 'playwright', 'testing-library'],
      'Uses authentication': ['passport', 'jsonwebtoken', 'bcrypt', 'bcryptjs', 'next-auth'],
      'Has API docs': ['swagger', 'openapi', 'swagger-ui-express'],
      'Uses caching': ['redis', 'ioredis', 'node-cache'],
      'Has logging': ['winston', 'pino', 'morgan', 'bunyan'],
    };

    for (const [label, packages] of Object.entries(categories)) {
      if (depNames.some(d => packages.includes(d))) {
        notable.push(label);
      }
    }

    return notable;
  }

  private formatList(items: string[]): string {
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
  }
}

// Made with Bob
