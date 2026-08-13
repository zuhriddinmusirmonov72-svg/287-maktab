import { useState, useEffect } from 'react';
import { studentsAPI } from '../api/api';
import { FaMoneyBillWave, FaCheckCircle, FaTimesCircle, FaUserGraduate, FaFilter } from 'react-icons/fa';
import toast from 'react-hot-toast';

export default function Payments() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, paid, unpaid

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await studentsAPI.getAll(1, 1000); // Barcha talabalar
      const data = res?.data?.data || res?.data || [];
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Talabalarni yuklashda xato:', err);
      toast.error('Ma\'lumotlarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student => {
    if (filter === 'paid') return student.has_paid;
    if (filter === 'unpaid') return !student.has_paid;
    return true;
  });

  const paidCount = students.filter(s => s.has_paid).length;
  const unpaidCount = students.filter(s => !s.has_paid).length;
  const totalAmount = students.filter(s => s.has_paid).length * 500000; // 500,000 har bir talaba

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
        <div style={{
          width: '48px', height: '48px',
          border: '4px solid #e5e7eb',
          borderTopColor: '#7c3aed',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div className="payments-page">
      
      {/* Header */}
      <div className="payments-header">
        <h1 className="payments-title">
          💰 To'lov qilganlar
        </h1>
        <p className="payments-subtitle">
          Oylik to'lovlarni kuzating
        </p>
      </div>

      {/* Stats Cards */}
      <div className="payments-stats">
        {/* Jami to'lov */}
        <div className="stat-card stat-card-primary">
          <div className="stat-icon-wrapper">
            <FaMoneyBillWave className="stat-icon" />
          </div>
          <div className="stat-content">
            <p className="stat-label">Jami to'lov</p>
            <h3 className="stat-value">
              {(totalAmount / 1000000).toFixed(1)}M
            </h3>
            <p className="stat-description">
              {paidCount} ta talaba
            </p>
          </div>
        </div>

        {/* To'lagan */}
        <div className="stat-card stat-card-success">
          <div className="stat-icon-wrapper stat-icon-success">
            <FaCheckCircle className="stat-icon" />
          </div>
          <div className="stat-content">
            <p className="stat-label">To'lagan</p>
            <h3 className="stat-value">{paidCount}</h3>
          </div>
        </div>

        {/* To'lamagan */}
        <div className="stat-card stat-card-danger">
          <div className="stat-icon-wrapper stat-icon-danger">
            <FaTimesCircle className="stat-icon" />
          </div>
          <div className="stat-content">
            <p className="stat-label">To'lamagan</p>
            <h3 className="stat-value">{unpaidCount}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="payments-filters">
        <button
          onClick={() => setFilter('all')}
          className={`filter-btn ${filter === 'all' ? 'filter-btn-active' : ''}`}
        >
          Barchasi ({students.length})
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`filter-btn filter-btn-success ${filter === 'paid' ? 'filter-btn-active' : ''}`}
        >
          <FaCheckCircle size={14} />
          To'langan ({paidCount})
        </button>
        <button
          onClick={() => setFilter('unpaid')}
          className={`filter-btn filter-btn-danger ${filter === 'unpaid' ? 'filter-btn-active' : ''}`}
        >
          <FaTimesCircle size={14} />
          To'lanmagan ({unpaidCount})
        </button>
      </div>

      {/* Students List - Mobile Cards / Desktop Table */}
      <div className="payments-list">
        {filteredStudents.length === 0 ? (
          <div className="empty-state">
            <FaUserGraduate size={64} className="empty-icon" />
            <p className="empty-text">Ma'lumot topilmadi</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="students-cards">
              {filteredStudents.map((student, index) => (
                <div key={student.id} className="student-card">
                  <div className="student-card-header">
                    <div className="student-avatar">
                      {(student.full_name || 'T').charAt(0).toUpperCase()}
                    </div>
                    <div className="student-info">
                      <h4 className="student-name">
                        {student.full_name || 'Nomi yo\'q'}
                      </h4>
                      <p className="student-phone">
                        {student.phone || '-'}
                      </p>
                    </div>
                    <span className={`payment-badge ${student.has_paid ? 'badge-success' : 'badge-danger'}`}>
                      {student.has_paid ? (
                        <>
                          <FaCheckCircle size={12} />
                          To'langan
                        </>
                      ) : (
                        <>
                          <FaTimesCircle size={12} />
                          To'lanmagan
                        </>
                      )}
                    </span>
                  </div>
                  <div className="student-card-footer">
                    <div className="student-amount">
                      <span className="amount-label">Summa:</span>
                      <span className="amount-value">500,000 so'm</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="students-table">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Talaba</th>
                    <th>Telefon</th>
                    <th>Summa</th>
                    <th>Holat</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="table-student">
                          <div className="student-avatar">
                            {(student.full_name || 'T').charAt(0).toUpperCase()}
                          </div>
                          <span>{student.full_name || 'Nomi yo\'q'}</span>
                        </div>
                      </td>
                      <td>{student.phone || '-'}</td>
                      <td className="table-amount">500,000 so'm</td>
                      <td>
                        <span className={`payment-badge ${student.has_paid ? 'badge-success' : 'badge-danger'}`}>
                          {student.has_paid ? (
                            <>
                              <FaCheckCircle size={12} />
                              To'langan
                            </>
                          ) : (
                            <>
                              <FaTimesCircle size={12} />
                              To'lanmagan
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

    </div>
  );
}
