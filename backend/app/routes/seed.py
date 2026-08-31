from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.category import Category
from app.models.food import Food
from app.models.settings import AppSettings
from app.utils.security import get_password_hash, decode_access_token
from app.models.user import UserRole
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter(prefix="/api/seed", tags=["seed"])
security = HTTPBearer(auto_error=False)


def seed_data(db: Session):
    existing_admin = db.query(User).filter(User.email == "admin@fooddelivery.com").first()
    if not existing_admin:
        admin = User(
            name="Admin",
            email="admin@fooddelivery.com",
            password_hash=get_password_hash("admin123"),
            phone="1234567890",
            role=UserRole.ADMIN,
        )
        db.add(admin)
        db.flush()

    categories_data = [
        ("Salad", 1), ("Rolls", 2), ("Deserts", 3), ("Sandwich", 4),
        ("Cake", 5), ("Pure Veg", 6), ("Pasta", 7), ("Noodles", 8),
    ]
    cat_map = {}
    for i, (name, order) in enumerate(categories_data, start=1):
        existing = db.query(Category).filter(Category.name == name).first()
        if not existing:
            cat = Category(name=name, sort_order=order, image=f"/uploads/menu_{i}.png")
            db.add(cat)
            db.flush()
            cat_map[name] = cat.id
        else:
            cat_map[name] = existing.id

    foods_data = [
        ("Greek Salad", "Fresh vegetables with olives and feta cheese", 12.99, "Salad"),
        ("Veg Salad", "Mixed vegetables with vinaigrette dressing", 10.99, "Salad"),
        ("Clover Salad", "Clover sprouts with lemon dressing", 11.99, "Salad"),
        ("Chicken Salad", "Grilled chicken with mixed greens", 13.99, "Salad"),
        ("Rolls", "Classic veg spring rolls", 8.99, "Rolls"),
        ("Veg Rolls", "Vegetable wrapped in rice paper", 9.99, "Rolls"),
        ("Grilled Rolls", "Grilled vegetable wraps", 10.99, "Rolls"),
        ("Chicken Rolls", "Grilled chicken wraps", 11.99, "Rolls"),
        ("Vanilla Ice Cream", "Classic vanilla bean ice cream", 6.99, "Deserts"),
        ("Chocolate Cake", "Rich chocolate layer cake", 8.99, "Deserts"),
        ("Strawberry Parfait", "Fresh strawberries with cream", 7.99, "Deserts"),
        ("Mango Sorbet", "Tropical mango sorbet", 5.99, "Deserts"),
        ("Club Sandwich", "Triple-decker club sandwich", 10.99, "Sandwich"),
        ("Grilled Cheese", "Classic grilled cheese sandwich", 7.99, "Sandwich"),
        ("BLT Sandwich", "Bacon lettuce tomato sandwich", 9.99, "Sandwich"),
        ("Veggie Sandwich", "Fresh vegetable sandwich", 8.99, "Sandwich"),
        ("Black Forest Cake", "Classic black forest gateau", 12.99, "Cake"),
        ("Red Velvet Cake", "Cream cheese frosted red velvet", 11.99, "Cake"),
        ("Pineapple Cake", "Fresh pineapple cake", 9.99, "Cake"),
        ("Cheesecake", "New York style cheesecake", 10.99, "Cake"),
        ("Butter Paneer", "Creamy paneer butter masala", 11.99, "Pure Veg"),
        ("Veg Biryani", "Fragrant vegetable biryani", 10.99, "Pure Veg"),
        ("Dal Makhani", "Rich creamy lentil curry", 9.99, "Pure Veg"),
        ("Aloo Gobi", "Potato and cauliflower curry", 8.99, "Pure Veg"),
        ("Spaghetti Bolognese", "Classic Italian pasta", 12.99, "Pasta"),
        ("Penne Arrabbiata", "Spicy tomato pasta", 10.99, "Pasta"),
        ("Mac and Cheese", "Creamy baked mac and cheese", 9.99, "Pasta"),
        ("Pesto Pasta", "Basil pesto with penne", 11.99, "Pasta"),
        ("Hakka Noodles", "Indo-Chinese style noodles", 9.99, "Noodles"),
        ("Pad Thai", "Thai stir-fried noodles", 10.99, "Noodles"),
        ("Schezwan Noodles", "Spicy Schezwan sauce noodles", 8.99, "Noodles"),
        ("Butter Noodles", "Creamy butter garlic noodles", 7.99, "Noodles"),
    ]

    food_count = 0
    for i, (name, desc, price, cat_name) in enumerate(foods_data, start=1):
        existing = db.query(Food).filter(Food.name == name).first()
        if not existing and cat_name in cat_map:
            food = Food(
                name=name, description=desc, price=price,
                category_id=cat_map[cat_name], is_available=True,
                image=f"/uploads/food_{i}.png",
            )
            db.add(food)
            food_count += 1

    settings_data = [
        ("delivery_fee", "2.0", "Default delivery fee"),
        ("tax_rate", "0.08", "Tax rate (8%)"),
        ("min_order_amount", "5.0", "Minimum order amount"),
        ("max_delivery_distance", "10", "Max delivery distance in km"),
    ]
    for key, value, desc in settings_data:
        existing = db.query(AppSettings).filter(AppSettings.key == key).first()
        if not existing:
            db.add(AppSettings(key=key, value=value, description=desc))

    db.commit()
    return {
        "message": "Seed completed",
        "categories": len(categories_data),
        "foods_added": food_count,
        "settings": len(settings_data),
    }


@router.post("")
def seed_database(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    user_count = db.query(User).count()

    if user_count == 0:
        return seed_data(db)

    if credentials is None:
        raise HTTPException(status_code=401, detail="Admin auth required")

    token = credentials.credentials
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None or user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")

    return seed_data(db)
