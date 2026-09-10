from fastapi import APIRouter, Depends, Response
from sqlalchemy.orm import Session

from app.schemas.chat import ChatRequest, ChatResponse, TrackingRequest, TrackingResponse
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
