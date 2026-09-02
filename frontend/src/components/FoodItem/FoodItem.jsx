import React, { useContext, useState } from "react";
import "./FoodItem.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";

const FALLBACK_IMAGE = "https://placehold.co/400x300/f97316/white?text=Food";

const FoodItem = ({ id, name, price, description, image }) => {
  const { cartItems, addToCart, removeFromCart, getImageUrl } = useContext(StoreContext);
  const [imgSrc, setImgSrc] = useState(getImageUrl(image));

  return (
    <div className="food-item">
      <div className="food-item-container">
        <img className="food-item-image" src={imgSrc || FALLBACK_IMAGE} alt={name} onError={() => setImgSrc(FALLBACK_IMAGE)} />
        {
          !cartItems[id]
            ? <img className="add" onClick={() => addToCart(id)} src={assets.add_icon_white} alt="" />
            : <div className="food-item-counter">
              <img onClick={() => removeFromCart(id)} src={assets.remove_icon_red} alt="" />
              <p>{cartItems[id]}</p>
              <img onClick={() => addToCart(id)} src={assets.add_icon_green} alt="" />
            </div>
        }
      </div>
      <div className="food-item-info">
        <div className="food-item-name-rating">
          <p>{name}</p>
          <img src={assets.rating_starts} alt="" />
        </div>
        <p className="food-item-desc">{description}</p>
        <p className="food-item-price">${price}</p>
      </div>
    </div>
  );
};

export default FoodItem;
