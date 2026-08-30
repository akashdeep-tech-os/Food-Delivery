from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserResponse, UserUpdate, PaginatedUsers
from app.utils.dependencies import require_admin
from app.utils.exceptions import NotFoundException

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=PaginatedUsers)
def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    role: UserRole | None = None,
    search: str | None = None,
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if search:
        query = query.filter(
            (User.name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
        )
    if is_active is not None:
        query = query.filter(User.is_active == is_active)

    total = query.count()
    pages = (total + limit - 1) // limit
    users = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return PaginatedUsers(
        users=[UserResponse.model_validate(u) for u in users],
        total=total, page=page, pages=pages
    )


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User")
    return UserResponse.model_validate(user)


@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User")

    update_data = user_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)
    return UserResponse.model_validate(user)


@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("User")

    user.is_active = False
    db.commit()
    return {"message": "User deactivated successfully", "success": True}
