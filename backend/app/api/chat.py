from fastapi import APIRouter, Depends, Response, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.schemas.chat import ChatRequest, ChatResponse, TrackingRequest, TrackingResponse, TrackingBid, TrackingBidsResponse
from app.models.bid import Bid
from app.models.tender import Tender
from app.services.chat_service import answer_question
from app.db.database import get_db
from app.models.user import User
from app.services.auth_service import get_current_user
from app.services.chat_access import limit_requests, owned_application


router = APIRouter(prefix="/chat", tags=["Assistant"])


@router.post("", response_model=ChatResponse, dependencies=[Depends(limit_requests())])
async def chat(request: ChatRequest, response: Response, current_user: User = Depends(get_current_user)) -> ChatResponse:
    response.headers["Cache-Control"] = "no-store"
    answer, source, suggestions = await answer_question(
        message=request.message,
        history=request.history,
        user_role=current_user.role,
        language=request.language,
    )
    return ChatResponse(answer=answer, source=source, suggestions=suggestions)


@router.post("/track", response_model=TrackingResponse, dependencies=[Depends(limit_requests("tracking", 10))])
def track(request: TrackingRequest, response: Response,
          current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    bid = owned_application(db, request.reference, current_user)
    return tracking_status(bid)


@router.get("/bids", response_model=TrackingBidsResponse, dependencies=[Depends(limit_requests("bid_list", 60))])
def my_bids(response: Response, search: str = Query(default="", max_length=255),
            offset: int = Query(default=0, ge=0),
            current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.headers["Cache-Control"] = "no-store"
    query = db.query(Bid.id, Bid.status, Bid.officer_status, Bid.submitted_at, Bid.reviewed_at,
                     Tender.id.label("tender_id"), Tender.title.label("tender_title")).join(
        Tender, Tender.id == Bid.tender_id).filter(Bid.bidder_id == current_user.id)
    term = search.strip()
    if term:
        # Search text is literal, including SQL LIKE wildcard characters.
        term = term.replace("/", "//").replace("%", "/%").replace("_", "/_")
        query = query.filter(or_(Tender.id.ilike(f"%{term}%", escape="/"),
                                 Tender.title.ilike(f"%{term}%", escape="/")))
    rows = query.order_by(Bid.submitted_at.desc(), Bid.id.desc()).offset(offset).limit(21).all()
    return TrackingBidsResponse(items=[TrackingBid(**tracking_status(bid).model_dump(),
                                tender_id=bid.tender_id, tender_title=bid.tender_title) for bid in rows[:20]],
                                has_more=len(rows) > 20)


def tracking_status(bid):
    decision = (bid.officer_status or "").strip().lower()
    decisions = {
        "approved": "approved", "qualified": "approved", "rejected": "rejected",
        "disqualified": "rejected", "approved with deviation": "approved_with_deviation",
        "seek clarification": "clarification_needed", "clarification required": "clarification_needed",
    }
    status = decisions.get(decision)
    if not status:
        status = {"pending": "submitted", "documents_submitted": "under_review",
                  "compliant": "under_review", "non-compliant": "under_review",
                  "processing": "under_review", "under review": "under_review",
                  "seek clarification": "clarification_needed"}.get((bid.status or "").lower(), "unknown")
    action = ("respond_to_clarification" if status == "clarification_needed" else
              "check_decision" if status in {"approved", "rejected", "approved_with_deviation"} else
              "contact_support" if status == "unknown" else "check_documents")
    return TrackingResponse(reference=bid.id, status=status, submitted_at=bid.submitted_at,
                            reviewed_at=bid.reviewed_at, next_action=action)
