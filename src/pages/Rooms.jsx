import { useState } from 'react';
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiX } from 'react-icons/fi';

const Rooms = () => {
  const [rooms, setRooms] = useState([
    { id: 1, name: 'Autodesk', capacity: '20', type: 'Kompyuterli' },
    { id: 2, name: 'Adobe', capacity: '15', type: 'Oddiy' }
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '', type: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newRoom.name) {
      setRooms([...rooms, { ...newRoom, id: Date.now() }]);
      setIsModalOpen(false);
      setNewRoom({ name: '', capacity: '', type: '' });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-title">Xonalar</h1>
        <button onClick={() => setIsModalOpen(true)} className="add-btn">
          <span>+ Xona qo'shish</span>
        </button>
      </div>

      <div className="content-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="toolbar-btn"><FiFilter /> Filters</button>
          </div>
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input type="text" placeholder="Qidirish" className="search-input" />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Xona Nomi</th>
                <th>Sig'imi</th>
                <th>Turi</th>
                <th style={{ textAlign: 'right', paddingRight: '24px' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td style={{ paddingLeft: '24px', fontWeight: 'bold' }}>{room.name}</td>
                  <td>{room.capacity} ta joy</td>
                  <td><span className="course-badge">{room.type}</span></td>
                  <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', color: '#7c3aed' }}>
                      <button><FiEdit2 size={16} /></button>
                      <button onClick={() => setRooms(rooms.filter(r => r.id !== room.id))} style={{ color: '#6b7280' }}><FiTrash2 size={16} /></button>
                    </div>
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
              <h2 className="drawer-title">Xona qo'shish</h2>
              <button className="drawer-close" onClick={() => setIsModalOpen(false)}><FiX /></button>
            </div>
            
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>Yangi xona ma'lumotlarini kiriting.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="form-group">
                <label className="form-label">Xona nomi</label>
                <input 
                  type="text" required placeholder="Xona nomini kiriting"
                  value={newRoom.name} onChange={e => setNewRoom({...newRoom, name: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sig'imi</label>
                <input 
                  type="number" placeholder="O'rinlar soni"
                  value={newRoom.capacity} onChange={e => setNewRoom({...newRoom, capacity: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Turi</label>
                <input 
                  type="text" placeholder="Masalan: Kompyuterli"
                  value={newRoom.type} onChange={e => setNewRoom({...newRoom, type: e.target.value})}
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

export default Rooms;
