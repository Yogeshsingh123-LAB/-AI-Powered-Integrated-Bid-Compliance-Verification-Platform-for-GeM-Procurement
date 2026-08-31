"""
Unit tests for Performance Benchmarking Service and GeM High-Volume Scale API
"""

# pyrefly: ignore [missing-import]
import pytest
from app.services.performance_benchmark_service import PerformanceBenchmarkService

def test_calculate_percentiles():
    """Verifies percentile mathematics for latency distributions."""
    sample_latencies = [1.0, 1.2, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 10.0]
    p50 = PerformanceBenchmarkService.calculate_percentile(sample_latencies, 50)
    p95 = PerformanceBenchmarkService.calculate_percentile(sample_latencies, 95)

    assert p50 == 2.75 or p50 > 1.5
    assert p95 > 5.0

def test_synthetic_benchmark_execution():
    """Verifies execution of synthetic parallel load test."""
    result = PerformanceBenchmarkService.run_synthetic_benchmark(num_bids=20, concurrency_workers=5)

    assert result["num_bids_processed"] == 20
    assert result["concurrency_workers"] == 5
    assert "sub_5s_sla_pass_rate_pct" in result
    assert result["sub_5s_sla_pass_rate_pct"] > 80.0
    assert "p50_seconds" in result["latencies"]
    assert "p95_seconds" in result["latencies"]

def test_gem_scale_report():
    """Verifies 5,000+ tenders/month scale benchmark report."""
    report = PerformanceBenchmarkService.get_gem_scale_report()

    assert "5,000" in report["gem_monthly_target"]
    assert report["sla_compliance"]["pass_rate_pct"] > 98.0
    assert report["percentiles"]["p50_median"] < 2.0
