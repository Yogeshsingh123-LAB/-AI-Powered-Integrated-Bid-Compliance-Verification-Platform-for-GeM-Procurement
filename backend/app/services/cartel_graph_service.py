import os
import logging
from typing import Dict, List, Any, Optional, Tuple, Set
import networkx as nx

logger = logging.getLogger(__name__)

# Try importing neo4j driver
try:
    # pyrefly: ignore [missing-import]
    from neo4j import GraphDatabase, Driver
    HAS_NEO4J_DRIVER = True
except ImportError:
    HAS_NEO4J_DRIVER = False
    Driver = Any

class CartelGraphService:
    """
    Manages bidder relationship graph mapping in Neo4j graph database.
    Includes an automatic in-memory NetworkX graph fallback if Neo4j is offline or not configured.
    """

    def __init__(self):
        self.neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        self.neo4j_user = os.getenv("NEO4J_USER", "neo4j")
        self.neo4j_password = os.getenv("NEO4J_PASSWORD", "password")
        
        self._driver: Optional[Driver] = None
        self._nx_graph = nx.DiGraph()

        if HAS_NEO4J_DRIVER and os.getenv("NEO4J_ENABLED", "false").lower() == "true":
            try:
                self._driver = GraphDatabase.driver(
                    self.neo4j_uri,
                    auth=(self.neo4j_user, self.neo4j_password)
                )
                logger.info(f"CartelGraphService: Connected to Neo4j database at {self.neo4j_uri}")
            except Exception as e:
                logger.warning(f"CartelGraphService: Failed to connect to Neo4j ({e}). Falling back to NetworkX in-memory graph.")
                self._driver = None
        else:
            logger.info("CartelGraphService: Neo4j not enabled. Operating with NetworkX in-memory graph engine.")

    def is_neo4j_active(self) -> bool:
        return self._driver is not None

    def close(self):
        if self._driver:
            self._driver.close()

    def clear_graph(self):
        """Clears graph data in NetworkX and Neo4j (if active)."""
        self._nx_graph.clear()
        if self._driver:
            try:
                with self._driver.session() as session:
                    session.run("MATCH (n) DETACH DELETE n")
            except Exception as e:
                logger.error(f"Failed to clear Neo4j graph: {e}")

    def add_bidder_node(self, bidder_id: str, bidder_name: str, pan: Optional[str] = None, gstin: Optional[str] = None):
        """Adds a Bidder entity node."""
        self._nx_graph.add_node(
            bidder_id,
            label="Bidder",
            name=bidder_name,
            pan=pan or "",
            gstin=gstin or ""
        )
        if self._driver:
            try:
                with self._driver.session() as session:
                    session.run(
                        "MERGE (b:Bidder {id: $id}) "
                        "SET b.name = $name, b.pan = $pan, b.gstin = $gstin",
                        id=bidder_id, name=bidder_name, pan=pan or "", gstin=gstin or ""
                    )
            except Exception as e:
                logger.error(f"Neo4j add_bidder_node error: {e}")

    def add_entity_relationship(
        self,
        source_id: str,
        target_id: str,
        target_label: str,
        target_name: str,
        rel_type: str,
        properties: Optional[Dict[str, Any]] = None
    ):
        """Connects a source entity (e.g. Bidder) to a target node (Address, Director, BankAccount, IP, etc.)."""
        props = properties or {}
        
        # Add target node to NetworkX
        self._nx_graph.add_node(
            target_id,
            label=target_label,
            name=target_name,
            **props
        )
        # Add relationship edge
        self._nx_graph.add_edge(source_id, target_id, rel_type=rel_type, **props)

        # Mirror to Neo4j if active
        if self._driver:
            try:
                cypher = (
                    f"MERGE (s {{id: $source_id}}) "
                    f"MERGE (t:{target_label} {{id: $target_id}}) "
                    f"SET t.name = $target_name "
                    f"MERGE (s)-[r:{rel_type}]->(t)"
                )
                with self._driver.session() as session:
                    session.run(
                        cypher,
                        source_id=source_id,
                        target_id=target_id,
                        target_name=target_name
                    )
            except Exception as e:
                logger.error(f"Neo4j add_entity_relationship error: {e}")

    def get_cytoscape_elements(self) -> Dict[str, List[Dict[str, Any]]]:
        """Formats current graph nodes and edges into Cytoscape / D3 visual format."""
        nodes = []
        edges = []

        # Color map for visual distinction
        color_map = {
            "Bidder": "#3b82f6",       # Blue
            "Director": "#f97316",     # Orange
            "Address": "#a855f7",      # Purple
            "BankAccount": "#10b981",  # Green
            "IPAddress": "#ef4444",    # Red
            "Tender": "#eab308"        # Yellow
        }

        for node_id, attrs in self._nx_graph.nodes(data=True):
            label = attrs.get("label", "Entity")
            nodes.append({
                "data": {
                    "id": str(node_id),
                    "label": attrs.get("name", str(node_id)),
                    "type": label,
                    "color": color_map.get(label, "#64748b"),
                    **attrs
                }
            })

        for u, v, attrs in self._nx_graph.edges(data=True):
            edges.append({
                "data": {
                    "id": f"{u}-{v}",
                    "source": str(u),
                    "target": str(v),
                    "relationship": attrs.get("rel_type", "CONNECTED_TO"),
                    **attrs
                }
            })

        return {"nodes": nodes, "edges": edges}

    def detect_overlapping_entities(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Analyzes the graph to identify shared directors, common addresses, overlapping bank accounts, and shared IPs
        connected to multiple distinct bidder nodes.
        """
        bidders = [n for n, d in self._nx_graph.nodes(data=True) if d.get("label") == "Bidder"]
        
        shared_directors = []
        shared_addresses = []
        shared_bank_accounts = []
        shared_ips = []

        # Group bidders connected to non-bidder target nodes
        for node_id, attrs in self._nx_graph.nodes(data=True):
            label = attrs.get("label")
            if label == "Bidder":
                continue

            # Find all bidders connected to this node
            connected_bidders = []
            for b in bidders:
                if self._nx_graph.has_edge(b, node_id) or self._nx_graph.has_edge(node_id, b):
                    bidder_name = self._nx_graph.nodes[b].get("name", b)
                    connected_bidders.append({"bidder_id": b, "bidder_name": bidder_name})

            if len(connected_bidders) > 1:
                overlap_item = {
                    "entity_id": node_id,
                    "entity_type": label,
                    "entity_name": attrs.get("name", node_id),
                    "connected_bidders": connected_bidders,
                    "bidder_count": len(connected_bidders)
                }

                if label == "Director":
                    shared_directors.append(overlap_item)
                elif label == "Address":
                    shared_addresses.append(overlap_item)
                elif label == "BankAccount":
                    shared_bank_accounts.append(overlap_item)
                elif label == "IPAddress":
                    shared_ips.append(overlap_item)

        return {
            "shared_directors": shared_directors,
            "shared_addresses": shared_addresses,
            "shared_bank_accounts": shared_bank_accounts,
            "shared_ips": shared_ips
        }

    def detect_cartel_clusters(self) -> List[Dict[str, Any]]:
        """
        Identifies connected subgraphs (bidding rings) where multiple bidders are linked via shared identifiers.
        """
        # Convert graph to undirected to find connected components
        undirected_g = self._nx_graph.to_undirected()
        components = list(nx.connected_components(undirected_g))

        clusters = []
        cluster_id = 1
        for comp in components:
            bidders_in_cluster = [n for n in comp if self._nx_graph.nodes[n].get("label") == "Bidder"]

            if len(bidders_in_cluster) > 1:
                bidder_details = [
                    {
                        "id": b,
                        "name": self._nx_graph.nodes[b].get("name", b),
                        "gstin": self._nx_graph.nodes[b].get("gstin", ""),
                        "pan": self._nx_graph.nodes[b].get("pan", "")
                    }
                    for b in bidders_in_cluster
                ]
                
                shared_nodes = [
                    {
                        "id": n,
                        "type": self._nx_graph.nodes[n].get("label"),
                        "name": self._nx_graph.nodes[n].get("name")
                    }
                    for n in comp if self._nx_graph.nodes[n].get("label") != "Bidder"
                ]

                clusters.append({
                    "cluster_id": f"RING-{cluster_id:02d}",
                    "bidder_count": len(bidders_in_cluster),
                    "bidders": bidder_details,
                    "shared_entities": shared_nodes,
                    "risk_level": "HIGH" if len(bidders_in_cluster) >= 3 else "MEDIUM"
                })
                cluster_id += 1

        return clusters

# Singleton instance
cartel_graph_service = CartelGraphService()
