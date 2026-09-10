from typing import Literal
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=12)
    user_role: str | None = Field(default=None, max_length=30)
    language: Literal["auto", "en", "hi", "hinglish", "bn", "ta", "te", "mr", "gu", "kn", "ml", "pa"] = "auto"


class ChatResponse(BaseModel):
    answer: str
    source: Literal["ai", "ai_web", "knowledge_base"]
    suggestions: list[str] = Field(default_factory=list)


class TrackingRequest(BaseModel):
    reference: UUID


class TrackingResponse(BaseModel):
    reference: UUID
    status: Literal["submitted", "under_review", "clarification_needed", "approved", "rejected", "approved_with_deviation", "unknown"]
    submitted_at: datetime
    reviewed_at: datetime | None = None
    next_action: Literal["check_documents", "respond_to_clarification", "check_decision", "contact_support"]
