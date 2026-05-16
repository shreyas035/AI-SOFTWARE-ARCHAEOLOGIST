import { PrismaClient } from '@prisma/client';
import * as fs from 'fs/promises';
import * as path from 'path';
import logger from '../../config/logger';

export interface ArchitectureNode {
  id: string;
  type: 'module' | 'service' | 'component' | 'database' | 'external' | 'config';
  label: string;
  data: {
    filePath: string;
    language: string;
    linesOfCode: number;
    dependencies: string[];
    exports: string[];
    importance: number; // 0-100
    layer: 'presentation' | 'business' | 'data' | 'external';
  };
  position: { x: number; y: number };
  style?: {
    background?: string;
    border?: string;
    color?: string;
  };
}

export interface ArchitectureEdge {
  id: string;
  source: string;
  target: string;
  type: 'import' | 'api-call' | 'database-query' | 'config';
  animated?: boolean;
  label?: string;
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
}

export interface ArchitectureMap {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
  metadata: {
    totalModules: number;
    totalConnections: number;
    layers: string[];
    criticalPaths: string[][];
    entryPoints: string[];
  };
}

export class ArchitectureMapper {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Generate architecture map for a repository
   */
  async generateArchitectureMap(repositoryId: string): Promise<ArchitectureMap> {
    try {
      logger.info('Generating architecture map', { repositoryId });

      // Get repository data
      const repository = await this.prisma.repository.findUnique({
        where: { id: repositoryId },
      });

      if (!repository || !repository.filePath) {
        throw new Error('Repository not found or not processed');
      }

      const metadata = repository.metadata as any;
      const rootPath = repository.filePath;

      // Build nodes from file tree
      const nodes = await this.buildNodes(rootPath, metadata);

      // Build edges from dependencies
      const edges = this.buildEdges(nodes, metadata);

      // Calculate positions using force-directed layout
      this.calculatePositions(nodes, edges);

      // Identify critical paths
      const criticalPaths = this.identifyCriticalPaths(nodes, edges);

      // Identify entry points
      const entryPoints = this.identifyEntryPoints(nodes, metadata);

      const architectureMap: ArchitectureMap = {
        nodes,
        edges,
        metadata: {
          totalModules: nodes.length,
          totalConnections: edges.length,
          layers: ['presentation', 'business', 'data', 'external'],
          criticalPaths,
          entryPoints,
        },
      };

      // Save to database
      await this.saveArchitectureMap(repositoryId, architectureMap);

      logger.info('Architecture map generated', {
        repositoryId,
        nodeCount: nodes.length,
        edgeCount: edges.length,
      });

      return architectureMap;
    } catch (error) {
      logger.error('Failed to generate architecture map', { error, repositoryId });
      throw error;
    }
  }

  /**
   * Build nodes from file tree
   */
  private async buildNodes(rootPath: string, metadata: any): Promise<ArchitectureNode[]> {
    const nodes: ArchitectureNode[] = [];
    const fileTree = metadata.fileTree || [];

    for (const file of fileTree) {
      if (this.shouldIncludeFile(file.path)) {
        const node = await this.createNode(rootPath, file);
        nodes.push(node);
      }
    }

    return nodes;
  }

  /**
   * Create a node from file information
   */
  private async createNode(rootPath: string, file: any): Promise<ArchitectureNode> {
    const filePath = path.join(rootPath, file.path);
    const language = file.language || this.detectLanguage(file.path);
    const layer = this.detectLayer(file.path);
    const type = this.detectNodeType(file.path, layer);

    // Calculate lines of code
    let linesOfCode = 0;
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      linesOfCode = content.split('\n').length;
    } catch (error) {
      // File might not exist or be readable
      linesOfCode = 0;
    }

    // Calculate importance based on connections and size
    const importance = this.calculateImportance(file, linesOfCode);

