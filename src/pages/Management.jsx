import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiTrash2, FiEdit2, FiX } from 'react-icons/fi';

const Management = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryTab = new URLSearchParams(location.search).get('tab');
  const [activeTab, setActiveTab] = useState(queryTab || 'Kurslar');

  useEffect(() => {
    if (queryTab && ['Kurslar', 'Xonalar', 'Xodimlar'].includes(queryTab)) {
      setActiveTab(queryTab);
    }
  }, [queryTab]);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    navigate(`/dashboard/management?tab=${tab}`, { replace: true });
  };

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  
  const [courses, setCourses] = useState([
    { id: 1, name: 'Backend', duration: '6 oy', status: 'Yaxshi', price: '2400000', time: '120 min' }
  ]);
  const [rooms, setRooms] = useState([
    { id: 1, name: 'Autodesk', capacity: '20', type: 'Kompyuterli' }
  ]);

  const [newCourse, setNewCourse] = useState({ name: '', description: '', duration: '' });
  const [newRoom, setNewRoom] = useState({ name: '', capacity: '', type: '' });

  const handleCourseSubmit = (e) => {
    e.preventDefault();
    if (newCourse.name) {
      setCourses([...courses, { ...newCourse, id: Date.now(), status: 'Faol', price: '2000000', time: '120 min' }]);
      setIsCourseModalOpen(false);
      setNewCourse({ name: '', description: '', duration: '' });
    }
  };

  const handleRoomSubmit = (e) => {
    e.preventDefault();
    if (newRoom.name) {
      setRooms([...rooms, { ...newRoom, id: Date.now() }]);
      setIsRoomModalOpen(false);
      setNewRoom({ name: '', capacity: '', type: '' });
    }
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: '16px' }}>Boshqarish</h1>
        <div className="tabs-container">
          {['Kurslar', 'Xonalar', 'Xodimlar'].map(tab => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
              {activeTab === tab && (
                <div className="tab-indicator"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="content-card" style={{ padding: '24px', minHeight: '400px' }}>
        {activeTab === 'Kurslar' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>Kurslar</h2>
              <button className="add-btn" onClick={() => setIsCourseModalOpen(true)}>
                <span>+ Kurslar qo'shish</span>
              </button>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {courses.map(course => (
                <div key={course.id} className="course-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{course.name}</h3>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '12px', color: '#6b7280' }}>
                    <span>{course.status}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ color: '#9ca3af' }}><FiTrash2 size={14} /></button>
                      <button style={{ color: '#9ca3af' }}><FiEdit2 size={14} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="course-badge">{course.time}</span>
                    <span className="course-badge">{course.duration}</span>
                    <span className="course-badge">{course.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'Xonalar' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>Xonalar</h2>
              <button className="add-btn" onClick={() => setIsRoomModalOpen(true)}>
                <span>+ Xona qo'shish</span>
              </button>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {rooms.map(room => (
                <div key={room.id} className="course-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>{room.name}</h3>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '12px', color: '#6b7280' }}>
                    <span>{room.type}</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ color: '#9ca3af' }}><FiTrash2 size={14} /></button>
                      <button style={{ color: '#9ca3af' }}><FiEdit2 size={14} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span className="course-badge">{room.capacity} ta joy</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Xodimlar' && (
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Xodimlar ro'yxati (Tez orada...)</div>
        )}
      </div>

      {/* Course Modal */}
      <div className={`right-drawer-overlay ${isCourseModalOpen ? 'open' : ''}`} onClick={() => setIsCourseModalOpen(false)}>
        <div className={`right-drawer ${isCourseModalOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="drawer-title">Kurs qo'shish</h2>
              <button className="drawer-close" onClick={() => setIsCourseModalOpen(false)}><FiX /></button>
            </div>
            
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>Yangi kurs ma'lumotlarini kiriting.</p>

            <form onSubmit={handleCourseSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div className="form-group">
                <label className="form-label">Kurs nomi</label>
                <input 
                  type="text" required placeholder="Kurs nomini kiriting"
                  value={newCourse.name} onChange={e => setNewCourse({...newCourse, name: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Tavsifi</label>
                <input 
                  type="text" placeholder="Kurs haqida qisqacha"
                  value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Davomiyligi</label>
                <input 
                  type="text" placeholder="Masalan: 6 oy"
                  value={newCourse.duration} onChange={e => setNewCourse({...newCourse, duration: e.target.value})}
                  className="form-input" 
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid #f3f4f6' }}>
                <button type="button" onClick={() => setIsCourseModalOpen(false)} className="btn-secondary" style={{ width: '48%' }}>Bekor qilish</button>
                <button type="submit" className="btn-primary" style={{ width: '48%' }}>Saqlash</button>
              </div>
            </form>
        </div>
      </div>

      {/* Room Modal */}
      <div className={`right-drawer-overlay ${isRoomModalOpen ? 'open' : ''}`} onClick={() => setIsRoomModalOpen(false)}>
        <div className={`right-drawer ${isRoomModalOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <h2 className="drawer-title">Xona qo'shish</h2>
              <button className="drawer-close" onClick={() => setIsRoomModalOpen(false)}><FiX /></button>
            </div>
            
            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '24px' }}>Yangi xona ma'lumotlarini kiriting.</p>

            <form onSubmit={handleRoomSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
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
                <button type="button" onClick={() => setIsRoomModalOpen(false)} className="btn-secondary" style={{ width: '48%' }}>Bekor qilish</button>
                <button type="submit" className="btn-primary" style={{ width: '48%' }}>Saqlash</button>
              </div>
            </form>
        </div>
      </div>

    </div>
  );
};

export default Management;
