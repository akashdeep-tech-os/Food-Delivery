import React, { useContext, useState } from 'react'
import "./navbar.css"
import { assets } from '../../assets/assets'
import { Link } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ setShowLogin }) => {
  const [menu, setMenu] = useState("Home");
  const { getCartItemsCount } = useContext(StoreContext);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className='navbar'>
      <Link to='/'><img src={assets.logo} alt="" className="logo" /></Link>
      <ul className="navbar-menu">
        <Link to='/' onClick={() => setMenu("Home")} className={menu === "Home" ? "active" : ""}>Home</Link>
        <a href='#explore-menu' onClick={() => setMenu("Menu")} className={menu === "Menu" ? "active" : ""}>Menu</a>
        <a href='#app-download' onClick={() => setMenu("Mobile-App")} className={menu === "Mobile-App" ? "active" : ""}>Mobile-App</a>
        <a href='#footer' onClick={() => setMenu("Contact-Us")} className={menu === "Contact-Us" ? "active" : ""}>Contact-Us</a>
      </ul>
      <div className="navbar-right">
        <div className="navbar-search-icon">
          <Link to='/cart'><img src={assets.basket_icon} alt="" /></Link>
          <div className={getCartItemsCount() === 0 ? "" : "dot"}></div>
        </div>
        {isAuthenticated ? (
          <div className="navbar-user">
            <p className="navbar-user-name">Hi, {user.name}</p>
            <div className="navbar-user-menu">
              <Link to="/myorders" onClick={() => setMenu("My Orders")}>My Orders</Link>
              <button onClick={logout} className="navbar-logout-btn">Logout</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowLogin(true)}>Sign In</button>
        )}
      </div>
    </div>
  )
}

export default Navbar
