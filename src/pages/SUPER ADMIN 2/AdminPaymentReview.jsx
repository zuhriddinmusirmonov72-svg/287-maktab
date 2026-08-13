import { useState, useEffect } from 'react';
import { adminPaymentsAPI } from '../../api/api';
import toast from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle, FaSearch, FaEye, FaClock } from 'react-icons/fa';

export default function AdminPaymentReview() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING_REVIEW'); // all, PENDING_REVIEW, VERIFIED, REJECTED
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await adminPaymentsAPI.getAll();
      const data = res?.data?.data || [];
      setPayments(data);
    } catch (err) {
      toast.error('To\'lovlarni yuklashda xatolik');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'PENDING_REVIEW') return p.receipt?.verificationStatus === 'NEEDS_REVIEW' || p.receipt?.verificationStatus === 'PENDING_REVIEW' || p.receipt?.verificationStatus === 'OCR_CHECKED';
    return p.receipt?.verificationStatus === filter;
  });

  const handleVerify = async (id) => {
    if (!window.confirm("Rostdan ham ushbu to'lovni tasdiqlaysizmi? (Talabaga obuna beriladi)")) return;
    try {
      setProcessing(true);
      await adminPaymentsAPI.verify(id);
      toast.success("To'lov muvaffaqiyatli tasdiqlandi!");
      fetchPayments();
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Tasdiqlashda xato');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      toast.error("Rad etish sababini kiriting");
      return;
    }
    try {
      setProcessing(true);
      await adminPaymentsAPI.reject(id, rejectReason);
      toast.success("To'lov rad etildi");
      fetchPayments();
      setIsModalOpen(false);
      setRejectReason('');
      setIsRejecting(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Rad etishda xato');
    } finally {
      setProcessing(false);
    }
  };

  const openReceiptModal = (payment) => {
    setSelectedReceipt(payment);
    setIsRejecting(false);
    setRejectReason('');
    setIsModalOpen(true);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
          Cheklarni tasdiqlash
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }}
          >
            <option value="PENDING_REVIEW">Kutilayotganlar</option>
            <option value="VERIFIED">Tasdiqlanganlar</option>
            <option value="REJECTED">Rad etilganlar</option>
            <option value="all">Barchasi</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>Yuklanmoqda...</div>
      ) : filteredPayments.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: '12px' }}>
          Ma'lumot topilmadi
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
              <tr>
                <th style={{ padding: '16px', fontSize: '14px', color: '#4b5563', fontWeight: 600 }}>O'quvchi</th>
                <th style={{ padding: '16px', fontSize: '14px', color: '#4b5563', fontWeight: 600 }}>Tarif / Summa</th>
                <th style={{ padding: '16px', fontSize: '14px', color: '#4b5563', fontWeight: 600 }}>Sana</th>
                <th style={{ padding: '16px', fontSize: '14px', color: '#4b5563', fontWeight: 600 }}>Status</th>
                <th style={{ padding: '16px', fontSize: '14px', color: '#4b5563', fontWeight: 600 }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: '#111827' }}>{p.user?.full_name || 'Noma\'lum'}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{p.user?.phone || p.userId}</div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600 }}>{p.amount?.toLocaleString()} UZS</div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>{p.plan === 'MONTHLY' ? '1 Oylik' : '1 Yillik'} ({p.provider})</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#4b5563' }}>
                    {new Date(p.receipt?.updatedAt || p.updatedAt).toLocaleDateString('uz-UZ')}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '9999px', fontSize: '12px', fontWeight: 600,
                      background: p.status === 'PAID' ? '#dcfce7' : p.status === 'FAILED' ? '#fee2e2' : '#fef9c3',
                      color: p.status === 'PAID' ? '#166534' : p.status === 'FAILED' ? '#991b1b' : '#854d0e'
                    }}>
                      {p.status === 'PAID' ? 'To\'langan' : p.status === 'FAILED' ? 'Rad etilgan' : 'Kutilmoqda'}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button 
                      onClick={() => openReceiptModal(p)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #7c3aed', color: '#7c3aed', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}
                    >
                      <FaEye /> Ko'rish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && selectedReceipt && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '20px', fontWeight: 'bold' }}>To'lov tafsilotlari</h2>
            
            {/* O'quvchi ma'lumotlari */}
            <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}><strong>O'quvchi:</strong> {selectedReceipt.user?.full_name} ({selectedReceipt.user?.phone})</div>
              <div style={{ marginBottom: '8px' }}><strong>Tarif:</strong> {selectedReceipt.plan === 'MONTHLY' ? '1 Oylik' : '1 Yillik'}</div>
              <div><strong>Kutilayotgan summa:</strong> {selectedReceipt.amount?.toLocaleString()} UZS</div>
            </div>

            {/* Chek rasmi */}
            <div style={{ marginBottom: '16px' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 600 }}>Chek rasmi:</h3>
              {selectedReceipt.receipt?.filePath ? (
                <img 
                  src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/uploads/receipts/${selectedReceipt.receipt.filePath}`} 
                  alt="Chek rasmi" 
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #e5e7eb', maxHeight: '400px', objectFit: 'contain' }}
                  onError={(e) => { e.target.src = 'https://via.placeholder.com/400x500?text=Rasm+topilmadi'; }}
                />
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', background: '#f3f4f6', borderRadius: '8px', color: '#6b7280' }}>
                  Chek rasmi mavjud emas
                </div>
              )}
            </div>

            {selectedReceipt.status === 'PENDING' && !isRejecting && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button 
                  onClick={() => handleVerify(selectedReceipt.id)}
                  disabled={processing}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <FaCheckCircle /> Tasdiqlash
                </button>
                <button 
                  onClick={() => setIsRejecting(true)}
                  disabled={processing}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', background: '#ef4444', color: '#fff', border: 'none', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
                >
                  <FaTimesCircle /> Rad etish
                </button>
              </div>
            )}

            {isRejecting && (
              <div style={{ marginTop: '24px', padding: '16px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                <h4 style={{ margin: '0 0 8px', color: '#991b1b' }}>Rad etish sababini yozing:</h4>
                <textarea 
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Masalan: To'lov summasi kam yoki chek aniq emas..."
                  style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #fca5a5', marginBottom: '12px', boxSizing: 'border-box' }}
                  rows={3}
                />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => setIsRejecting(false)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>Bekor qilish</button>
                  <button onClick={() => handleReject(selectedReceipt.id)} disabled={processing} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: 'bold', cursor: 'pointer' }}>
                    Yuborish
                  </button>
                </div>
              </div>
            )}

            <button 
              onClick={() => setIsModalOpen(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6b7280' }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
