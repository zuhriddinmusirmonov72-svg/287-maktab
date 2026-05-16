import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiEye, FiX, FiUploadCloud } from 'react-icons/fi';

const Teachers = () => {
  const { teachers, addTeacher, deleteTeacher } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeacher, setNewTeacher] = useState({
    name: '', phone: '+998', email: '', birthDate: '', group: '', gender: 'Erkak'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTeacher.name) {
      addTeacher({
        ...newTeacher,
        address: 'Tashkent'
      });
      setIsModalOpen(false);
      setNewTeacher({ name: '', phone: '+998', email: '', birthDate: '', group: '', gender: 'Erkak' });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">O'qituvchilar</h1>
          <p className="page-subtitle" style={{ maxWidth: '600px', marginTop: '8px' }}>
            Ushbu sahifada siz o'qituvchilar ro'yxatini va ularning ma'lumotlarini topasiz. Har bir o'qituvchining ismi, fanlari va aloqa ma'lumotlari keltirilgan.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="add-btn"
        >
          <span>+ O'qituvchi qo'shish</span>
        </button>
      </div>

      <div className="content-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="toolbar-btn">
              <FiFilter /> Filters
            </button>
            <button className="toolbar-btn">Arxiv</button>
          </div>
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Search" className="search-input" />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '48px', paddingLeft: '24px' }}>
                  <input type="checkbox" />
                </th>
                <th>NOMI</th>
                <th>GURUH</th>
                <th>TELEFON RAQAMLARI</th>
                <th>EMAIL</th>
                <th>MANZIL</th>
                <th>YARATILGAN SANA</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>AMALLAR</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td style={{ paddingLeft: '24px' }}>
                    <input type="checkbox" />
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#4f46e5', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                        {teacher.name.substring(0, 2).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: '500' }}>{teacher.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <span className="course-badge" style={{ backgroundColor: '#f3f4f6' }}>{teacher.group}</span>
                    </div>
                  </td>
                  <td>{teacher.phone}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.address}</td>
                  <td>{teacher.date || teacher.createdAt}</td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', color: '#7c3aed' }}>
                      <button><FiEye size={16} /></button>
                      <button onClick={() => deleteTeacher(teacher.id)} style={{ color: '#6b7280' }}><FiTrash2 size={16} /></button>
                      <button><FiEdit2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button className="toolbar-btn" style={{ fontSize: '12px' }}>&larr; Previous</button>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, '...', 8, 9, 10].map((page, i) => (
              <button 
                key={i} 
                className={`page-btn ${page === 1 ? 'active' : ''}`}
                style={page === '...' ? { pointerEvents: 'none', backgroundColor: 'transparent' } : {}}
              >
                {page}
              </button>
            ))}
          </div>
          <button className="toolbar-btn" style={{ fontSize: '12px' }}>Next &rarr;</button>
        </div>
      </div>

      {isModalOpen && (
        <div className="right-drawer-overlay">
          <div className="right-drawer">
            <div className="drawer-header">
              <h2 className="drawer-title">O'qituvchi qo'shish</h2>
              <button className="drawer-close" onClick={() => setIsModalOpen(false)}><FiX /></button>
            </div>
            
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>Bu yerda siz yangi o'qituvchi qo'shishingiz mumkin.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              
              <div className="form-group">
                <label className="form-label">Telefon raqam</label>
                <input type="text" value={newTeacher.phone} onChange={e => setNewTeacher({...newTeacher, phone: e.target.value})} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Mail</label>
                <div style={{ position: 'relative' }}>
                   <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af' }}>✉</span>
                   <input type="email" placeholder="Elektron pochtani kiriting" value={newTeacher.email} onChange={e => setNewTeacher({...newTeacher, email: e.target.value})} className="form-input" style={{ paddingLeft: '36px' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">O'qituvchi FIO</label>
                <input type="text" required placeholder="Ma'lumotni kiriting" value={newTeacher.name} onChange={e => setNewTeacher({...newTeacher, name: e.target.value})} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Tug'ilgan sanasi</label>
                <div style={{ position: 'relative' }}>
                   <span style={{ position: 'absolute', left: '12px', top: '10px', color: '#9ca3af' }}>📅</span>
                   <input type="text" placeholder="01.03.1990" value={newTeacher.birthDate} onChange={e => setNewTeacher({...newTeacher, birthDate: e.target.value})} className="form-input" style={{ paddingLeft: '36px' }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Guruh</label>
                <input type="text" placeholder="Guruhlarni tanlang" value={newTeacher.group} onChange={e => setNewTeacher({...newTeacher, group: e.target.value})} className="form-input" />
              </div>

              <div className="form-group">
                <label className="form-label">Jinsi</label>
                <div style={{ display: 'flex', gap: '24px', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <input type="radio" name="gender" checked={newTeacher.gender === 'Erkak'} onChange={() => setNewTeacher({...newTeacher, gender: 'Erkak'})} /> Erkak
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                    <input type="radio" name="gender" checked={newTeacher.gender === 'Ayol'} onChange={() => setNewTeacher({...newTeacher, gender: 'Ayol'})} /> Ayol
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Surati</label>
                <div style={{ border: '1px dashed #d1d5db', borderRadius: '8px', padding: '32px 16px', textAlign: 'center', cursor: 'pointer' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#f3e8ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px auto' }}>
                    <FiUploadCloud size={20} />
                  </div>
                  <p style={{ fontSize: '14px', marginBottom: '4px' }}><span style={{ color: '#7c3aed' }}>Click to upload</span> or drag and drop</p>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>JPG or PNG (max. 800x800px)</p>
                </div>
              </div>

              <div style={{ textAlign: 'right', marginBottom: '24px' }}>
                <button type="button" style={{ color: '#7c3aed', fontSize: '14px', fontWeight: '500' }}>+ Parol qo'shish</button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ width: '48%' }}>Bekor qilish</button>
                <button type="submit" className="btn-primary" style={{ width: '48%' }}>Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
