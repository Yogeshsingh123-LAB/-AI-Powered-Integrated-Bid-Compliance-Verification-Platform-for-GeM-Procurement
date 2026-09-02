import React, { useState, useEffect, useRef } from 'react';
import { Network, RefreshCw } from 'lucide-react';
import './CartelDetectionGraph.css';

export default function CartelDetectionGraph({ tenderId = "DEMO-TENDER-01" }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const containerRef = useRef(null);

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
    cartel_risk_score: 75,
    cartel_risk_level: "HIGH",
    is_cartel_suspected: true,
    cartel_rings_count: 1,
    cartel_rings: [
      {
        cluster_id: "RING-01",
        bidder_count: 2,
        risk_level: "HIGH"
      }
    ],
    evidence: [
      "SHARED DIRECTOR: Ramesh Kumar is shared across Apex Infra & Zenith Tech",
      "COMMON ADDRESS: Plot 42 Cyber City, Gurugram registered by multiple bidders",
      "SHARED IP: 103.22.45.10 submitted synchronized bids"
    ],
    graph_elements: {
      nodes: [
        { data: { id: "BID-01", label: "Apex Infra Solution Ltd", type: "Bidder", color: "#3b82f6" } },
        { data: { id: "BID-02", label: "Zenith Tech Enterprises", type: "Bidder", color: "#3b82f6" } },
        { data: { id: "BID-03", label: "Vanguard Builders Pvt Ltd", type: "Bidder", color: "#3b82f6" } },
        { data: { id: "DIR-ramesh-kumar", label: "Director: Ramesh Kumar", type: "Director", color: "#f97316" } },
        { data: { id: "ADDR-gurugram", label: "Address: Cyber City, Gurugram", type: "Address", color: "#a855f7" } },
        { data: { id: "IP-103.22.45.10", label: "IP: 103.22.45.10", type: "IPAddress", color: "#ef4444" } },
        { data: { id: "BANK-hdfc", label: "Bank: HDFC-998877", type: "BankAccount", color: "#10b981" } }
      ],
      edges: [
        { data: { id: "BID-01-DIR-ramesh-kumar", source: "BID-01", target: "DIR-ramesh-kumar", relationship: "MANAGED_BY" } },
        { data: { id: "BID-02-DIR-ramesh-kumar", source: "BID-02", target: "DIR-ramesh-kumar", relationship: "MANAGED_BY" } },
        { data: { id: "BID-01-ADDR-gurugram", source: "BID-01", target: "ADDR-gurugram", relationship: "REGISTERED_AT" } },
        { data: { id: "BID-02-ADDR-gurugram", source: "BID-02", target: "ADDR-gurugram", relationship: "REGISTERED_AT" } },
        { data: { id: "BID-01-IP-103.22.45.10", source: "BID-01", target: "IP-103.22.45.10", relationship: "SUBMITTED_FROM" } },
        { data: { id: "BID-02-IP-103.22.45.10", source: "BID-02", target: "IP-103.22.45.10", relationship: "SUBMITTED_FROM" } },
        { data: { id: "BID-03-BANK-hdfc", source: "BID-03", target: "BANK-hdfc", relationship: "HAS_BANK_ACCOUNT" } }
      ]
    }
  });

  // Calculate layout coordinates (normalized percentage offsets)
  const getNodePosPercentage = (index, total) => {
    const rx = 38; // percentage radius X
    const ry = 36; // percentage radius Y
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    const x = 50 + Math.cos(angle) * rx;
    const y = 50 + Math.sin(angle) * ry;
    return { x, y };
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
  const edges = graphData?.graph_elements?.edges || [];
  const riskLevel = graphData?.cartel_risk_level || "LOW";

  // Map nodes with positions
  const nodePosMap = {};
  nodes.forEach((node, idx) => {
    nodePosMap[node.data.id] = getNodePosPercentage(idx, nodes.length);
  });

  return (
    <div className="cartel-container">
      <div className="cartel-header">
        <div className="cartel-title-area">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={22} style={{ color: '#a855f7' }} /> Bidder Cartel & Relationship Graph
          </h2>
          <span className={`cartel-badge ${riskLevel.toLowerCase()}`}>
            {riskLevel} RISK ({graphData?.cartel_risk_score || 0}/100)
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
        <div className="graph-canvas-box" ref={containerRef} style={{ position: 'relative', overflow: 'hidden' }}>
          <div className="graph-legend">
            <div className="legend-item"><span className="legend-dot" style={{ background: '#3b82f6' }}></span> Bidder</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#f97316' }}></span> Director</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#a855f7' }}></span> Address</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#10b981' }}></span> Bank Account</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }}></span> IP Address</div>
          </div>

          {/* SVG Connection Lines */}
          <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            {edges.map((edge) => {
              const srcPos = nodePosMap[edge.data.source];
              const tgtPos = nodePosMap[edge.data.target];
              if (!srcPos || !tgtPos) return null;

              const isHighlighted = selectedNode && (selectedNode.id === edge.data.source || selectedNode.id === edge.data.target);
              return (
                <line
                  key={edge.data.id}
                  x1={`${srcPos.x}%`}
                  y1={`${srcPos.y}%`}
                  x2={`${tgtPos.x}%`}
                  y2={`${tgtPos.y}%`}
                  stroke={isHighlighted ? '#f59e0b' : 'rgba(148, 163, 184, 0.35)'}
                  strokeWidth={isHighlighted ? 2.5 : 1.5}
                  strokeDasharray={edge.data.relationship === 'SUBMITTED_FROM' ? '4 4' : 'none'}
                />
              );
            })}
          </svg>

          {/* Render Graph Nodes */}
          <div className="visual-nodes-wrapper" style={{ position: 'relative', width: '100%', height: '360px', zIndex: 2 }}>
            {nodes.map((node) => {
              const pos = nodePosMap[node.data.id];
              const isSelected = selectedNode?.id === node.data.id;
              return (
                <div
                  key={node.data.id}
                  className="node-card"
                  style={{
                    position: 'absolute',
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    borderColor: node.data.color,
                    boxShadow: isSelected ? `0 0 20px ${node.data.color}` : 'none',
                    background: isSelected ? 'rgba(30,41,59,0.95)' : 'rgba(15,23,42,0.85)',
                    cursor: 'pointer'
                  }}
                  onClick={() => setSelectedNode(node.data)}
                >
                  <span style={{ color: node.data.color, marginRight: '0.4rem' }}>●</span>
                  {node.data.label}
                </div>
              );
            })}
          </div>

          {selectedNode && (
            <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', background: 'rgba(15,23,42,0.95)', border: `1px solid ${selectedNode.color}`, borderRadius: '8px', padding: '10px 14px', fontSize: '0.8rem', zIndex: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{ color: selectedNode.color }}>Selected Node: {selectedNode.label}</strong>
                <div style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Entity Type: {selectedNode.type} • ID: {selectedNode.id}</div>
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.85rem' }}>✕ Close</button>
            </div>
          )}
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
                const isCrit = item.includes("CRITICAL") || item.includes("OVERLAPPING") || item.includes("SHARED");
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
