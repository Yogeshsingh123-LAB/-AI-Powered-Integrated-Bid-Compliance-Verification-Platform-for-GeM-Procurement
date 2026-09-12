# BidVerify — Implementation Plan

This document outlines the phased roadmap from the current prototype (mock government APIs) to a production-ready deployment integrated with live government sandbox and production endpoints.

## Overview

BidVerify currently runs entirely on mock government APIs for safe local development and demonstrations. The architecture is built around a **swap-in adapter layer** so that business logic, scoring, and audit trails remain unchanged when live endpoints replace mocks.

The plan below is organised into four phases:

1. **Phase 1 — Prototype (current)**  
2. **Phase 2 — Sandbox Integration**  
3. **Phase 3 — Pilot with GeM Staging**  
4. **Phase 4 — Production Deployment**

---

## Phase 1 — Prototype (Current)

**Status:** Complete  
**Goal:** Demonstrate end-to-end bid compliance verification using mock APIs.

### Completed
- 6-step guided tender creation wizard.
- AI Tender Requirement Analyzer.
- Mock verification gateway for GST, PAN, Udyam, MCA21, EPFO, ESIC, Startup India, NSIC, Blacklist, and DigiLocker.
- Evidence-first AI view with explainable recommendations.
- Clarification and re-verification loop.
- Role-based workflows for Procurement Officer, Bidder, and Admin.
- MyGeM conversational assistant.
- Cartel Collusion Graph (Neo4j/NetworkX).
- Merkle Tree blockchain audit trail.
- Multi-language Indic OCR (English, Hindi, Gujarati, Marathi, Tamil, Bengali, Telugu).
- Mobile Officer App with one-tap approve/reject and Web Push alerts.
- Post-award tracking (CRAC 10-day payment SLA, PFMS simulation).

### Mock APIs Used
All government API calls are mocked under `/api/verify/...` and controlled by `GEM_USE_MOCK=true`.

---

## Phase 2 — Sandbox Integration

**Goal:** Replace mock APIs with official government sandbox endpoints through the adapter layer.

### Tasks
1. **Adapter Layer Finalisation**
   - Define a common interface for each verification provider.
   - Implement provider-specific adapters: `GSTNAdapter`, `PANAdapter`, `UdyamAdapter`, `DigiLockerAdapter`, `EPFOAdapter`, `ESICAdapter`, `MCAAdapter`, `BlacklistAdapter`.
   - Add environment-based switching (`GEM_USE_MOCK=false`).

2. **GSTN Sandbox v2.0**
   - Integrate with GSTN Sandbox v2.0 for GSTIN active status and return filings.
   - Use OAuth 2.0 credentials from the sandbox portal.

3. **NSDL PAN Verification**
   - Integrate with NSDL PAN verification API for legal name and status.

4. **Udyam API**
   - Integrate with Udyam registration verification API for MSME category and status.

5. **DigiLocker Consent Flow**
   - Implement DigiLocker consent-based document fetch.
   - Store consent artefacts in the audit trail.

6. **EPFO / ESIC**
   - Integrate with employer verification APIs for compliance and remittance status.

7. **MCA21**
   - Integrate with MCA21 for corporate incorporation status.

8. **Central Debarment Database**
   - Integrate with the blacklist registry for debarment checks.

9. **Testing**
   - Unit tests for each adapter.
   - Integration tests against sandbox endpoints.
   - Regression tests to ensure scoring and audit logic unchanged.

### Deliverables
- Working sandbox integrations for all providers.
- Adapter layer documented.
- Updated README and architecture diagram.

---

## Phase 3 — Pilot with GeM Staging

**Goal:** Pilot BidVerify alongside GeM staging environment with real procurement officers.

### Tasks
1. **GeM Staging Integration**
   - Obtain staging credentials for GeM API (mTLS + OAuth 2.0).
   - Integrate tender sync and bid submission report submission.

2. **Officer Onboarding**
   - Train procurement officers on override workflow and XAI explanations.
   - Collect feedback on false positives and false negatives.

3. **Mobile Officer App Beta**
   - Release beta to a limited set of officers.
   - Test Web Push alerts for time-sensitive tenders.

4. **Performance and Scalability**
   - Load test for high-volume tenders.
   - Autoscaling configuration for backend workers.
   - Queue-based processing for OCR and verification.

5. **Security Review**
   - DPDP compliance review.
   - Role-based access control audit.
   - Penetration testing.

### Deliverables
- Pilot report with metrics (time saved, accuracy, officer satisfaction).
- Bug fixes and refinements.
- Production readiness checklist.

---

## Phase 4 — Production Deployment

**Goal:** Full production rollout on GeM.

### Tasks
1. **Production API Integrations**
   - Switch all adapters to production endpoints.
   - Implement mTLS and OAuth 2.0 for GeM.

2. **High Availability**
   - Multi-region deployment.
   - Database replication and backup.
   - Disaster recovery plan.

3. **Monitoring and Alerting**
   - Prometheus + Grafana for metrics.
   - Alerting for verification failures and SLA breaches.

4. **Compliance and Audit**
   - Regular third-party security audits.
   - Immutable audit trail retention as per government norms.

5. **Scaling**
   - Horizontal scaling for OCR and verification workers.
   - Caching for frequently verified identifiers.

### Deliverables
- Production deployment.
- Operations runbook.
- SLA dashboard.

---

## Adapter Layer Design

The adapter layer abstracts each government API behind a common interface:

```python
class VerificationProvider:
    def verify(self, identifier: str) -> VerificationResult:
        ...
```

Each provider implements this interface. The business logic calls `VerificationProvider.verify()` without knowing whether the underlying implementation is mock, sandbox, or production.

Switch behaviour via environment variable:

```bash
GEM_USE_MOCK=true   # uses mock adapters
GEM_USE_MOCK=false  # uses live sandbox/production adapters
```

---

## Risks and Mitigation

| Risk | Mitigation |
| :--- | :--- |
| **Sandbox API rate limits** | Implement retry with exponential backoff and caching. |
| **Data privacy concerns** | Data minimisation, encryption, DPDP-compliant consent flow. |
| **False positives in cartel detection** | Calibrated thresholds + officer override. |
| **OCR errors** | Preprocessing + human review + multilingual models. |
| **High volume** | Queue-based processing + autoscaling. |

---

## Conclusion

This plan provides a clear, phased path from the current prototype to a production-ready BidVerify platform. The swap-in adapter layer ensures that business logic, scoring, and audit trails remain stable while underlying verification providers evolve from mocks to live government APIs.
