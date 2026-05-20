import { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { FiArrowLeft, FiTrash2, FiX, FiUser, FiClock, FiBook, FiMapPin } from 'react-icons/fi';
import { FaUsers, FaUserGraduate, FaChalkboardTeacher } from 'react-icons/fa';

const DAYS = ['Du', 'Se', 'Chor', 'Pay', 'Ju', 'Sha', 'Yak'];

const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { groups, students, addStudent, deleteStudent, toggleGroupStatus } = useContext(AppContext);
  
  const group = groups.find(g => g.id === Number(id));
  
  const [activeTab, setActiveTab] = useState('talabalar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({ name: '', phone: '' });

  if (!group) {
    return (
      <div className="page-container" style={{ textAlign: 'center', paddingTop: '80px' }}>
        <h2 style={{ color: '#6b7280' }}>Guruh topilmadi</h2>
        <button className="btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/dashboard/groups')}>
          Orqaga
        </button>
      </div>
    );
  }

  const groupStudents = students.filter(s => s.group === group.name);

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (newStudent.name && newStudent.phone) {
      addStudent({ ...newStudent, group: group.name });
      setNewStudent({ name: '', phone: '' });
      setIsModalOpen(false);
    }
  };

  const tabs = [
    { key: 'talabalar', label: "O'quvchilar" },
    { key: 'jadval', label: 'Jadval' },
    { key: 'haqqida', label: "Guruh haqida" },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/dashboard/groups')}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#f3f4f6', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', border: 'none',
            color: '#374151', flexShrink: 0
          }}
        >
          <FiArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ marginBottom: '2px' }}>{group.name}</h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>{group.course} • {group.duration}</p>
        </div>
        <button
          onClick={() => toggleGroupStatus(group.id)}
          className={`status-switch ${group.active ? 'active' : 'inactive'}`}
        >
          <span className="switch-knob"></span>
        </button>
        <span className={`status-label ${group.active ? 'active' : 'inactive'}`}>
          {group.active ? 'FAOL' : 'FAOL EMAS'}
        </span>
      </div>

      {/* Stat Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="group-stat-card">
          <div style={{ color: '#7c3aed', marginBottom: '8px' }}><FaUserGraduate size={22} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>Talabalar</p>
          <h3 className="stat-value">{groupStudents.length}</h3>
        </div>
        <div className="group-stat-card">
          <div style={{ color: '#3b82f6', marginBottom: '8px' }}><FaChalkboardTeacher size={22} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>O'qituvchi</p>
          <h3 className="stat-value" style={{ fontSize: '18px' }}>{group.teacher || '—'}</h3>
        </div>
        <div className="group-stat-card">
          <div style={{ color: '#f59e0b', marginBottom: '8px' }}><FiClock size={22} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>Dars vaqti</p>
          <h3 className="stat-value" style={{ fontSize: '18px' }}>{group.time}</h3>
        </div>
        <div className="group-stat-card">
          <div style={{ color: '#10b981', marginBottom: '8px' }}><FiMapPin size={22} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>Xona</p>
          <h3 className="stat-value" style={{ fontSize: '18px' }}>{group.room || '—'}</h3>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid #f3f4f6', marginBottom: '24px' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              fontWeight: 600,
              fontSize: '14px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: activeTab === tab.key ? '#7c3aed' : '#6b7280',
              borderBottom: activeTab === tab.key ? '2px solid #7c3aed' : '2px solid transparent',
              marginBottom: '-2px',
              transition: 'all 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Talabalar */}
      {activeTab === 'talabalar' && (
        <div className="content-card">
          <div className="table-header">
            <h2 className="table-title">O'quvchilar ro'yxati</h2>
            <button className="add-btn" onClick={() => setIsModalOpen(true)}>
              + Talaba qo'shish
            </button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>F.I.SH</th>
                <th>Telefon raqami</th>
                <th>Qo'shilgan sana</th>
                <th>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {groupStudents.length > 0 ? groupStudents.map((student, i) => (
                <tr key={student.id}>
                  <td>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{student.name}</td>
                  <td>{student.phone}</td>
                  <td>{student.createdAt}</td>
                  <td>
                    <button
                      onClick={() => deleteStudent(student.id)}
                      style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    Bu guruhda hali talaba yo'q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Jadval */}
      {activeTab === 'jadval' && (
        <div className="content-card">
          <h2 className="table-title" style={{ marginBottom: '24px' }}>Dars Jadvali</h2>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {DAYS.map(day => {
              const isActive = ['Du', 'Se', 'Chor', 'Pay', 'Ju'].includes(day);
              return (
                <div
                  key={day}
                  style={{
                    width: '80px', height: '80px',
                    borderRadius: '12px',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: '4px',
                    background: isActive ? '#7c3aed' : '#f3f4f6',
                    color: isActive ? 'white' : '#9ca3af',
                    fontWeight: 600,
                    fontSize: '14px',
                  }}
                >
                  <span>{day}</span>
                  {isActive && <span style={{ fontSize: '11px', opacity: 0.85 }}>{group.time}</span>}
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: '32px', padding: '20px', background: '#f9fafb', borderRadius: '12px' }}>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Dars davomiyligi</p>
                <p style={{ fontWeight: 700 }}>{group.duration}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Dars vaqti</p>
                <p style={{ fontWeight: 700 }}>{group.time}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Xona</p>
                <p style={{ fontWeight: 700 }}>{group.room || '—'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Guruh haqida */}
      {activeTab === 'haqqida' && (
        <div className="content-card">
          <h2 className="table-title" style={{ marginBottom: '24px' }}>Guruh ma'lumotlari</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Guruh nomi', value: group.name, icon: <FaUsers /> },
              { label: 'Kurs', value: group.course, icon: <FiBook /> },
              { label: "O'qituvchi", value: group.teacher || '—', icon: <FaChalkboardTeacher /> },
              { label: 'Davomiyligi', value: group.duration, icon: <FiClock /> },
              { label: 'Xona', value: group.room, icon: <FiMapPin /> },
              { label: 'Dars vaqti', value: group.time, icon: <FiClock /> },
            ].map(item => (
              <div key={item.label} style={{ padding: '16px', background: '#f9fafb', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ color: '#7c3aed', fontSize: '18px' }}>{item.icon}</div>
                <div>
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '2px' }}>{item.label}</p>
                  <p style={{ fontWeight: 600, fontSize: '15px' }}>{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Student Drawer */}
      <div className={`right-drawer-overlay ${isModalOpen ? 'open' : ''}`} onClick={() => setIsModalOpen(false)}>
        <div className={`right-drawer ${isModalOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="drawer-header">
            <h2 className="drawer-title">Talaba qo'shish</h2>
            <button className="drawer-close" onClick={() => setIsModalOpen(false)}><FiX /></button>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>
            <strong>{group.name}</strong> guruhiga yangi talaba qo'shing.
          </p>
          <form onSubmit={handleAddStudent} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="form-group">
              <label className="form-label">F.I.SH</label>
              <input
                type="text" required placeholder="Talaba to'liq ismi"
                value={newStudent.name} onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Telefon raqami</label>
              <input
                type="text" required placeholder="+998 90 123 45 67"
                value={newStudent.phone} onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                className="form-input"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ width: '48%' }}>Bekor qilish</button>
              <button type="submit" className="btn-primary" style={{ width: '48%' }}>Saqlash</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GroupDetails;
