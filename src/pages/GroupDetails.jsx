import { useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { FiChevronLeft, FiBarChart2, FiX } from 'react-icons/fi';

const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { groups, students } = useContext(AppContext);
  
  const group = groups.find(g => g.id === Number(id));
  const [activeTab, setActiveTab] = useState('malumotlar');

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

  // Extract number from duration if possible, default to 6.0
  const durationMatch = group.duration.match(/\d+/);
  const durationNumber = durationMatch ? `${durationMatch[0]}.0` : '6.0';

  return (
    <div style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: '100%', borderRadius: '12px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/dashboard/groups')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: '#374151',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
            }}
          >
            <FiChevronLeft size={24} />
          </button>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#111827' }}>
            {group.name}
          </h1>
          <span style={{ 
            backgroundColor: '#dcfce7', color: '#16a34a', padding: '4px 12px', 
            borderRadius: '4px', fontSize: '12px', fontWeight: '600'
          }}>
            Aktiv
          </span>
        </div>
        
        <button style={{ 
          display: 'flex', alignItems: 'center', gap: '8px', 
          padding: '8px 16px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', 
          borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#374151', fontSize: '14px'
        }}>
          <FiBarChart2 size={16} />
          Statistika
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
        {[
          { id: 'malumotlar', label: "Ma'lumotlar" },
          { id: 'darsliklar', label: 'Guruh darsliklari' },
          { id: 'davomat', label: 'Akademik davomati' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
              color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
              fontWeight: '600',
              fontSize: '15px',
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'malumotlar' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Top Cards Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            
            {/* Mentors Card */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ 
                backgroundColor: '#3b82f6', color: 'white', padding: '16px 20px', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
              }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Guruh mentorlari</h3>
                <FiX size={18} style={{ cursor: 'pointer', opacity: 0.8 }} />
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <img 
                    src="https://ui-avatars.com/api/?name=Teacher&background=random&color=fff" 
                    alt="Teacher" 
                    style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <div>
                    <div style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', marginBottom: '2px' }}>Teacher</div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>{group.teacher || '—'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Parameters Card */}
            <div style={{ backgroundColor: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
              <div style={{ 
                backgroundColor: '#3b82f6', color: 'white', padding: '16px 20px', 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
              }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '600' }}>Parametrlar</h3>
                <FiX size={18} style={{ cursor: 'pointer', opacity: 0.8 }} />
              </div>
              <div style={{ padding: '4px 24px' }}>
                {[
                  { label: 'Kurs:', value: group.course },
                  { label: "O'rta yosh:", value: '21' },
                  { label: "O'quvchilar sig'imi:", value: '20' },
                  { label: "Mavjud o'quvchilar:", value: groupStudents.length },
                  { label: "O'quv oyidagi darslar soni:", value: '20' },
                  { label: 'Kurs davomiyligi (oy):', value: durationNumber },
                  { label: 'Jami darslar soni:', value: '20' },
                ].map((item, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', justifyContent: 'space-between', 
                    padding: '12px 0', borderBottom: idx !== 6 ? '1px solid #f3f4f6' : 'none',
                    fontSize: '13px'
                  }}>
                    <span style={{ color: '#6b7280' }}>{item.label}</span>
                    <span style={{ fontWeight: '700', color: '#111827' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            
          </div>

          {/* Dars jadvali */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '24px' }}>Dars jadvali</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '16px 24px', backgroundColor: '#f8fafc', borderRadius: '8px',
                fontSize: '14px', color: '#4b5563'
              }}>
                <span style={{ fontWeight: 'bold', color: '#3b82f6', width: '20%' }}>Mohirbek</span>
                <span style={{ width: '15%' }}>Du/Se/Ch/Pa/Ju</span>
                <span style={{ width: '25%' }}>09:30 dan - 12:30 gacha</span>
                <span style={{ width: '25%' }}>15 Yan, 2026 - 27 Iyun, 2026</span>
                <span style={{ width: '15%', textAlign: 'right' }}>F2 Autodesk // 18</span>
              </div>
              <div style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '16px 24px', backgroundColor: '#f8fafc', borderRadius: '8px',
                fontSize: '14px', color: '#4b5563'
              }}>
                <span style={{ fontWeight: 'bold', color: '#3b82f6', width: '20%' }}>+++Yusupova Barchinoy</span>
                <span style={{ width: '15%' }}>Du/Se/Ch/Pa/Ju</span>
                <span style={{ width: '25%' }}>08:00 dan - 09:30 gacha</span>
                <span style={{ width: '25%' }}>15 Yan, 2026 - 27 Iyun, 2026</span>
                <span style={{ width: '15%', textAlign: 'right' }}>F2 Autodesk // 18</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px', marginBottom: '32px' }}>
              <button style={{ 
                padding: '8px 24px', backgroundColor: 'white', border: '1px solid #e5e7eb', 
                borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#4b5563', fontWeight: '500'
              }}>
                Yana ko'rsatish (9)
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <button style={{ 
                width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'white', 
                border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                cursor: 'pointer', color: '#9ca3af'
              }}>
                <FiChevronLeft size={16} />
              </button>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#111827' }}>1-o'quv oyi</h4>
              <button style={{ 
                width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'white', 
                border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                cursor: 'pointer', color: '#9ca3af'
              }}>
                <FiChevronLeft size={16} style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '32px' }}>
              {[
                { date: 2, past: true }, { date: 5, past: true }, { date: 7, past: true },
                { date: 9, past: true }, { date: 12, past: true }, { date: 14, past: true }, { date: 16, past: true },
                { date: 19, past: false }, { date: 21, past: false }, { date: 23, past: false },
                { date: 26, past: false }, { date: 28, past: false }, { date: 30, past: false }
              ].map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  width: '56px', height: '64px', borderRadius: '8px',
                  backgroundColor: item.past ? '#e2e8f0' : 'white',
                  border: item.past ? '1px solid transparent' : '1px solid #e5e7eb',
                  color: item.past ? '#64748b' : '#334155'
                }}>
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>May</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{item.date}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button style={{ 
                padding: '10px 32px', backgroundColor: 'white', border: '1px solid #e5e7eb', 
                borderRadius: '8px', cursor: 'pointer', fontSize: '14px', color: '#4b5563', fontWeight: '500'
              }}>
                Barchasini ko'rish
              </button>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'darsliklar' && (
         <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #e5e7eb' }}>
            <p>Bu guruh uchun darsliklar hali yuklanmagan.</p>
         </div>
      )}

      {activeTab === 'davomat' && (
         <div style={{ padding: '60px 20px', textAlign: 'center', color: '#9ca3af', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #e5e7eb' }}>
            <p>Bu guruh uchun akademik davomat ma'lumotlari mavjud emas.</p>
         </div>
      )}
    </div>
  );
};

export default GroupDetails;
