import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal, engine, Base
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.food import Food
from app.models.settings import AppSettings
from app.utils.security import get_password_hash


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        existing_admin = db.query(User).filter(User.email == "admin@fooddelivery.com").first()
        if not existing_admin:
            admin = User(
                name="Admin",
                email="admin@fooddelivery.com",
                password_hash=get_password_hash("admin123"),
                phone="1234567890",
                role=UserRole.ADMIN
            )
            db.add(admin)
            db.flush()
            print("Admin user created: admin@fooddelivery.com / admin123")

        categories_data = [
            ("Salad", 1), ("Rolls", 2), ("Deserts", 3), ("Sandwich", 4),
            ("Cake", 5), ("Pure Veg", 6), ("Pasta", 7), ("Noodles", 8)
        ]
        cat_images = {
            "Salad": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop",
            "Rolls": "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop",
            "Deserts": "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=300&fit=crop",
            "Sandwich": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop",
            "Cake": "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop",
            "Pure Veg": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop",
            "Pasta": "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop",
            "Noodles": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
        }
        cat_map = {}
        for i, (name, order) in enumerate(categories_data, start=1):
            existing = db.query(Category).filter(Category.name == name).first()
            if not existing:
                cat = Category(name=name, sort_order=order, image=cat_images.get(name, f"/uploads/menu_{i}.png"))
                db.add(cat)
                db.flush()
                cat_map[name] = cat.id
            else:
                cat_map[name] = existing.id

        foods_data = [
            ("Greek Salad", "Fresh vegetables with olives and feta cheese", 12.99, "Salad", "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop"),
            ("Veg Salad", "Mixed vegetables with vinaigrette dressing", 10.99, "Salad", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop"),
            ("Clover Salad", "Clover sprouts with lemon dressing", 11.99, "Salad", "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop"),
            ("Chicken Salad", "Grilled chicken with mixed greens", 13.99, "Salad", "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop"),
            ("Rolls", "Classic veg spring rolls", 8.99, "Rolls", "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&h=300&fit=crop"),
            ("Veg Rolls", "Vegetable wrapped in rice paper", 9.99, "Rolls", "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop"),
            ("Grilled Rolls", "Grilled vegetable wraps", 10.99, "Rolls", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop"),
            ("Chicken Rolls", "Grilled chicken wraps", 11.99, "Rolls", "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&h=300&fit=crop"),
            ("Vanilla Ice Cream", "Classic vanilla bean ice cream", 6.99, "Deserts", "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop"),
            ("Chocolate Cake", "Rich chocolate layer cake", 8.99, "Deserts", "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop"),
            ("Strawberry Parfait", "Fresh strawberries with cream", 7.99, "Deserts", "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop"),
            ("Mango Sorbet", "Tropical mango sorbet", 5.99, "Deserts", "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=400&h=300&fit=crop"),
            ("Club Sandwich", "Triple-decker club sandwich", 10.99, "Sandwich", "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop"),
            ("Grilled Cheese", "Classic grilled cheese sandwich", 7.99, "Sandwich", "https://images.unsplash.com/photo-1526434806706-32d45a73a283?w=400&h=300&fit=crop"),
            ("BLT Sandwich", "Bacon lettuce tomato sandwich", 9.99, "Sandwich", "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&h=300&fit=crop"),
            ("Veggie Sandwich", "Fresh vegetable sandwich", 8.99, "Sandwich", "https://images.unsplash.com/photo-1539252554453-80ab60449059?w=400&h=300&fit=crop"),
            ("Black Forest Cake", "Classic black forest gateau", 12.99, "Cake", "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop"),
            ("Red Velvet Cake", "Cream cheese frosted red velvet", 11.99, "Cake", "https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=400&h=300&fit=crop"),
            ("Pineapple Cake", "Fresh pineapple cake", 9.99, "Cake", "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&h=300&fit=crop"),
            ("Cheesecake", "New York style cheesecake", 10.99, "Cake", "https://images.unsplash.com/photo-1524351199678-941a57a3507f?w=400&h=300&fit=crop"),
            ("Butter Paneer", "Creamy paneer butter masala", 11.99, "Pure Veg", "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop"),
            ("Veg Biryani", "Fragrant vegetable biryani", 10.99, "Pure Veg", "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&h=300&fit=crop"),
            ("Dal Makhani", "Rich creamy lentil curry", 9.99, "Pure Veg", "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop"),
            ("Aloo Gobi", "Potato and cauliflower curry", 8.99, "Pure Veg", "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop"),
            ("Spaghetti Bolognese", "Classic Italian pasta", 12.99, "Pasta", "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=300&fit=crop"),
            ("Penne Arrabbiata", "Spicy tomato pasta", 10.99, "Pasta", "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?w=400&h=300&fit=crop"),
            ("Mac and Cheese", "Creamy baked mac and cheese", 9.99, "Pasta", "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=400&h=300&fit=crop"),
            ("Pesto Pasta", "Basil pesto with penne", 11.99, "Pasta", "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=300&fit=crop"),
            ("Hakka Noodles", "Indo-Chinese style noodles", 9.99, "Noodles", "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop"),
            ("Pad Thai", "Thai stir-fried noodles", 10.99, "Noodles", "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400&h=300&fit=crop"),
            ("Schezwan Noodles", "Spicy Schezwan sauce noodles", 8.99, "Noodles", "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=400&h=300&fit=crop"),
            ("Butter Noodles", "Creamy butter garlic noodles", 7.99, "Noodles", "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop"),
        ]

        for i, (name, desc, price, cat_name, image_url) in enumerate(foods_data, start=1):
            existing = db.query(Food).filter(Food.name == name).first()
            if not existing and cat_name in cat_map:
                food = Food(
                    name=name, description=desc, price=price,
                    category_id=cat_map[cat_name], is_available=True,
                    image=image_url
                )
                db.add(food)

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
        print("Seed completed successfully!")
        print("Categories:", len(categories_data))
        print("Food items:", len(foods_data))

    except Exception as e:
        db.rollback()
        print(f"Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
