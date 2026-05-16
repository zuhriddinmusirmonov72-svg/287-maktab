import { NavLink } from 'react-router-dom';
import { FaHome, FaUsers, FaUserGraduate, FaGift, FaCog, FaBell } from 'react-icons/fa';

const Sidebar = ({ isOpen }) => {
  const navLinks = [
    { name: 'Asosiy', path: '/dashboard', icon: <FaHome size={18} />, end: true },
    { name: "O'qituvchilar", path: '/dashboard/teachers', icon: <FaUserGraduate size={18} /> },
    { name: 'Guruhlar', path: '/dashboard/groups', icon: <FaUsers size={18} /> },
    { name: 'Talabalar', path: '/dashboard/students', icon: <FaUsers size={18} /> },
    { name: "Sovg'alar", path: '/dashboard/gifts', icon: <FaGift size={18} /> },
    { name: 'Boshqarish', path: '/dashboard/management', icon: <FaCog size={18} /> },
  ];

  return (
    <div className={`sidebar ${!isOpen ? 'collapsed' : ''}`}>
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
            title={!isOpen ? link.name : ''}
          >
            {link.icon}
            <span className="nav-link-text">{link.name}</span>
          </NavLink>
        ))}
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
  );
};

export default Sidebar;
