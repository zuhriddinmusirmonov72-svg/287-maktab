import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { FaUserGraduate, FaSyncAlt } from 'react-icons/fa';
import { FiMoreVertical, FiX, FiTrash2 } from 'react-icons/fi';

const Students = () => {
  const { students, addStudent, deleteStudent, groups } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    name: '', phone: '', group: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newStudent.name && newStudent.group) {
      addStudent(newStudent);
      setIsModalOpen(false);
      setNewStudent({ name: '', phone: '', group: '' });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Talabalar</h1>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="add-btn"
        >
          <span>+ Talaba qo'shish</span>
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="group-stat-card">
          <div style={{ color: '#6b7280', marginBottom: '8px' }}><FaUserGraduate size={20} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>Jami talabalar</p>
          <h3 className="stat-value">{students.length}</h3>
          <button style={{ position: 'absolute', top: '16px', right: '16px', color: '#9ca3af' }}><FiMoreVertical /></button>
        </div>
      </div>

      <div className="content-card">
        <div className="table-header">
          <h2 className="table-title">Barcha talabalar ro'yxati</h2>
          <div className="table-actions">
            <div className="search-bar" style={{ width: '250px' }}>
              <input type="text" placeholder="Qidirish" className="search-input" />
            </div>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>F.I.SH</th>
              <th>Telefon raqami</th>
              <th>Guruh</th>
              <th>Qo'shilgan sana</th>
              <th>Amallar</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? students.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.phone}</td>
                <td>{student.group}</td>
                <td>{student.createdAt}</td>
                <td>
                  <button onClick={() => deleteStudent(student.id)} style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}>
                    <FiTrash2 size={16} />
                  </button>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>
                  Hozircha talabalar yo'q.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={`right-drawer-overlay ${isModalOpen ? 'open' : ''}`} onClick={() => setIsModalOpen(false)}>
        <div className={`right-drawer ${isModalOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="drawer-title">Talaba qo'shish</h2>
              <button className="drawer-close" onClick={() => setIsModalOpen(false)}><FiX /></button>
            </div>
            
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>Yangi talaba ma'lumotlarini kiriting.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="form-group">
                <label className="form-label">F.I.SH</label>
                <input 
                  type="text" required placeholder="Talaba ismini kiriting"
                  value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})}
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefon raqami</label>
                <input 
                  type="text" required placeholder="+998 90 123 45 67"
                  value={newStudent.phone} onChange={e => setNewStudent({...newStudent, phone: e.target.value})}
                  className="form-input" 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Guruh</label>
                <select 
                  className="form-input" required
                  value={newStudent.group} onChange={e => setNewStudent({...newStudent, group: e.target.value})}
                >
                  <option value="" disabled>Guruhni tanlang</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.name}>{g.name} - {g.course}</option>
                  ))}
                </select>
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

export default Students;
