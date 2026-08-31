import os
import re
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional, Union

logger = logging.getLogger(__name__)

# GeM Portal SLA Rules for Post-Award Payment
CRAC_PAYMENT_SLA_DAYS = 10  # GeM Mandate: Payment must be released within 10 days of CRAC generation
RBI_DELAY_INTEREST_RATE = 7.5  # 7.5% per annum penal interest rate on delayed buyer payments


def parse_datetime_input(dt_val: Union[datetime, str]) -> datetime:
    """Parses ISO string or datetime object into a UTC datetime object."""
    if isinstance(dt_val, datetime):
        if dt_val.tzinfo is None:
            return dt_val.replace(tzinfo=timezone.utc)
        return dt_val
    elif isinstance(dt_val, str):
        clean_str = dt_val.replace("Z", "+00:00").strip()
        try:
            dt = datetime.fromisoformat(clean_str)
            if dt.tzinfo is None:
                return dt.replace(tzinfo=timezone.utc)
            return dt
        except ValueError:
            # Fallback for YYYY-MM-DD format
            try:
                dt = datetime.strptime(dt_val[:10], "%Y-%m-%d")
                return dt.replace(tzinfo=timezone.utc)
            except Exception as e:
                logger.error(f"Failed to parse datetime string '{dt_val}': {e}")
                return datetime.now(timezone.utc)
    return datetime.now(timezone.utc)


def track_crac(
    delivery_date: Union[datetime, str],
    crac_upload_date: Union[datetime, str],
    order_amount: Optional[float] = None
) -> Dict[str, Any]:
    """
    Monitors Consignee Receipt and Acceptance Certificate (CRAC) issuance & payment release SLA.
    GeM Rule: Buyer must release payment within 10 calendar days of CRAC upload.
    Overdue payments incur penal interest @ RBI Repo Rate + 1% (7.5% p.a.).
    """
    d_date = parse_datetime_input(delivery_date)
    crac_date = parse_datetime_input(crac_upload_date)
    now = datetime.now(timezone.utc)

    # 10-day GeM payment SLA deadline
    payment_deadline = crac_date + timedelta(days=CRAC_PAYMENT_SLA_DAYS)

    if now > payment_deadline:
        overdue_days = (now - payment_deadline).days + 1
        
        # Calculate penal interest amount if order_amount is provided
        penal_interest_amount = 0.0
        if order_amount and order_amount > 0:
            # Interest = (Amount * Rate * Days) / (365 * 100)
            penal_interest_amount = round((order_amount * RBI_DELAY_INTEREST_RATE * overdue_days) / 36500.0, 2)

        return {
            "status": "overdue",
            "is_overdue": True,
            "overdue_days": overdue_days,
            "payment_deadline": payment_deadline.isoformat(),
            "crac_upload_date": crac_date.isoformat(),
            "delivery_date": d_date.isoformat(),
            "penalty": f"Interest @ RBI rate ({RBI_DELAY_INTEREST_RATE}% p.a.)",
            "penal_interest_amount": penal_interest_amount,
            "penal_interest_formatted": f"₹{penal_interest_amount:,.2f}",
            "warning": f"PAYMENT OVERDUE: Payment is {overdue_days} days past mandatory 10-day GeM CRAC SLA deadline."
        }
    else:
        remaining_days = (payment_deadline - now).days
        return {
            "status": "on_track",
            "is_overdue": False,
            "remaining_days": remaining_days,
            "payment_deadline": payment_deadline.isoformat(),
            "crac_upload_date": crac_date.isoformat(),
            "delivery_date": d_date.isoformat(),
            "message": f"Payment SLA on track. {remaining_days} days remaining before CRAC 10-day payment deadline."
        }


def simulate_pfms_payment(
    bid_id: str,
    amount: float,
    vendor_gstin: Optional[str] = None,
    vendor_bank_account: Optional[str] = None,
    ifsc_code: Optional[str] = None
) -> Dict[str, Any]:
    """
    Simulates Public Financial Management System (PFMS) Government Treasury payment disbursement API.
    Interoperable with Ministry of Finance PFMS e-P制度 treasury gateway.
    """
    clean_bid_id = str(bid_id or "GEM-BID-2026").strip()
    bid_hash = abs(hash(clean_bid_id)) % 1000000

    txn_id = f"PFMS-2026-TXN-{bid_hash:06d}"
    utr_number = f"UTR9988{bid_hash:06d}"
    now_iso = datetime.now(timezone.utc).isoformat()

    return {
        "status": "payment_initiated",
        "pfms_status": "SUCCESS_CREDITED",
        "bid_id": clean_bid_id,
        "transaction_id": txn_id,
        "utr_number": utr_number,
        "disbursed_amount": float(amount),
        "disbursed_amount_formatted": f"₹{amount:,.2f}",
        "vendor_gstin": vendor_gstin or "27AAACA12341Z5",
        "vendor_bank_account": vendor_bank_account or "XXXXXX9876",
        "ifsc_code": ifsc_code or "SBIN0001234",
        "treasury_code": "GOI-TREASURY-PFMS-01",
        "disbursement_timestamp": now_iso,
        "message": f"PFMS Payment of ₹{amount:,.2f} successfully initiated & credited via Treasury UTR '{utr_number}'."
    }


def get_post_award_lifecycle(
    bid_id: str,
    order_amount: float,
    delivery_date: Optional[Union[datetime, str]] = None,
    crac_date: Optional[Union[datetime, str]] = None
) -> Dict[str, Any]:
    """
    Generates complete 4-stage post-award procurement lifecycle tracking report for officer dashboard:
    Stage 1: AWARD_ISSUED (Contract Awarded)
    Stage 2: GOODS_DELIVERED (Consignee Delivery)
    Stage 3: CRAC_GENERATED (Consignee Receipt & Acceptance Certificate)
    Stage 4: PFMS_DISBURSED (Treasury Payment Settlement)
    """
    now = datetime.now(timezone.utc)
    
    # Default scenario dates if not provided
    d_dt = parse_datetime_input(delivery_date) if delivery_date else (now - timedelta(days=15))
    c_dt = parse_datetime_input(crac_date) if crac_date else (now - timedelta(days=12))

    crac_status = track_crac(d_dt, c_dt, order_amount=order_amount)
    pfms_status = simulate_pfms_payment(bid_id, order_amount)

    timeline = [
        {
            "stage": 1,
            "name": "AWARD_ISSUED",
            "label": "Contract Awarded & Order Generated",
            "completed": True,
            "timestamp": (c_dt - timedelta(days=20)).isoformat()
        },
        {
            "stage": 2,
            "name": "GOODS_DELIVERED",
            "label": "Consignee Goods Delivery Verified",
            "completed": True,
            "timestamp": d_dt.isoformat()
        },
        {
            "stage": 3,
            "name": "CRAC_GENERATED",
            "label": "CRAC Issued by Consignee",
            "completed": True,
            "timestamp": c_dt.isoformat(),
            "sla_info": crac_status
        },
        {
            "stage": 4,
            "name": "PFMS_DISBURSED",
            "label": "PFMS Treasury Payment Release",
            "completed": not crac_status.get("is_overdue", False),
            "payment_details": pfms_status
        }
    ]

    return {
        "status": "success",
        "bid_id": bid_id,
        "order_amount": order_amount,
        "order_amount_formatted": f"₹{order_amount:,.2f}",
        "crac_sla_status": crac_status,
        "pfms_payment_status": pfms_status,
        "lifecycle_timeline": timeline
    }