    return {
      id: this.generateNodeId(file.path),
      type,
      label: path.basename(file.path),
      data: {
        filePath: file.path,
        language,
        linesOfCode,
        dependencies: file.imports || [],
        exports: file.exports || [],
        importance,
        layer,
      },
      position: { x: 0, y: 0 }, // Will be calculated later
      style: this.getNodeStyle(type, layer),
    };
  }

  /**
   * Build edges from dependencies
   */
  private buildEdges(nodes: ArchitectureNode[], metadata: any): ArchitectureEdge[] {
    const edges: ArchitectureEdge[] = [];
    const nodeMap = new Map(nodes.map((n) => [n.data.filePath, n]));

    for (const node of nodes) {
      for (const dep of node.data.dependencies) {
        const targetNode = nodeMap.get(dep);
        if (targetNode) {
          edges.push({
            id: `${node.id}-${targetNode.id}`,
            source: node.id,
            target: targetNode.id,
            type: 'import',
            animated: node.data.importance > 70,
            style: {
              stroke: this.getEdgeColor(node.data.layer, targetNode.data.layer),
              strokeWidth: 2,
            },
          });
        }
      }
    }

    return edges;
  }

  /**
   * Calculate node positions using force-directed layout
   */
  private calculatePositions(nodes: ArchitectureNode[], edges: ArchitectureEdge[]): void {
    // Group nodes by layer
    const layers = {
      presentation: nodes.filter((n) => n.data.layer === 'presentation'),
      business: nodes.filter((n) => n.data.layer === 'business'),
      data: nodes.filter((n) => n.data.layer === 'data'),
      external: nodes.filter((n) => n.data.layer === 'external'),
    };

    // Position nodes in layers
    let yOffset = 0;
    const layerSpacing = 300;
    const nodeSpacing = 200;

    for (const [layerName, layerNodes] of Object.entries(layers)) {
      layerNodes.forEach((node, index) => {
        node.position.x = index * nodeSpacing;
        node.position.y = yOffset;
      });
      yOffset += layerSpacing;
    }
  }

  /**
   * Identify critical paths in the architecture
   */
  private identifyCriticalPaths(
    nodes: ArchitectureNode[],
    edges: ArchitectureEdge[]
  ): string[][] {
    const paths: string[][] = [];
    
    // Find nodes with high importance
    const criticalNodes = nodes
      .filter((n) => n.data.importance > 80)
      .sort((a, b) => b.data.importance - a.data.importance)
      .slice(0, 5);

    // For each critical node, trace its dependencies
    for (const node of criticalNodes) {
      const path = this.traceDependencyPath(node, edges, nodes);
      if (path.length > 1) {
        paths.push(path);
      }
    }

    return paths;
  }

  /**
   * Trace dependency path from a node
   */
  private traceDependencyPath(
    node: ArchitectureNode,
    edges: ArchitectureEdge[],
    nodes: ArchitectureNode[]
  ): string[] {
    const path: string[] = [node.id];
    const visited = new Set<string>([node.id]);

    let currentNode = node;
    let depth = 0;
    const maxDepth = 10;

    while (depth < maxDepth) {
      const outgoingEdges = edges.filter((e) => e.source === currentNode.id);
      
      if (outgoingEdges.length === 0) break;

      // Follow the most important dependency
      const nextEdge = outgoingEdges[0];
      if (visited.has(nextEdge.target)) break;

      path.push(nextEdge.target);
      visited.add(nextEdge.target);

      const nextNode = nodes.find((n) => n.id === nextEdge.target);
      if (!nextNode) break;

      currentNode = nextNode;
      depth++;
    }

    return path;
  }

  /**
   * Identify entry points in the architecture
   */
  private identifyEntryPoints(nodes: ArchitectureNode[], metadata: any): string[] {
    const entryPoints: string[] = [];

    // Common entry point patterns
    const entryPatterns = [
      /^(index|main|app|server)\.(ts|js|py|java|go)$/i,
      /^src\/(index|main|app)\.(ts|js)$/i,
      /^(manage|wsgi|asgi)\.py$/i,
    ];

    for (const node of nodes) {
      const fileName = path.basename(node.data.filePath);
      if (entryPatterns.some((pattern) => pattern.test(fileName))) {
        entryPoints.push(node.id);
      }
    }

    return entryPoints;
  }

  /**
   * Save architecture map to database
   */
  private async saveArchitectureMap(
    repositoryId: string,
    map: ArchitectureMap
  ): Promise<void> {
    await this.prisma.architectureMap.create({
      data: {
        repositoryId,
        nodes: map.nodes as any,
        edges: map.edges as any,
        metadata: map.metadata as any,
      },
    });
  }

  /**
   * Helper: Should include file in architecture map
   */
  private shouldIncludeFile(filePath: string): boolean {
    // Exclude certain directories and files
    const excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /\.test\./,
      /\.spec\./,
      /\.min\./,
    ];

    return !excludePatterns.some((pattern) => pattern.test(filePath));
  }

  /**
   * Helper: Detect programming language
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.js': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rb': 'ruby',
      '.php': 'php',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
    };
    return languageMap[ext] || 'unknown';
  }

  /**
   * Helper: Detect architectural layer
   */
  private detectLayer(filePath: string): 'presentation' | 'business' | 'data' | 'external' {
    const lowerPath = filePath.toLowerCase();

    if (
      lowerPath.includes('component') ||
      lowerPath.includes('view') ||
      lowerPath.includes('page') ||
      lowerPath.includes('ui')
    ) {
      return 'presentation';
    }

    if (
      lowerPath.includes('model') ||
      lowerPath.includes('schema') ||
      lowerPath.includes('database') ||
      lowerPath.includes('repository')
    ) {
      return 'data';
    }

    if (lowerPath.includes('api') || lowerPath.includes('external') || lowerPath.includes('client')) {
      return 'external';
    }

    return 'business';
  }

  /**
   * Helper: Detect node type
   */
  private detectNodeType(
    filePath: string,
    layer: string
  ): 'module' | 'service' | 'component' | 'database' | 'external' | 'config' {
    const lowerPath = filePath.toLowerCase();

    if (lowerPath.includes('config') || lowerPath.endsWith('.json') || lowerPath.endsWith('.yaml')) {
      return 'config';
    }

    if (layer === 'presentation') return 'component';
    if (layer === 'data') return 'database';
    if (layer === 'external') return 'external';
    if (lowerPath.includes('service')) return 'service';

    return 'module';
  }

  /**
   * Helper: Calculate node importance
   */
  private calculateImportance(file: any, linesOfCode: number): number {
    let importance = 0;

    // Size factor (0-30 points)
    importance += Math.min(30, (linesOfCode / 100) * 10);

    // Dependency factor (0-40 points)
    const depCount = (file.imports?.length || 0) + (file.exports?.length || 0);
    importance += Math.min(40, depCount * 2);

    // Entry point bonus (30 points)
    const fileName = path.basename(file.path).toLowerCase();
    if (/^(index|main|app|server)/.test(fileName)) {
      importance += 30;
    }

    return Math.min(100, importance);
  }

  /**
   * Helper: Get node style based on type and layer
   */
  private getNodeStyle(
    type: string,
    layer: string
  ): { background?: string; border?: string; color?: string } {
    const layerColors: Record<string, string> = {
      presentation: '#3b82f6', // blue
      business: '#10b981', // green
      data: '#f59e0b', // amber
      external: '#8b5cf6', // purple
    };

    return {
      background: layerColors[layer] || '#6b7280',
      border: '2px solid #1f2937',
      color: '#ffffff',
    };
  }

  /**
   * Helper: Get edge color based on layers
   */
  private getEdgeColor(sourceLayer: string, targetLayer: string): string {
    if (sourceLayer === targetLayer) return '#6b7280';
    return '#3b82f6';
  }

  /**
   * Helper: Generate unique node ID
   */
  private generateNodeId(filePath: string): string {
    return filePath.replace(/[^a-zA-Z0-9]/g, '-');
  }
}

// Made with Bob