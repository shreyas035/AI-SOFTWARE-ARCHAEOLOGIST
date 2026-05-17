import { PrismaClient } from '@prisma/client';
import { ImportAnalyzer } from './import-analyzer';
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
  private prisma?: PrismaClient;
  private importAnalyzer: ImportAnalyzer;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma;
    this.importAnalyzer = new ImportAnalyzer();
  }

  /**
   * On-demand generation and storage of architecture map
   */
  async generateArchitectureMap(repositoryId: string): Promise<void> {
    if (!this.prisma) throw new Error('Prisma client not configured');

    const repo = await this.prisma.repository.findUnique({
      where: { id: repositoryId }
    });

    if (!repo) throw new Error('Repository not found');

    const fileTree = (repo.metadata as any)?.fileTree;
    if (!fileTree) throw new Error('No file tree metadata found');

    const relationships = await this.importAnalyzer.analyzeRelationships(fileTree, repo.filePath);
    const { nodes, edges } = this.mapToGraph(fileTree, relationships);

    const existing = await this.prisma.architectureMap.findFirst({
      where: { repositoryId }
    });

    if (existing) {
      await this.prisma.architectureMap.update({
        where: { id: existing.id },
        data: {
          nodes: nodes as any,
          edges: edges as any,
          metadata: { relationshipCount: relationships.length } as any
        }
      });
    } else {
      await this.prisma.architectureMap.create({
        data: {
          repositoryId,
          nodes: nodes as any,
          edges: edges as any,
          metadata: { relationshipCount: relationships.length } as any
        }
      });
    }
  }
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