import path from 'path';
import fs from 'fs-extra';
import { FileTreeNode } from '../../types/repository.types';
import logger from '../../config/logger';

export class FileTreeBuilder {
  private readonly ignoredDirs = new Set([
    'node_modules',
    '.git',
    '.svn',
    '.hg',
    'dist',
    'build',
    'out',
    'target',
    '.next',
    '.nuxt',
    'coverage',
    '.cache',
    'vendor',
    '__pycache__',
    '.pytest_cache',
    '.venv',
    'venv',
  ]);

  private readonly ignoredFiles = new Set([
    '.DS_Store',
    'Thumbs.db',
    '.gitignore',
    '.gitattributes',
    '.npmignore',
    '.dockerignore',
  ]);

  /**
   * Build a file tree from a directory
   */
  async buildTree(rootPath: string): Promise<FileTreeNode> {
    try {
      logger.info('Building file tree', { rootPath });

      const tree = await this.buildNode(rootPath, rootPath);

      logger.info('File tree built successfully', {
        rootPath,
        totalFiles: this.countFiles(tree),
      });

      return tree;
    } catch (error) {
      logger.error('Failed to build file tree', { error, rootPath });
      throw new Error(`Failed to build file tree: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build a single node (file or directory)
   */
  private async buildNode(fullPath: string, rootPath: string): Promise<FileTreeNode> {
    const stat = await fs.stat(fullPath);
    const name = path.basename(fullPath);
    const relativePath = path.relative(rootPath, fullPath);

    if (stat.isDirectory()) {
      // Build directory node
      const children: FileTreeNode[] = [];
      const entries = await fs.readdir(fullPath);

      for (const entry of entries) {
        // Skip ignored directories and files
        if (this.ignoredDirs.has(entry) || this.ignoredFiles.has(entry)) {
          continue;
        }

        const entryPath = path.join(fullPath, entry);
        try {
          const childNode = await this.buildNode(entryPath, rootPath);
          children.push(childNode);
        } catch (error) {
          // Skip files that can't be accessed
          logger.warn('Skipping inaccessible file', { path: entryPath, error });
        }
      }

      return {
        name,
        path: relativePath || '.',
        type: 'directory',
        children: children.sort((a, b) => {
          // Directories first, then files
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        }),
      };
    } else {
      // Build file node
      const extension = path.extname(name).toLowerCase();
      const language = this.detectLanguage(extension);

      return {
        name,
        path: relativePath,
        type: 'file',
        size: stat.size,
        extension: extension || undefined,
        language: language || undefined,
      };
    }
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(extension: string): string | null {
    const languageMap: Record<string, string> = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.c': 'C',
      '.cpp': 'C++',
      '.cc': 'C++',
      '.cxx': 'C++',
      '.h': 'C/C++ Header',
      '.hpp': 'C++ Header',
      '.cs': 'C#',
      '.go': 'Go',
      '.rs': 'Rust',
      '.rb': 'Ruby',
      '.php': 'PHP',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.r': 'R',
      '.m': 'Objective-C',
      '.sh': 'Shell',
      '.bash': 'Bash',
      '.zsh': 'Zsh',
      '.ps1': 'PowerShell',
      '.sql': 'SQL',
      '.html': 'HTML',
      '.htm': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.sass': 'Sass',
      '.less': 'Less',
      '.json': 'JSON',
      '.xml': 'XML',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.toml': 'TOML',
      '.md': 'Markdown',
      '.rst': 'reStructuredText',
      '.vue': 'Vue',
      '.svelte': 'Svelte',
      '.dart': 'Dart',
      '.lua': 'Lua',
      '.pl': 'Perl',
      '.ex': 'Elixir',
      '.exs': 'Elixir',
      '.erl': 'Erlang',
      '.clj': 'Clojure',
      '.fs': 'F#',
      '.ml': 'OCaml',
      '.hs': 'Haskell',
      '.elm': 'Elm',
    };

    return languageMap[extension] || null;
  }

  /**
   * Count total files in tree
   */
  private countFiles(node: FileTreeNode): number {
    if (node.type === 'file') {
      return 1;
    }

    let count = 0;
    if (node.children) {
      for (const child of node.children) {
        count += this.countFiles(child);
      }
    }

    return count;
  }

  /**
   * Get all files from tree (flat list)
   */
  getAllFiles(node: FileTreeNode): FileTreeNode[] {
    const files: FileTreeNode[] = [];

    const traverse = (currentNode: FileTreeNode): void => {
      if (currentNode.type === 'file') {
        files.push(currentNode);
      } else if (currentNode.children) {
        for (const child of currentNode.children) {
          traverse(child);
        }
      }
    };

    traverse(node);
    return files;
  }

  /**
   * Get files by language
   */
  getFilesByLanguage(node: FileTreeNode): Record<string, FileTreeNode[]> {
    const filesByLanguage: Record<string, FileTreeNode[]> = {};
    const allFiles = this.getAllFiles(node);

    for (const file of allFiles) {
      if (file.language) {
        if (!filesByLanguage[file.language]) {
          filesByLanguage[file.language] = [];
        }
        filesByLanguage[file.language].push(file);
      }
    }

    return filesByLanguage;
  }

  /**
   * Calculate total size of all files
   */
  getTotalSize(node: FileTreeNode): number {
    if (node.type === 'file') {
      return node.size || 0;
    }

    let totalSize = 0;
    if (node.children) {
      for (const child of node.children) {
        totalSize += this.getTotalSize(child);
      }
    }

    return totalSize;
  }
}

// Made with Bob
