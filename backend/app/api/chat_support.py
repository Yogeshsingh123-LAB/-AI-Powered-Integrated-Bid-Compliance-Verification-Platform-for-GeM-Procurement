"""Authenticated support workflow. Procurement records are never modified here."""
from datetime import datetime, timedelta, timezone
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, Field, ConfigDict
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.chat_support import SupportTicket, SupportMessage, SupportPresence
from app.models.user import User
from app.services.auth_service import get_current_user, require_role
from app.services.chat_access import limit_requests, owned_application


def no_cache(response: Response):
    response.headers["Cache-Control"] = "no-store"


router = APIRouter(prefix="/chat/support", tags=["Support"], dependencies=[Depends(no_cache)])
staff_only = require_role("ADMIN")


class TicketCreate(BaseModel):
    subject: str = Field(min_length=3, max_length=160)
    message: str = Field(min_length=3, max_length=2000)
    application_reference: UUID | None = None
    model_config = ConfigDict(str_strip_whitespace=True)


class MessageCreate(BaseModel):
    content: str = Field(min_length=1, max_length=2000)
    model_config = ConfigDict(str_strip_whitespace=True)


class TicketOut(BaseModel):
    id: UUID
    application_id: UUID | None
    subject: str
    status: str
    escalated_at: datetime | None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class MessageOut(BaseModel):
    id: UUID
    sender_kind: str
    content: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class StatusUpdate(BaseModel):
    status: Literal["open", "in_progress", "resolved"]


def now():
    return datetime.now(timezone.utc)


def get_ticket(db, reference, user, staff=False):
    query = db.query(SupportTicket).filter(SupportTicket.id == reference)
    if not staff:
        query = query.filter(SupportTicket.owner_id == user.id)
    ticket = query.first()
    if not ticket:
        raise HTTPException(404, "Ticket unavailable. Check the reference and signed-in account.")
    return ticket


@router.post("/tickets", response_model=TicketOut, status_code=201,
             dependencies=[Depends(limit_requests("ticket_create", 5))])
def create_ticket(payload: TicketCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.application_reference:
        owned_application(db, payload.application_reference, user)
    ticket = SupportTicket(owner_id=user.id, application_id=payload.application_reference, subject=payload.subject)
    db.add(ticket)
    db.flush()
    db.add(SupportMessage(ticket_id=ticket.id, sender_id=user.id, sender_kind="applicant", content=payload.message))
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/tickets/{reference}", response_model=TicketOut,
            dependencies=[Depends(limit_requests("ticket_read", 60))])
def read_ticket(reference: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_ticket(db, reference, user)


@router.post("/tickets/{reference}/escalate", response_model=TicketOut,
             dependencies=[Depends(limit_requests("ticket_write", 20))])
def escalate(reference: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ticket = get_ticket(db, reference, user)
    if ticket.status == "resolved":
        raise HTTPException(409, "This ticket is resolved. Create a new ticket if you still need help.")
    if not ticket.escalated_at:
        ticket.escalated_at = now()
        ticket.updated_at = now()
        db.commit()
    return ticket


@router.get("/tickets/{reference}/messages", response_model=list[MessageOut],
            dependencies=[Depends(limit_requests("messages_read", 60))])
def messages(reference: UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    get_ticket(db, reference, user)
    return read_messages(db, reference)


def read_messages(db, reference):
    rows = db.query(SupportMessage).filter(SupportMessage.ticket_id == reference).order_by(
        SupportMessage.created_at.desc(), SupportMessage.id.desc()).limit(100).all()
    return list(reversed(rows))


def add_message(db, reference, payload, user, staff=False):
    ticket = get_ticket(db, reference, user, staff)
    if ticket.status == "resolved":
        raise HTTPException(409, "This ticket is resolved. Create a new ticket if you still need help.")
    message = SupportMessage(ticket_id=ticket.id, sender_id=user.id,
                             sender_kind="agent" if staff else "applicant", content=payload.content)
    ticket.updated_at = now()
    if staff:
        ticket.agent_id = user.id
        ticket.status = "in_progress"
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


@router.post("/tickets/{reference}/messages", response_model=MessageOut,
             dependencies=[Depends(limit_requests("ticket_write", 20))])
def send_message(reference: UUID, payload: MessageCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return add_message(db, reference, payload, user)


@router.get("/availability")
def availability(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    online = db.query(SupportPresence).join(User, User.id == SupportPresence.user_id).filter(
        SupportPresence.seen_at >= now() - timedelta(seconds=60), User.is_active.is_(True),
        User.role == "ADMIN").first() is not None
    return {"available": online}


@router.post("/staff/presence")
def presence(user: User = Depends(staff_only), db: Session = Depends(get_db)):
    record = db.get(SupportPresence, user.id)
    if record:
        record.seen_at = now()
    else:
        db.add(SupportPresence(user_id=user.id, seen_at=now()))
    db.commit()
    return {"available": True}


@router.delete("/staff/presence", status_code=204)
def offline(user: User = Depends(staff_only), db: Session = Depends(get_db)):
    db.query(SupportPresence).filter(SupportPresence.user_id == user.id).delete()
    db.commit()


@router.get("/staff/tickets", response_model=list[TicketOut])
def queue(offset: int = 0, user: User = Depends(staff_only), db: Session = Depends(get_db)):
    if offset < 0:
        raise HTTPException(422, "Invalid offset")
    return db.query(SupportTicket).order_by(SupportTicket.updated_at.desc(), SupportTicket.id).offset(offset).limit(50).all()


@router.get("/staff/tickets/{reference}/messages", response_model=list[MessageOut])
def staff_messages(reference: UUID, user: User = Depends(staff_only), db: Session = Depends(get_db)):
    get_ticket(db, reference, user, staff=True)
    return read_messages(db, reference)


@router.get("/staff/tickets/{reference}", response_model=TicketOut)
def staff_ticket(reference: UUID, user: User = Depends(staff_only), db: Session = Depends(get_db)):
    return get_ticket(db, reference, user, staff=True)


@router.post("/staff/tickets/{reference}/messages", response_model=MessageOut,
             dependencies=[Depends(limit_requests("staff_write", 30))])
def staff_reply(reference: UUID, payload: MessageCreate, user: User = Depends(staff_only), db: Session = Depends(get_db)):
    return add_message(db, reference, payload, user, staff=True)


@router.patch("/staff/tickets/{reference}", response_model=TicketOut)
def staff_status(reference: UUID, payload: StatusUpdate, user: User = Depends(staff_only), db: Session = Depends(get_db)):
    ticket = get_ticket(db, reference, user, staff=True)
    ticket.status = payload.status
    ticket.agent_id = user.id
    ticket.updated_at = now()
    db.commit()
    return ticket
