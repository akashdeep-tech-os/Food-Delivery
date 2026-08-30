from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.utils.dependencies import require_admin
from app.utils.exceptions import NotFoundException

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    is_active: bool | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Category)
    if is_active is not None:
        query = query.filter(Category.is_active == is_active)
    return query.order_by(Category.sort_order).all()


@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise NotFoundException("Category")
    return CategoryResponse.model_validate(category)


@router.post("", response_model=CategoryResponse)
def create_category(category_data: CategoryCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    category = Category(**category_data.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return CategoryResponse.model_validate(category)


@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(category_id: int, category_data: CategoryUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise NotFoundException("Category")

    update_data = category_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)
    return CategoryResponse.model_validate(category)


@router.delete("/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise NotFoundException("Category")

    # Categories may be referenced by historical menu records.
    category.is_active = False
    db.commit()
    return {"message": "Category deleted successfully", "success": True}
