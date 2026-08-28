from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatMessage] = Field(default_factory=list, max_length=12)
    user_role: str | None = Field(default=None, max_length=30)


class ChatResponse(BaseModel):
    answer: str
    source: Literal["ai", "ai_web", "knowledge_base"]
    suggestions: list[str] = Field(default_factory=list)
