import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Button from '@components/ui/Button';
import api from '@services/api';

export default function ArchitecturePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArchitectureData();
  }, [id]);

  const fetchArchitectureData = async () => {
    try {
      setLoading(true);

      // Try fetching from architecture endpoint
      let fetchedNodes: Node[] = [];
      let fetchedEdges: Edge[] = [];

      try {
        const response = await api.get(`/architecture/${id}`);
        fetchedNodes = response.data.data.nodes || [];
        fetchedEdges = response.data.data.edges || [];
      } catch (e) {
        // Fallback: build from repository metadata
        const repoResponse = await api.get(`/repositories/${id}`);
        const meta = repoResponse.data.data?.metadata;

        if (meta) {
          // Generate nodes from languages and file structure
          const languages = meta.languages || [];
          const entryPoints = meta.entryPoints || [];
          const frameworks = meta.frameworks || [];

          // Create a nice visual layout from metadata
          const centerX = 400;
          const centerY = 300;

          // Central project node
          fetchedNodes.push({
            id: 'project',
            position: { x: centerX, y: centerY },
            data: { label: repoResponse.data.data.name || 'Project' },
            style: {
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '16px 24px',
              fontSize: '14px',
              fontWeight: 'bold',
              boxShadow: '0 0 20px rgba(99,102,241,0.3)'
            }
          });

          // Language nodes
          languages.forEach((lang: string, i: number) => {
            const angle = (i / languages.length) * Math.PI * 2;
            const radius = 200;
            fetchedNodes.push({
              id: `lang-${lang}`,
              position: {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
              },
              data: { label: `📝 ${lang}` },
              style: {
                background: '#1e293b',
                color: '#e2e8f0',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '12px'
              }
            });
            fetchedEdges.push({
              id: `e-project-${lang}`,
              source: 'project',
              target: `lang-${lang}`,
              animated: true,
              style: { stroke: '#6366f1' }
            });
          });

          // Entry point nodes
          entryPoints.forEach((ep: string, i: number) => {
            const angle = (i / Math.max(entryPoints.length, 1)) * Math.PI * 2 + Math.PI / 4;
            const radius = 350;
            fetchedNodes.push({
              id: `ep-${i}`,
              position: {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
              },
              data: { label: `🚀 ${ep}` },
              style: {
                background: '#1e293b',
                color: '#10b981',
                border: '1px solid #10b981',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '11px'
              }
            });
            fetchedEdges.push({
              id: `e-project-ep-${i}`,
              source: 'project',
              target: `ep-${i}`,
              animated: true,
              style: { stroke: '#10b981' }
            });
          });

          // Framework nodes
          frameworks.forEach((fw: string, i: number) => {
            fetchedNodes.push({
              id: `fw-${i}`,
              position: { x: centerX - 300 + i * 200, y: centerY + 250 },
              data: { label: `⚙️ ${fw}` },
              style: {
                background: '#1e293b',
                color: '#f59e0b',
                border: '1px solid #f59e0b',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '11px'
              }
            });
            fetchedEdges.push({
              id: `e-project-fw-${i}`,
              source: 'project',
              target: `fw-${i}`,
              style: { stroke: '#f59e0b' }
            });
          });
        }
      }

      setNodes(fetchedNodes);
      setEdges(fetchedEdges);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load architecture:', err);
      setError('Failed to load architecture map');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary-400" />
          <p className="text-dark-400">Reconstructing architecture from the ruins...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate(`/repositories/${id}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Architecture Explorer</h1>
            <p className="text-dark-400 text-sm">Interactive dependency and module relationship map</p>
          </div>
        </div>
      </div>

      {/* Graph */}
      <div className="flex-1 glass rounded-xl border border-primary-500/20 overflow-hidden">
        {error ? (
          <div className="h-full flex items-center justify-center text-red-400">{error}</div>
        ) : nodes.length === 0 ? (
          <div className="h-full flex items-center justify-center text-dark-400">
            <div className="text-center">
              <p className="text-lg mb-2">No architecture data available</p>
              <p className="text-sm">Upload a larger project to see the dependency map</p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            attributionPosition="bottom-left"
          >
            <Background color="#334155" gap={20} />
            <Controls />
            <MiniMap
              nodeColor={() => '#6366f1'}
              maskColor="rgba(0, 0, 0, 0.7)"
            />
          </ReactFlow>
        )}
      </div>
    </div>
  );
}

// Made with Bob
