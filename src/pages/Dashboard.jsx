import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { FaUserGraduate, FaUsers, FaCreditCard, FaUserTimes, FaPauseCircle, FaArchive, FaChevronDown } from 'react-icons/fa';

const StatCard = ({ icon, title, value }) => (
  <div className="stat-card">
    <div className="stat-icon">
      {icon}
    </div>
    <p className="stat-title">{title}</p>
    <h3 className="stat-value">{value}</h3>
  </div>
);

const Accordion = ({ title }) => (
  <div className="accordion">
    <span className="accordion-title">{title}</span>
    <FaChevronDown className="accordion-icon" />
  </div>
);

const Dashboard = () => {
  const { user } = useContext(AppContext);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Salom, {user.name}!</h1>
        <p className="page-subtitle">NajotEdu platformasiga xush kelibsiz!</p>
      </div>

      <div className="stats-grid">
        <StatCard icon={<FaUserGraduate size={24} />} title="Faol talabalar" value="52" />
        <StatCard icon={<FaUsers size={24} />} title="Guruhlar" value="23" />
        <StatCard icon={<FaCreditCard size={24} />} title="Joriy oy to'lovlar" value="0" />
        <StatCard icon={<FaUserTimes size={24} />} title="Qarzdorlar" value="104" />
        <StatCard icon={<FaPauseCircle size={24} />} title="Muzlatilganlar" value="0" />
        <StatCard icon={<FaArchive size={24} />} title="Arxivdagilar" value="23" />
      </div>

      <div style={{ width: '100%' }}>
        <Accordion title="Joriy oy uchun to'lovlar" />
        <Accordion title="Yillik Foyda" />
        <Accordion title="Dars jadvali" />
      </div>
    </div>
  );
};

export default Dashboard;
