import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { FaUsers, FaUserGraduate, FaSyncAlt } from 'react-icons/fa';
import { FiMoreVertical, FiX } from 'react-icons/fi';

const Groups = () => {
  const { groups, addGroup, toggleGroupStatus } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '', course: 'Backend', duration: '6 oy', time: '09:30', room: 'Autodesk', teacher: '', students: 0
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newGroup.name) {
      addGroup({
        ...newGroup,
        active: true,
      });
      setIsModalOpen(false);
      setNewGroup({ name: '', course: 'Backend', duration: '6 oy', time: '09:30', room: 'Autodesk', teacher: '', students: 0 });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Guruhlar</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="add-btn"
        >
          <span>+ Guruh qo'shish</span>
        </button>
      </div>

      <div className="group-tabs">
        <button className="group-tab-active">Guruhlar</button>
        <button className="group-tab-inactive">
           <FaArchive /> Arxiv
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="group-stat-card">
          <div style={{ color: '#6b7280', marginBottom: '8px' }}><FaUsers size={20} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>Jami guruhlar</p>
          <h3 className="stat-value">{groups.length}</h3>
          <button style={{ position: 'absolute', top: '16px', right: '16px', color: '#9ca3af' }}><FiMoreVertical /></button>
        </div>
        <div className="group-stat-card">
          <div style={{ color: '#6b7280', marginBottom: '8px' }}><FaUsers size={20} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>O'qituvchilar</p>
          <h3 className="stat-value">0</h3>
          <button style={{ position: 'absolute', top: '16px', right: '16px', color: '#9ca3af' }}><FiMoreVertical /></button>
        </div>
        <div className="group-stat-card">
          <div style={{ color: '#6b7280', marginBottom: '8px' }}><FaUserGraduate size={20} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>O'quvchilar</p>
          <h3 className="stat-value">0</h3>
          <div style={{ position: 'absolute', bottom: '16px', right: '16px', display: 'flex' }}>
             <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#1f2937', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white', zIndex: 3 }}>I</div>
             <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#f97316', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white', zIndex: 2, marginLeft: '-8px' }}>M</div>
             <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#ec4899', color: 'white', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid white', zIndex: 1, marginLeft: '-8px' }}>S</div>
          </div>
          <button style={{ position: 'absolute', top: '16px', right: '16px', color: '#9ca3af' }}><FiMoreVertical /></button>
        </div>
      </div>

      <div className="content-card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px', width: '128px' }}>Status</th>
                <th>Guruh nomi</th>
                <th>Kurs</th>
                <th>Davomiyligi</th>
                <th>Dars vaqti</th>
                <th>Xona</th>
                <th>O'qituvchi</th>
                <th>Talabalar</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}><FaSyncAlt style={{ cursor: 'pointer', display: 'inline' }} /></th>
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <tr key={group.id}>
                  <td style={{ paddingLeft: '24px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{group.name}</td>
                  <td>
                     <span className="badge-course">{group.course}</span>
                  </td>
                  <td>{group.duration}</td>
                  <td>
                     <div style={{ fontWeight: 'bold' }}>{group.time}</div>
                     <div style={{ fontSize: '10px', color: '#6b7280' }}>Du, Se, Chor, Pay, Ju</div>
                  </td>
                  <td>{group.room}</td>
                  <td>{group.teacher}</td>
                  <td>{group.students}</td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <button style={{ color: '#9ca3af' }}><FiMoreVertical /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className={`right-drawer-overlay ${isModalOpen ? 'open' : ''}`} onClick={() => setIsModalOpen(false)}>
        <div className={`right-drawer ${isModalOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="drawer-title">Guruh qo'shish</h2>
              <button className="drawer-close" onClick={() => setIsModalOpen(false)}><FiX /></button>
            </div>
            
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>Bu yerda siz yangi guruh qo'shishingiz mumkin.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="form-group">
                <label className="form-label">Guruh nomi</label>
                <input 
                  type="text" required placeholder="Guruh nomini kiriting"
                  value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">O'qituvchi ismini kiriting</label>
                <input 
                  type="text" placeholder="O'qituvchi ismini kiriting"
                  value={newGroup.teacher} onChange={e => setNewGroup({...newGroup, teacher: e.target.value})}
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

const FaArchive = () => (
  <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 448c0 17.7 14.3 32 32 32h384c17.7 0 32-14.3 32-32V160H32v288zm160-212c0-6.6 5.4-12 12-12h104c6.6 0 12 5.4 12 12v8c0 6.6-5.4 12-12 12H204c-6.6 0-12-5.4-12-12v-8zM480 32H32C14.3 32 0 46.3 0 64v48c0 8.8 7.2 16 16 16h480c8.8 0 16-7.2 16-16V64c0-17.7-14.3-32-32-32z"></path>
  </svg>
)

export default Groups;
