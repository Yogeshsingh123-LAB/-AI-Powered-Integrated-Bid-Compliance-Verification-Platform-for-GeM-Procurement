# Bid Zee — Test Mock Datasets

This directory contains standalone, reproducible test datasets and matching PDF/PNG certificates for Bid Zee verification testing.

> [!IMPORTANT]
> These files are for manual testing and explicit dataset imports ONLY. They are NOT automatically seeded into the application database on normal startup.

## Datasets Available

1. **`bidder_01` — Acme Tech Solutions Pvt Ltd**
   - PAN: `AAPCS1234M`
   - GSTIN: `27AAPCS1234M1Z5`
   - Udyam: `UDYAM-MH-12-0012345`
   - Case: Fully Compliant (100% Match)

2. **`bidder_02` — Zenith Energy Services Pvt Ltd**
   - PAN: `BZXPV9876K`
   - GSTIN: `07BZXPV9876K1Z9`
   - Udyam: `UDYAM-DL-07-0098765`
   - Case: EPFO Name Variation Warning

3. **`bidder_03` — Apex Infra Logistics Pvt Ltd**
   - PAN: `CKLPA4321R`
   - GSTIN: `33CKLPA4321R1Z2`
   - Udyam: `UDYAM-TN-33-0043210`
   - Case: Missing OEM Form

## How to Import a Dataset

To import a test dataset for a specific logged-in user, run:
```bash
python scripts/import_mock_dataset.py --user-email banti@example.com --dataset bidder_01
```
