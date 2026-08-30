from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.promo import PromoCode
from app.schemas.promo import PromoCodeCreate, PromoCodeUpdate, PromoCodeResponse, PaginatedPromoCodes
from app.utils.dependencies import require_admin
from app.utils.exceptions import NotFoundException, ConflictException

router = APIRouter(prefix="/api/promos", tags=["promos"])


@router.get("", response_model=PaginatedPromoCodes)
def list_promos(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    is_active: bool | None = None,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    query = db.query(PromoCode)
    if is_active is not None:
        query = query.filter(PromoCode.is_active == is_active)

    total = query.count()
    pages = (total + limit - 1) // limit
    promos = query.order_by(PromoCode.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return PaginatedPromoCodes(
        promo_codes=[PromoCodeResponse.model_validate(p) for p in promos],
        total=total, page=page, pages=pages
    )


@router.get("/{promo_id}", response_model=PromoCodeResponse)
def get_promo(promo_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise NotFoundException("Promo code")
    return PromoCodeResponse.model_validate(promo)


@router.post("", response_model=PromoCodeResponse)
def create_promo(promo_data: PromoCodeCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    existing = db.query(PromoCode).filter(PromoCode.code == promo_data.code.upper()).first()
    if existing:
        raise ConflictException("Promo code already exists")

    promo = PromoCode(**promo_data.model_dump())
    promo.code = promo.code.upper()
    db.add(promo)
    db.commit()
    db.refresh(promo)
    return PromoCodeResponse.model_validate(promo)


@router.put("/{promo_id}", response_model=PromoCodeResponse)
def update_promo(promo_id: int, promo_data: PromoCodeUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise NotFoundException("Promo code")

    update_data = promo_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(promo, key, value)

    db.commit()
    db.refresh(promo)
    return PromoCodeResponse.model_validate(promo)


@router.delete("/{promo_id}")
def delete_promo(promo_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    promo = db.query(PromoCode).filter(PromoCode.id == promo_id).first()
    if not promo:
        raise NotFoundException("Promo code")

    db.delete(promo)
    db.commit()
    return {"message": "Promo code deleted successfully", "success": True}
