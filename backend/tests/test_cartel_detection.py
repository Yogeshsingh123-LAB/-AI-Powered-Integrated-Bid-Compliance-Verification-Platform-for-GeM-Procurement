"""
Unit tests for Cartel Detection Module & Neo4j / NetworkX Bidder Relationship Mapping
"""

# pyrefly: ignore [missing-import]
import pytest
from app.services.cartel_graph_service import cartel_graph_service
from app.scoring.cartel_detector import CartelDetector

def test_cartel_graph_service_nodes_and_relationships():
    """Verifies node and relationship creation in graph service."""
    cartel_graph_service.clear_graph()
    
    cartel_graph_service.add_bidder_node("B1", "Bidder One", pan="AAAAA1111A", gstin="27AAAAA1111A1Z1")
    cartel_graph_service.add_entity_relationship("B1", "DIR-1", "Director", "Director Ramesh", "MANAGED_BY")
    cartel_graph_service.add_entity_relationship("B1", "ADDR-1", "Address", "Corporate Park Del", "REGISTERED_AT")

    elements = cartel_graph_service.get_cytoscape_elements()
    assert len(elements["nodes"]) == 3
    assert len(elements["edges"]) == 2

def test_overlapping_entities_detection():
    """Verifies detection of shared directors and common addresses across distinct bidders."""
    cartel_graph_service.clear_graph()
    
    # Bidder 1 & Bidder 2 share Director Ramesh and Address 101
    cartel_graph_service.add_bidder_node("B1", "Alpha Traders")
    cartel_graph_service.add_bidder_node("B2", "Beta Solutions")
    
    cartel_graph_service.add_entity_relationship("B1", "DIR-RAMESH", "Director", "Ramesh Gupta", "MANAGED_BY")
    cartel_graph_service.add_entity_relationship("B2", "DIR-RAMESH", "Director", "Ramesh Gupta", "MANAGED_BY")

    cartel_graph_service.add_entity_relationship("B1", "ADDR-101", "Address", "101 Cyber Hub", "REGISTERED_AT")
    cartel_graph_service.add_entity_relationship("B2", "ADDR-101", "Address", "101 Cyber Hub", "REGISTERED_AT")

    overlaps = cartel_graph_service.detect_overlapping_entities()
    assert len(overlaps["shared_directors"]) == 1
    assert overlaps["shared_directors"][0]["entity_name"] == "Ramesh Gupta"
    assert overlaps["shared_directors"][0]["bidder_count"] == 2

    assert len(overlaps["shared_addresses"]) == 1
    assert overlaps["shared_addresses"][0]["bidder_count"] == 2

    clusters = cartel_graph_service.detect_cartel_clusters()
    assert len(clusters) == 1
    assert clusters[0]["bidder_count"] == 2

def test_cartel_detector_cover_bidding_and_shared_ip():
    """Verifies cartel detector engine flags synchronized IP submissions and cover bidding patterns."""
    bids = [
        {
            "bid_id": "BID-1",
            "bidder_name": "Entity Alpha",
            "quote_amount": 1000000,
            "submission_timestamp": "2026-08-31T10:00:00Z",
            "ip_address": "192.168.1.100",
            "directors": ["Director A"],
            "addresses": ["Address 1"],
            "bank_accounts": ["BANK-001"]
        },
        {
            "bid_id": "BID-2",
            "bidder_name": "Entity Beta",
            "quote_amount": 1250000,
            "submission_timestamp": "2026-08-31T10:01:00Z",
            "ip_address": "192.168.1.100", # Shared IP
            "directors": ["Director A"],     # Shared Director
            "addresses": ["Address 1"],     # Shared Address
            "bank_accounts": ["BANK-002"]
        },
        {
            "bid_id": "BID-3",
            "bidder_name": "Entity Gamma",
            "quote_amount": 1255000,         # Cover bidding high quote tightly clustered with Beta
            "submission_timestamp": "2026-08-31T10:02:00Z",
            "ip_address": "192.168.1.101",
            "directors": ["Director C"],
            "addresses": ["Address 3"],
            "bank_accounts": ["BANK-003"]
        }
    ]

    report = CartelDetector.analyze_tender_cartel_risk("TENDER-99", bids)
    assert report["is_cartel_suspected"] is True
    assert report["cartel_risk_level"] in ["HIGH", "CRITICAL"]
    assert report["cartel_risk_score"] >= 60
    assert len(report["evidence"]) >= 3
    assert any("SHARED DIRECTOR" in e for e in report["evidence"])
    assert any("COMMON ADDRESS" in e for e in report["evidence"])
    assert any("Synchronized Submissions" in e for e in report["evidence"])
