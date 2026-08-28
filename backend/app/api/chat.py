from fastapi import APIRouter

from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import answer_question


router = APIRouter(prefix="/chat", tags=["Assistant"])


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    answer, source, suggestions = await answer_question(
        message=request.message,
        history=request.history,
        user_role=request.user_role,
    )
    return ChatResponse(answer=answer, source=source, suggestions=suggestions)
