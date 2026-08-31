import React, { useState, useEffect } from 'react';
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
        // Fallback demo dataset if backend unreachable
        setGraphData(getMockCartelData());
      }
    } catch (err) {
      setGraphData(getMockCartelData());
    } finally {
      setLoading(false);
    }
  };

  const getMockCartelData = () => ({
    tender_id: tenderId,
    cartel_risk_score: 75,
    cartel_risk_level: "HIGH",
    is_cartel_suspected: true,
    cartel_rings_count: 1,
    cartel_rings: [
      {
        cluster_id: "RING-01",
        bidder_count: 2,
        bidders: [
          { name: "Apex Infra Solution Ltd", pan: "AAAAA1111A" },
          { name: "Zenith Tech Enterprises", pan: "BBBBB2222B" }
        ],
        shared_entities: [
          { type: "Director", name: "Ramesh Kumar" },
          { type: "Address", name: "Plot 42, Sector 18, Cyber City" },
          { type: "BankAccount", name: "HDFC-9988776655" }
        ]
      }
    ],
    evidence: [
      "SHARED DIRECTOR: Director 'Ramesh Kumar' is shared across Apex Infra & Zenith Tech",
      "COMMON ADDRESS: Address 'Plot 42, Sector 18' registered by multiple bidders",
      "OVERLAPPING BANK ACCOUNT: HDFC Account '9988776655' shared between bidders",
      "CRITICAL: 2 distinct bidders submitted tenders from identical IP address (103.22.45.10)"
    ],
    graph_elements: {
      nodes: [
        { data: { id: "B1", label: "Apex Infra Solution Ltd", type: "Bidder", color: "#3b82f6" } },
        { data: { id: "B2", label: "Zenith Tech Enterprises", type: "Bidder", color: "#3b82f6" } },
        { data: { id: "B3", label: "Vanguard Builders Pvt Ltd", type: "Bidder", color: "#3b82f6" } },
        { data: { id: "D1", label: "Ramesh Kumar (Director)", type: "Director", color: "#f97316" } },
        { data: { id: "A1", label: "Plot 42, Cyber City (Address)", type: "Address", color: "#a855f7" } },
        { data: { id: "BK1", label: "HDFC-9988776655 (Bank)", type: "BankAccount", color: "#10b981" } },
        { data: { id: "IP1", label: "103.22.45.10 (IP)", type: "IPAddress", color: "#ef4444" } }
      ],
      edges: [
        { data: { id: "B1-D1", source: "B1", target: "D1", relationship: "MANAGED_BY" } },
        { data: { id: "B2-D1", source: "B2", target: "D1", relationship: "MANAGED_BY" } },
        { data: { id: "B1-A1", source: "B1", target: "A1", relationship: "REGISTERED_AT" } },
        { data: { id: "B2-A1", source: "B2", target: "A1", relationship: "REGISTERED_AT" } },
        { data: { id: "B1-BK1", source: "B1", target: "BK1", relationship: "HAS_BANK_ACCOUNT" } },
        { data: { id: "B2-BK1", source: "B2", target: "BK1", relationship: "HAS_BANK_ACCOUNT" } },
        { data: { id: "B1-IP1", source: "B1", target: "IP1", relationship: "SUBMITTED_FROM" } },
        { data: { id: "B2-IP1", source: "B2", target: "IP1", relationship: "SUBMITTED_FROM" } }
      ]
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
          <h2>🕸️ Bidder Cartel & Relationship Graph</h2>
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
            fontSize: '0.8rem'
          }}
        >
          🔄 Refresh Graph
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
