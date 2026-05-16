import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { FiSearch, FiBell, FiMoon, FiChevronLeft } from 'react-icons/fi';
import { FaCalendarAlt } from 'react-icons/fa';

const Navbar = ({ toggleSidebar }) => {
  const { user, darkMode, toggleDarkMode } = useContext(AppContext);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="back-btn" onClick={toggleSidebar}>
          <FiChevronLeft size={18} />
        </button>
        <button className="nav-icon-btn">
          <FaCalendarAlt size={16} color="#6b7280" />
        </button>
        <button className="add-btn" style={{ marginLeft: '12px' }}>
          <span>+ Qo'shish</span>
          <span style={{ fontSize: '10px' }}>▼</span>
        </button>
        
        <div className="search-bar">
          <FiSearch className="search-icon" />
          <input type="text" placeholder="Qidirish..." className="search-input" />
        </div>
      </div>

      <div className="navbar-right">
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
          <span style={{ fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>O'zbekcha</span>
          <span style={{ fontSize: '10px', color: '#9ca3af' }}>▼</span>
        </div>
        
        <div className="nav-icons">
          <button className="nav-icon-btn notification-btn">
            <FiBell size={20} color="#4b5563" />
            <span className="notification-dot"></span>
          </button>
          <button className="nav-icon-btn" onClick={toggleDarkMode}>
            <FiMoon size={20} color={darkMode ? "#f3f4f6" : "#4b5563"} />
          </button>
        </div>

        <Link to="/dashboard/profile" className="profile-img">
          {user.photo ? (
            <img src={user.photo} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </Link>
      </div>
    </header>
  );
};

export default Navbar;
