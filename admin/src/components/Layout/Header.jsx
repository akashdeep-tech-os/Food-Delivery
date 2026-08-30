import { useAuthStore } from '../../store/authStore';
import { HiBell } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { notificationsAPI } from '../../api';
import './Layout.css';

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await notificationsAPI.getUnreadCount();
        setUnreadCount(data.count);
      } catch (err) {
        // silent poll failure
        void err;
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">Admin Panel</h1>
      </div>
      <div className="header-right">
        <button className="header-icon-btn" onClick={() => navigate('/notifications')}>
          <HiBell size={20} />
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </button>
        <div className="header-user">
          <div className="header-avatar">{user?.name?.charAt(0) || 'A'}</div>
          <span className="header-username">{user?.name || 'Admin'}</span>
        </div>
      </div>
    </header>
  );
}
