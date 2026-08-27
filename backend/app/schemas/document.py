from datetime import datetime
from pydantic import BaseModel
from uuid import UUID

class DocumentResponse(BaseModel):
    id: UUID
    requirement_id: UUID
    document_type: str
    original_filename: str
    mime_type: str
    file_size: int
    document_status: str
    uploaded_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }
