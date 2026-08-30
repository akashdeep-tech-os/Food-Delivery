import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  HiHome, HiShoppingBag, HiCubeTransparent, HiSquares2X2, HiUsers,
  HiCreditCard, HiTag, HiBell, HiCog6Tooth, HiArrowRightStartOnRectangle,
  HiChevronLeft, HiChevronRight
} from 'react-icons/hi2';
import { useState } from 'react';
import './Layout.css';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: HiHome },
  { path: '/orders', label: 'Orders', icon: HiShoppingBag },
  { path: '/foods', label: 'Foods', icon: HiCubeTransparent },
  { path: '/categories', label: 'Categories', icon: HiSquares2X2 },
  { path: '/users', label: 'Users', icon: HiUsers },
  { path: '/payments', label: 'Payments', icon: HiCreditCard },
  { path: '/promos', label: 'Promo Codes', icon: HiTag },
  { path: '/notifications', label: 'Notifications', icon: HiBell },
  { path: '/settings', label: 'Settings', icon: HiCog6Tooth },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h2 className="sidebar-logo">FoodAdmin</h2>}
        <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <HiChevronRight size={18} /> : <HiChevronLeft size={18} />}
        </button>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <button className="sidebar-logout" onClick={handleLogout}>
        <HiArrowRightStartOnRectangle size={20} />
        {!collapsed && <span>Logout</span>}
      </button>
    </aside>
  );
}
