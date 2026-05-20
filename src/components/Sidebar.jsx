import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaUsers, FaUserGraduate, FaGift, FaCog, FaBell, FaChevronLeft, FaBook, FaDoorOpen, FaUserTie, FaCoins, FaPaperPlane, FaGem } from 'react-icons/fa';

const Sidebar = ({ isOpen }) => {
  const [isManagementOpen, setIsManagementOpen] = useState(false);

  const navLinks = [
    { name: 'Asosiy', path: '/dashboard', icon: <FaHome size={18} />, end: true },
    { name: "O'qituvchilar", path: '/dashboard/teachers', icon: <FaUserGraduate size={18} /> },
    { name: 'Guruhlar', path: '/dashboard/groups', icon: <FaUsers size={18} /> },
    { name: 'Talabalar', path: '/dashboard/students', icon: <FaGem size={18} /> },
    { name: "Sovg'alar", path: '/dashboard/gifts', icon: <FaGift size={18} /> },
  ];

  return (
    <div style={{ display: 'flex', position: 'relative' }}>
      <div className={`sidebar ${!isOpen ? 'collapsed' : ''}`} style={{ position: 'relative', zIndex: 20 }}>
        <div className="sidebar-logo-container">
          <div className="sidebar-logo">
             <img src="https://najotedu.uz/favicon.ico" alt="logo" onError={(e) => {e.target.style.display='none'; e.target.parentElement.innerHTML='N'}} />
          </div>
          <h1 className="sidebar-title">NajotEdu</h1>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              data-tooltip={link.name}
            >
              {link.icon}
              <span className="nav-link-text">{link.name}</span>
            </NavLink>
          ))}
          
          <button 
            onClick={() => setIsManagementOpen(!isManagementOpen)} 
            className={`nav-link ${isManagementOpen ? 'active' : ''}`} 
            style={{ width: '100%' }}
            data-tooltip="Boshqarish"
          >
            <FaCog size={18} />
            <span className="nav-link-text">Boshqarish</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="alert-box">
            <div className="alert-indicator"></div>
            <div className="flex items-start gap-3">
              <div style={{ marginTop: '4px' }}>
                 <FaBell style={{ color: '#d97706' }} size={16} />
              </div>
              <div>
                <p className="alert-title">Obuna</p>
                <p className="alert-desc">Obunangiz tugagan</p>
              </div>
            </div>
            <button className="alert-btn">
               <span>↻</span> Obunani yangilash
            </button>
          </div>
        </div>
      </div>

      {isManagementOpen && (
        <div className="sidebar-submenu-overlay" onClick={() => setIsManagementOpen(false)}></div>
      )}
      <div className={`sidebar-submenu ${isManagementOpen ? 'open' : ''}`}>
         <div className="submenu-header">
            <button className="submenu-back" onClick={() => setIsManagementOpen(false)}>
              <FaChevronLeft size={12} />
            </button>
            <h3 className="submenu-title">Menu</h3>
         </div>
         <nav className="submenu-nav">
            <NavLink to="/dashboard/management?tab=Kurslar" className="submenu-link" onClick={() => setIsManagementOpen(false)}>
              <FaBook size={16} /> Kurslar
            </NavLink>
            <NavLink to="/dashboard/management?tab=Xonalar" className="submenu-link" onClick={() => setIsManagementOpen(false)}>
              <FaDoorOpen size={16} /> Xonalar
            </NavLink>
            <NavLink to="/dashboard/management?tab=Xodimlar" className="submenu-link" onClick={() => setIsManagementOpen(false)}>
              <FaUserTie size={16} /> Hodimlar
            </NavLink>
            <NavLink to="/dashboard/coin" className="submenu-link" onClick={() => setIsManagementOpen(false)}>
              <FaCoins size={16} /> Coin
            </NavLink>
            <NavLink to="/dashboard/messages" className="submenu-link" onClick={() => setIsManagementOpen(false)}>
              <FaPaperPlane size={16} /> Xabar Yuborish
            </NavLink>
         </nav>
      </div>
    </div>
  );
};

export default Sidebar;
