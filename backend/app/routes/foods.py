from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.food import Food
from app.models.category import Category
from app.schemas.food import FoodCreate, FoodUpdate, FoodResponse, FoodWithCategory, PaginatedFoods
from app.utils.dependencies import require_admin
from app.utils.exceptions import NotFoundException

router = APIRouter(prefix="/api/foods", tags=["foods"])


@router.get("", response_model=PaginatedFoods)
def list_foods(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: int | None = None,
    search: str | None = None,
    is_available: bool | None = None,
    is_featured: bool | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Food).options(joinedload(Food.category))

    if category_id:
        query = query.filter(Food.category_id == category_id)
    if search:
        query = query.filter(Food.name.ilike(f"%{search}%"))
    if is_available is not None:
        query = query.filter(Food.is_available == is_available)
    if is_featured is not None:
        query = query.filter(Food.is_featured == is_featured)

    total = query.count()
    pages = (total + limit - 1) // limit
    foods = query.offset((page - 1) * limit).limit(limit).all()

    result = []
    for food in foods:
        food_dict = FoodWithCategory(
            **{k: v for k, v in food.__dict__.items() if k != "_sa_instance_state"},
            category_name=food.category.name if food.category else None
        )
        result.append(food_dict)

    return PaginatedFoods(foods=result, total=total, page=page, pages=pages)


@router.get("/{food_id}", response_model=FoodWithCategory)
def get_food(food_id: int, db: Session = Depends(get_db)):
    food = db.query(Food).options(joinedload(Food.category)).filter(Food.id == food_id).first()
    if not food:
        raise NotFoundException("Food")
    return FoodWithCategory(
        **{k: v for k, v in food.__dict__.items() if k != "_sa_instance_state"},
        category_name=food.category.name if food.category else None
    )


@router.post("", response_model=FoodResponse)
def create_food(food_data: FoodCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    category = db.query(Category).filter(Category.id == food_data.category_id).first()
    if not category:
        raise NotFoundException("Category")

    food = Food(**food_data.model_dump())
    db.add(food)
    db.commit()
    db.refresh(food)
    return FoodResponse.model_validate(food)


@router.put("/{food_id}", response_model=FoodResponse)
def update_food(food_id: int, food_data: FoodUpdate, db: Session = Depends(get_db), _=Depends(require_admin)):
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        raise NotFoundException("Food")

    update_data = food_data.model_dump(exclude_unset=True)
    if "category_id" in update_data:
        category = db.query(Category).filter(Category.id == update_data["category_id"]).first()
        if not category:
            raise NotFoundException("Category")
    for key, value in update_data.items():
        setattr(food, key, value)

    db.commit()
    db.refresh(food)
    return FoodResponse.model_validate(food)


@router.delete("/{food_id}")
def delete_food(food_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        raise NotFoundException("Food")

    # Keep historical order items valid; hide the menu item instead of deleting it.
    food.is_available = False
    db.commit()
    return {"message": "Food deleted successfully", "success": True}
