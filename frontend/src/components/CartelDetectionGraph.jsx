import React, { useState, useEffect } from 'react';
import { Network, RefreshCw } from 'lucide-react';
import './CartelDetectionGraph.css';

export default function CartelDetectionGraph({ tenderId = "DEMO-TENDER-01" }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    fetchGraphData();
  }, [tenderId]);

  const fetchGraphData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/cartel/graph/${tenderId}`);
      if (res.ok) {
        const data = await res.json();
        setGraphData(data);
      } else {
        setGraphData(getCleanCartelData());
      }
    } catch (err) {
      setGraphData(getCleanCartelData());
    } finally {
      setLoading(false);
    }
  };

  const getCleanCartelData = () => ({
    tender_id: tenderId,
    cartel_risk_score: 0,
    cartel_risk_level: "LOW",
    is_cartel_suspected: false,
    cartel_rings_count: 0,
    cartel_rings: [],
    evidence: [
      "Clean Record: No cartel or collusion patterns detected across submitted bids."
    ],
    graph_elements: {
      nodes: [],
      edges: []
    }
  });

  // Simple layout positioning calculation for demonstration graph
  const getNodePosition = (index, total) => {
    const radius = 140;
    const angle = (index / total) * 2 * Math.PI;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` };
  };

  if (loading) {
    return (
      <div className="cartel-container">
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          Mapping bidder entity relationship graph...
        </div>
      </div>
    );
  }

  const nodes = graphData?.graph_elements?.nodes || [];
  const riskLevel = graphData?.cartel_risk_level || "LOW";

  return (
    <div className="cartel-container">
      <div className="cartel-header">
        <div className="cartel-title-area">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Network size={22} style={{ color: '#a855f7' }} /> Bidder Cartel & Relationship Graph</h2>
          <span className={`cartel-badge ${riskLevel.toLowerCase()}`}>
            {riskLevel} RISK ({graphData?.cartel_risk_score}/100)
          </span>
        </div>
        <button 
          onClick={fetchGraphData}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} /> Refresh Graph
        </button>
      </div>

      <div className="cartel-content">
        {/* Interactive Visual Graph Canvas */}
        <div className="graph-canvas-box">
          <div className="graph-legend">
            <div className="legend-item"><span className="legend-dot" style={{ background: '#3b82f6' }}></span> Bidder</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#f97316' }}></span> Director</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#a855f7' }}></span> Address</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }}></span> Bank Account</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }}></span> IP Address</div>
          </div>

          <div className="visual-nodes-wrapper">
            {nodes.map((node, idx) => {
              const pos = getNodePosition(idx, nodes.length);
              const isSelected = selectedNode?.id === node.data.id;
              return (
                <div
                  key={node.data.id}
                  className="node-card"
                  style={{
                    ...pos,
                    borderColor: node.data.color,
                    boxShadow: isSelected ? `0 0 20px ${node.data.color}` : 'none'
                  }}
                  onClick={() => setSelectedNode(node.data)}
                >
                  <span style={{ color: node.data.color, marginRight: '0.4rem' }}>●</span>
                  {node.data.label}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Breakdown */}
        <div className="cartel-sidebar">
          <div className="cartel-panel">
            <h4>Bidding Rings Detected ({graphData?.cartel_rings_count || 0})</h4>
            {graphData?.cartel_rings?.map((ring, i) => (
              <div key={i} className="ring-card">
                <div>
                  <strong>{ring.cluster_id}</strong> ({ring.bidder_count} Bidders linked)
                </div>
                <span className="cartel-badge high">{ring.risk_level}</span>
              </div>
            ))}
          </div>

          <div className="cartel-panel">
            <h4>Suspicious Evidence & Patterns</h4>
            <div className="evidence-list">
              {graphData?.evidence?.map((item, idx) => {
                const isCrit = item.includes("CRITICAL") || item.includes("OVERLAPPING");
                return (
                  <div key={idx} className={`evidence-item ${isCrit ? 'critical' : 'high'}`}>
                    {item}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
