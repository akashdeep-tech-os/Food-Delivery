import React, { useContext, useState } from "react";
import "./Carts.css";
import { StoreContext } from "../../context/StoreContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Carts = () => {
  const { cartItems, removeFromCart, getTotalCartAmount, getImageUrl, getFoodById } = useContext(StoreContext);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState("");

  const cartItemsList = Object.entries(cartItems)
    .filter(([, qty]) => qty > 0)
    .map(([id, qty]) => {
      const food = getFoodById(id);
      return food ? { ...food, quantity: qty } : null;
    })
    .filter(Boolean);

  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal === 0 ? 0 : 2;
  const total = subtotal + deliveryFee - promoDiscount;

  const handleCheckout = () => {
    if (!isAuthenticated) {
      return;
    }
    navigate('/order', { state: { promoCode, promoDiscount } });
  };

  return (
    <div className="cart">
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Items</p>
          <p>Title</p>
          <p>Price</p>
          <p>Quantity</p>
          <p>Total</p>
          <p>Remove</p>
        </div>
        <br />
        <hr />
        {cartItemsList.length === 0 && (
          <p style={{ padding: '20px', color: '#888', textAlign: 'center' }}>Your cart is empty</p>
        )}
        {cartItemsList.map((item) => (
          <div key={item.id}>
            <div className="cart-items-title cart-items-item">
              <img src={getImageUrl(item.image)} alt={item.name} />
              <p>{item.name}</p>
              <p>${item.price}</p>
              <p>{item.quantity}</p>
              <p>${item.price * item.quantity}</p>
              <p className="cross" onClick={() => removeFromCart(item.id)}>
                x
              </p>
            </div>
            <hr />
          </div>
        ))}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>SubTotal</p>
              <p>${subtotal.toFixed(2)}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${deliveryFee.toFixed(2)}</p>
            </div>
            {promoDiscount > 0 && (
              <>
                <hr />
                <div className="cart-total-details" style={{ color: 'green' }}>
                  <p>Promo Discount</p>
                  <p>-${promoDiscount.toFixed(2)}</p>
                </div>
              </>
            )}
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>${total.toFixed(2)}</b>
            </div>
          </div>
          <button onClick={handleCheckout}>
            {isAuthenticated ? "PROCEED TO CHECKOUT" : "SIGN IN TO CHECKOUT"}
          </button>
        </div>
        <div className="cart-promocode">
          <div>
            <p>If you have a promo code, Enter it Here</p>
            <div className="cart-promocode-input">
              <input
                type="text"
                placeholder="Promo Code"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
              />
              <button onClick={() => {
                setPromoMsg(promoCode ? "Promo code will be applied at checkout" : "Enter a promo code");
                setPromoDiscount(0);
              }}>Submit</button>
            </div>
            {promoMsg && <p style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>{promoMsg}</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Carts;
