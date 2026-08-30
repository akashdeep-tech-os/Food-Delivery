from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.notification import Notification, NotificationRead
from app.schemas.notification import NotificationCreate, NotificationResponse
from app.utils.dependencies import get_current_user, require_admin
from app.utils.exceptions import NotFoundException

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationResponse])
def list_notifications(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    notifications = db.query(Notification).filter(
        or_(Notification.user_id == current_user.id, Notification.is_broadcast.is_(True))
    ).order_by(Notification.created_at.desc()).limit(50).all()
    notification_ids = [notification.id for notification in notifications]
    read_ids = {
        row.notification_id for row in db.query(NotificationRead).filter(
            NotificationRead.user_id == current_user.id,
            NotificationRead.notification_id.in_(notification_ids or [-1]),
        ).all()
    }
    return [NotificationResponse(
        id=notification.id,
        user_id=notification.user_id,
        title=notification.title,
        message=notification.message,
        type=notification.type,
        is_read=notification.is_read or notification.id in read_ids,
        is_broadcast=notification.is_broadcast,
        created_at=notification.created_at,
    ) for notification in notifications]


@router.get("/unread-count")
def unread_count(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    notifications = db.query(Notification).filter(
        or_(Notification.user_id == current_user.id, Notification.is_broadcast.is_(True)),
        Notification.is_read.is_(False),
    ).all()
    notification_ids = [notification.id for notification in notifications]
    read_ids = {
        row.notification_id for row in db.query(NotificationRead).filter(
            NotificationRead.user_id == current_user.id,
            NotificationRead.notification_id.in_(notification_ids or [-1]),
        ).all()
    }
    count = sum(notification.id not in read_ids for notification in notifications)
    return {"count": count}


@router.patch("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        or_(Notification.user_id == current_user.id, Notification.is_broadcast.is_(True)),
    ).first()
    if not notification:
        raise NotFoundException("Notification")
    if notification.is_broadcast:
        existing = db.query(NotificationRead).filter_by(
            notification_id=notification.id, user_id=current_user.id
        ).first()
        if not existing:
            db.add(NotificationRead(notification_id=notification.id, user_id=current_user.id))
    else:
        notification.is_read = True
    db.commit()
    return {"message": "Marked as read", "success": True}


@router.post("", response_model=NotificationResponse)
def create_notification(notification_data: NotificationCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    notification = Notification(**notification_data.model_dump())
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return NotificationResponse.model_validate(notification)
