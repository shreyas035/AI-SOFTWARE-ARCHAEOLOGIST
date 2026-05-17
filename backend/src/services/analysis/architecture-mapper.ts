import { FileTreeNode, ImportRelationship } from '../../types/repository.types';
import logger from '../../config/logger';

export interface ArchitectureNode {
  id: string;
  type: string;
  data: { label: string; type: string; path: string };
  position: { x: number; y: number };
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  animated: boolean;
}

export class ArchitectureMapper {
  /**
   * Generates nodes and edges for React Flow visualization
   */
  mapToGraph(fileTree: FileTreeNode, relationships: ImportRelationship[]): { nodes: ArchitectureNode[], edges: ArchitectureEdge[] } {
    logger.info('Mapping architecture to graph');
    
    const nodes: ArchitectureNode[] = [];
    const edges: ArchitectureEdge[] = [];
    const processedFiles = new Set<string>();

    // 1. Create nodes for files involved in relationships
    relationships.forEach(rel => {
      [rel.sourceFile, rel.targetFile].forEach(filePath => {
        if (!processedFiles.has(filePath)) {
          const fileName = filePath.split('/').pop() || filePath;
          const type = this.getNodeType(filePath);
          
          nodes.push({
            id: filePath,
            type: 'default',
            data: { label: fileName, type, path: filePath },
            position: { x: Math.random() * 800, y: Math.random() * 600 } // Initial layout
          });
          processedFiles.add(filePath);
        }
      });

      // 2. Create edges
      edges.push({
        id: `e-${rel.sourceFile}-${rel.targetFile}`,
        source: rel.sourceFile,
        target: rel.targetFile,
        animated: true
      });
    });

    return { nodes, edges };
  }

  private getNodeType(filePath: string): string {
    if (filePath.includes('/routes/') || filePath.includes('/api/')) return 'api';
    if (filePath.includes('/controllers/')) return 'controller';
    if (filePath.includes('/services/')) return 'service';
    if (filePath.includes('/components/')) return 'ui';
    if (filePath.includes('/models/') || filePath.includes('/db/')) return 'data';
    return 'logic';
  }
}

// Made with Bob