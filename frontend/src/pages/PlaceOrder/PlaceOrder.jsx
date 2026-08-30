import React, { useContext, useState } from 'react'
import "./PlaceOrder.css"
import { StoreContext } from '../../context/StoreContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useLocation } from 'react-router-dom'
import { ordersAPI } from '../../api'

const PlaceOrder = () => {
  const { getTotalCartAmount, cartItems, clearCart } = useContext(StoreContext);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { promoCode, promoDiscount = 0 } = location.state || {};

  const [formData, setFormData] = useState({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    street: user?.address || '',
    city: '',
    state: '',
    zipcode: '',
    country: '',
    phone: user?.phone || '',
    specialInstructions: '',
    paymentMethod: 'cash',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const subtotal = getTotalCartAmount();
  const deliveryFee = subtotal === 0 ? 0 : 2;
  const total = subtotal + deliveryFee - promoDiscount;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cartEntries = Object.entries(cartItems).filter(([, qty]) => qty > 0);
    if (cartEntries.length === 0) {
      setError('Your cart is empty');
      return;
    }

    const deliveryAddress = [formData.street, formData.city, formData.state, formData.zipcode, formData.country]
      .filter(Boolean).join(', ');

    const orderData = {
      items: cartEntries.map(([id, qty]) => ({
        food_id: parseInt(id),
        quantity: qty,
      })),
      delivery_address: deliveryAddress,
      delivery_phone: formData.phone,
      delivery_name: `${formData.firstName} ${formData.lastName}`.trim(),
      special_instructions: formData.specialInstructions || null,
      promo_code: promoCode || null,
      payment_method: formData.paymentMethod || 'cash',
    };

    setSubmitting(true);
    try {
      const res = await ordersAPI.create(orderData);
      clearCart();
      navigate('/myorders', { state: { orderPlaced: true, orderId: res.data.id } });
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className='place-order' onSubmit={handleSubmit}>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input required name='firstName' type="text" placeholder='First Name' value={formData.firstName} onChange={handleChange} />
          <input required name='lastName' type="text" placeholder='Last Name' value={formData.lastName} onChange={handleChange} />
        </div>
        <input required name='email' type="email" placeholder='Email Address' value={user?.email || ''} disabled />
        <input required name='street' type="text" placeholder='Street' value={formData.street} onChange={handleChange} />
        <div className="multi-fields">
          <input required name='city' type="text" placeholder='City' value={formData.city} onChange={handleChange} />
          <input required name='state' type="text" placeholder='State' value={formData.state} onChange={handleChange} />
        </div>
        <div className="multi-fields">
          <input required name='zipcode' type="text" placeholder='Zip Code' value={formData.zipcode} onChange={handleChange} />
          <input required name='country' type="text" placeholder='Country' value={formData.country} onChange={handleChange} />
        </div>
        <input required name='phone' type="text" placeholder='Phone' value={formData.phone} onChange={handleChange} />
        <textarea name='specialInstructions' placeholder='Special Instructions (optional)' value={formData.specialInstructions} onChange={handleChange} style={{ marginTop: '15px', width: '100%', padding: '10px', border: '1px solid #c5c5c5', borderRadius: '4px', outlineColor: 'tomato', minHeight: '80px', resize: 'vertical' }} />
        <div style={{ marginTop: '15px' }}>
          <p className="title" style={{ fontSize: '14px', marginBottom: '8px' }}>Payment Method</p>
          <select name='paymentMethod' value={formData.paymentMethod} onChange={handleChange} style={{ width: '100%', padding: '10px', border: '1px solid #c5c5c5', borderRadius: '4px', outlineColor: 'tomato', fontSize: '14px' }}>
            <option value="cash">Cash on Delivery</option>
            <option value="card">Credit/Debit Card</option>
            <option value="upi">UPI</option>
            <option value="wallet">Digital Wallet</option>
          </select>
        </div>
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
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
          {error && <p style={{ color: 'red', fontSize: '13px', marginTop: '10px' }}>{error}</p>}
          <button type='submit' disabled={submitting}>
            {submitting ? "Placing Order..." : "PLACE ORDER"}
          </button>
        </div>
      </div>
    </form>
  );
}

export default PlaceOrder;
