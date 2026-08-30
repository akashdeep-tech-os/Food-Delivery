import { createContext, useEffect, useState, useCallback } from "react";
import { foodsAPI, categoriesAPI } from "../api";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
  const [cartItems, setCartItems] = useState({});
  const [foodList, setFoodList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFoods = useCallback(async (params = {}) => {
    try {
      const res = await foodsAPI.getAll({ limit: 100, is_available: true, ...params });
      setFoodList(res.data.foods);
    } catch (err) {
      console.error("Failed to fetch foods:", err);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoriesAPI.getAll({ is_active: true });
      setCategories(res.data);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    }
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([fetchFoods(), fetchCategories()]);
      setLoading(false);
    };
    loadInitialData();
  }, [fetchFoods, fetchCategories]);

  useEffect(() => {
    const saved = localStorage.getItem("cartItems");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object") {
        setCartItems(parsed);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: (prev[itemId] || 0) + 1 }));
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => {
      if (prev[itemId] <= 1) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: prev[itemId] - 1 };
    });
  };

  const clearCart = () => {
    setCartItems({});
    localStorage.removeItem("cartItems");
  };

  const getCartItemsCount = () => {
    return Object.values(cartItems).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        const itemInfo = foodList.find((product) => String(product.id) === String(item));
        if (itemInfo) {
          totalAmount += itemInfo.price * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  const getFoodById = (id) => {
    return foodList.find((food) => String(food.id) === String(id));
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    if (imagePath.startsWith("/")) return imagePath;
    return `/uploads/${imagePath}`;
  };

  const contextValue = {
    food_list: foodList,
    categories,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    clearCart,
    getCartItemsCount,
    getTotalCartAmount,
    getFoodById,
    getImageUrl,
    fetchFoods,
    fetchCategories,
    loading,
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};

export default StoreContextProvider;
