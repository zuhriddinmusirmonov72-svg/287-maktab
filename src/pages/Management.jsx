import { useState } from 'react';
import { FiTrash2, FiEdit2 } from 'react-icons/fi';

const Management = () => {
  const [activeTab, setActiveTab] = useState('Kurslar');

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ marginBottom: '16px' }}>Boshqarish</h1>
        <div className="tabs-container">
          {['Kurslar', 'Xonalar', 'Xodimlar'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
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
              <button className="add-btn">
                <span>+ Kurslar qo'shish</span>
              </button>
            </div>

            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              <div className="course-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h3 style={{ fontWeight: 'bold', fontSize: '14px', color: '#1f2937' }}>Backend</h3>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', fontSize: '12px', color: '#6b7280' }}>
                  <span>Yaxshi</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ color: '#9ca3af' }}><FiTrash2 size={14} /></button>
                    <button style={{ color: '#9ca3af' }}><FiEdit2 size={14} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className="course-badge">120 min</span>
                  <span className="course-badge">6 oy</span>
                  <span className="course-badge">2400000</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'Xonalar' && (
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Xonalar ro'yxati (Tez orada...)</div>
        )}

        {activeTab === 'Xodimlar' && (
          <div style={{ color: '#6b7280', fontSize: '14px' }}>Xodimlar ro'yxati (Tez orada...)</div>
        )}
      </div>
    </div>
  );
};

export default Management;
