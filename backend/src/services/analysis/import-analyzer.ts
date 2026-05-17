import path from 'path';
import fs from 'fs-extra';
import { FileTreeNode, ImportRelationship } from '../../types/repository.types';
import logger from '../../config/logger';

export class ImportAnalyzer {
  /**
   * Analyze imports and relationships between files
   */
  async analyzeRelationships(fileTree: FileTreeNode, rootPath: string): Promise<ImportRelationship[]> {
    try {
      logger.info('Analyzing code relationships', { rootPath });
      const relationships: ImportRelationship[] = [];
      const allFiles = this.getAllFiles(fileTree);
      
      // We focus on JS/TS/JSX/TSX for high-fidelity mapping
      const codeFiles = allFiles.filter(f => 
        /\.(js|ts|jsx|tsx)$/.test(f.path)
      );

      for (const file of codeFiles) {
        const filePath = path.join(rootPath, file.path);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        
        // Match imports: import ... from '...'; or require('...');
        const importRegex = /from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\)/g;
        let match;
        
        while ((match = importRegex.exec(fileContent)) !== null) {
          const importPath = match[1] || match[2];
          if (!importPath) continue;

          // Only track internal relationships (starts with . or ..)
          if (importPath.startsWith('.')) {
            const resolvedPath = this.resolveImportPath(file.path, importPath);
            if (resolvedPath) {
              relationships.push({
                sourceFile: file.path,
                targetFile: resolvedPath,
                importType: 'named', // Simplified for visualization
                importedSymbols: []
              });
            }
          }
        }
      }

      logger.info('Relationship analysis complete', { count: relationships.length });
      return relationships;
    } catch (error) {
      logger.error('Failed to analyze relationships', { error });
      return [];
    }
  }

  private resolveImportPath(sourcePath: string, importPath: string): string | null {
    const sourceDir = path.dirname(sourcePath);
    let targetPath = path.join(sourceDir, importPath);
    
    // Normalize and remove extensions for matching
    targetPath = targetPath.replace(/\\/g, '/');
    
    // Check common extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.js'];
    for (const ext of extensions) {
      const p = targetPath.endsWith(ext) ? targetPath : targetPath + ext;
      // This is a heuristic check; in a real engine we'd verify file existence
      // For the demo, we return the path that looks most like a file
    }

    return targetPath;
  }

  private getAllFiles(node: FileTreeNode): FileTreeNode[] {
    const files: FileTreeNode[] = [];
    const traverse = (n: FileTreeNode) => {
      if (n.type === 'file') files.push(n);
      if (n.children) n.children.forEach(traverse);
    };
    traverse(node);
    return files;
  }
}

// Made with Bob
