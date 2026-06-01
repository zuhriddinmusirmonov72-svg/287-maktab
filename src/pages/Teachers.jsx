import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiEdit2, FiTrash2, FiEye, FiX, FiRefreshCw, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { teachersAPI } from '../api/api';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchive, setShowArchive] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Ko'rish uchun state
  const [viewingTeacher, setViewingTeacher] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    password: '',
  });

  // =============================================
  // 📡 O'QITUVCHILAR RO'YXATINI OLISH
  // GET /api/v1/teachers
  // =============================================
  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const res = showArchive ? await teachersAPI.getArchive() : await teachersAPI.getAll();
      console.log('Teachers response:', res.data);
      const data = res.data?.data || res.data || [];
      setTeachers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch xato:', err.response?.data || err.message);
      toast.error("O'qituvchilarni yuklashda xato!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [showArchive]);

  // =============================================
  // ➕ YANGI O'QITUVCHI QO'SHISH
  // POST /api/v1/teachers  (multipart/form-data)
  // =============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name || !form.phone || (!editingId && !form.password)) {
      toast.error(editingId ? "Ism va telefon majburiy!" : "Ism, telefon va parol majburiy!");
      return;
    }

    // ✅ Telefon: faqat oxirgi 9 raqam (998 siz)
    const rawPhone = form.phone.trim().replace(/\D/g, '');
    const phone = rawPhone.length > 9 ? rawPhone.slice(-9) : rawPhone;

    if (phone.length !== 9) {
      toast.error('Telefon raqam 9 ta raqamdan iborat bo\'lishi kerak! Misol: 901234567');
      return;
    }

    // ✅ FormData (multipart/form-data) formatida yuborish
    const formData = new FormData();
    formData.append('full_name', form.full_name.trim());
    formData.append('phone', phone);
    if (form.email.trim()) formData.append('email', form.email.trim());
    if (form.address.trim()) formData.append('address', form.address.trim());
    if (form.password) formData.append('password', form.password.trim());

    console.log('Yuborilayotgan FormData:');
    for (let [key, val] of formData.entries()) {
      console.log(`  ${key}: ${val}`);
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await teachersAPI.update(editingId, formData);
        toast.success("O'qituvchi muvaffaqiyatli yangilandi!");
      } else {
        await teachersAPI.create(formData);
        toast.success("O'qituvchi muvaffaqiyatli qo'shildi!");
      }
      resetForm();
      fetchTeachers();
    } catch (err) {
      const errData = err.response?.data;
      console.log('=== XATO TAFSILOTI ===');
      console.log('Status:', err.response?.status);
      console.log('Full error:', errData);

      if (errData?.message && Array.isArray(errData.message)) {
        errData.message.forEach((m) => toast.error(m, { duration: 6000 }));
      } else if (errData?.message && typeof errData.message === 'string') {
        toast.error(errData.message, { duration: 6000 });
      } else {
        toast.error(errData?.error || err.message || 'Xato yuz berdi!', { duration: 6000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================================
  // 🗑 O'QITUVCHI O'CHIRISH
  // DELETE /api/v1/teachers/:id
  // =============================================
  const handleDelete = async (id) => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    try {
      await teachersAPI.delete(id);
      toast.success("O'qituvchi o'chirildi!");
      fetchTeachers();
    } catch (err) {
      const errData = err.response?.data;
      const msg = Array.isArray(errData?.message)
        ? errData.message.join(', ')
        : errData?.message || "O'chirishda xato!";
      toast.error(msg);
    }
  };

  // =============================================
  // 👁 O'QITUVCHINI KO'RISH
  // GET /api/v1/teachers/one/:id
  // =============================================
  const handleView = async (id) => {
    try {
      setIsLoading(true);
      const res = await teachersAPI.getOne(id);
      console.log("Teacher details:", res.data);
      const data = res.data?.data || res.data;
      setViewingTeacher(data);
      setIsViewModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Ma'lumotlarni yuklashda xatolik!");
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ full_name: '', phone: '', email: '', address: '', password: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (teacher) => {
    setEditingId(teacher.id);
    setForm({
      full_name: teacher.full_name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim(),
      phone: teacher.phone || '',
      email: teacher.email || '',
      address: teacher.address || '',
      password: '', // parolni bo'sh qoldiramiz
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setForm({ full_name: '', phone: '', email: '', address: '', password: '' });
    setEditingId(null);
    setIsModalOpen(false);
  };

  // Qidiruv filtri
  const filtered = teachers.filter((t) => {
    const name = t.full_name || `${t.first_name || ''} ${t.last_name || ''}`;
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.phone || '').includes(searchQuery) ||
      (t.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getInitials = (t) => {
    const name = t.full_name || `${t.first_name || ''} ${t.last_name || ''}`;
    return name.trim().substring(0, 2).toUpperCase() || 'OQ';
  };

  const getFullName = (t) =>
    t.full_name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || '—';

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">O'qituvchilar {showArchive ? "(Arxiv)" : ""}</h1>
          <p className="page-subtitle" style={{ maxWidth: '600px', marginTop: '8px' }}>
            Ushbu sahifada o'qituvchilar ro'yxati va ularning ma'lumotlari keltirilgan.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchTeachers} className="toolbar-btn" title="Yangilash">
            <FiRefreshCw size={16} />
          </button>
          <button onClick={openAddModal} className="add-btn">
            + O'qituvchi qo'shish
          </button>
        </div>
      </div>

      {/* JADVAL */}
      <div className="content-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="toolbar-btn"><FiFilter /> Filters</button>
            <button 
              className="toolbar-btn" 
              onClick={() => setShowArchive(!showArchive)}
              style={showArchive ? { background: '#f3f4f6', borderColor: '#d1d5db', color: '#374151', fontWeight: '500' } : {}}
            >
              {showArchive ? 'Asosiy ro\'yxat' : 'Arxiv'}
            </button>
          </div>
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Qidirish..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <div style={{
                width: '36px', height: '36px',
                border: '3px solid #e5e7eb',
                borderTopColor: '#7c3aed',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 12px',
              }} />
              Yuklanmoqda...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '48px', paddingLeft: '24px' }}><input type="checkbox" /></th>
                  <th>NOMI</th>
                  <th>TELEFON</th>
                  <th>EMAIL</th>
                  <th>MANZIL</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>AMALLAR</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      <FiUser size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                      <div>{searchQuery ? 'Natija topilmadi' : "O'qituvchilar yo'q"}</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t.id}>
                      <td style={{ paddingLeft: '24px' }}><input type="checkbox" /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            backgroundColor: '#4f46e5', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 'bold', flexShrink: 0, overflow: 'hidden',
                          }}>
                            {t.photo
                              ? <img src={t.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : getInitials(t)
                            }
                          </div>
                          <span style={{ fontWeight: '500' }}>{getFullName(t)}</span>
                        </div>
                      </td>
                      <td>{t.phone || '—'}</td>
                      <td>{t.email || '—'}</td>
                      <td>{t.address || '—'}</td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button onClick={() => handleView(t.id)} style={{ color: '#7c3aed', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Ko'rish">
                            <FiEye size={16} />
                          </button>
                          <button style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }} title="O'chirish" onClick={() => handleDelete(t.id)}>
                            <FiTrash2 size={16} />
                          </button>
                          <button onClick={() => handleEdit(t)} style={{ color: '#3b82f6', background: 'transparent', border: 'none', cursor: 'pointer' }} title="Tahrirlash"><FiEdit2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="pagination">
          <button className="toolbar-btn" style={{ fontSize: '12px' }}>&larr; Previous</button>
          <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3].map((p, i) => (
              <button key={i} className={`page-btn ${p === 1 ? 'active' : ''}`}>{p}</button>
            ))}
          </div>
          <button className="toolbar-btn" style={{ fontSize: '12px' }}>Next &rarr;</button>
        </div>
      </div>

      {/* ===== DRAWER — O'QITUVCHI QO'SHISH ===== */}
      <div
        className={`right-drawer-overlay ${isModalOpen ? 'open' : ''}`}
        onClick={resetForm}
      >
        <div
          className={`right-drawer ${isModalOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="drawer-header">
            <h2 className="drawer-title">{editingId ? "O'qituvchini tahrirlash" : "O'qituvchi qo'shish"}</h2>
            <button className="drawer-close" onClick={resetForm}>
              <FiX />
            </button>
          </div>

          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '20px' }}>
            Telefon: <strong>901234567</strong> formatida yozing (9 ta raqam, 998 siz).
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>

            <div className="form-group">
              <label className="form-label">To'liq ism <span style={{ color: 'red' }}>*</span></label>
              <input type="text" required placeholder="Ali Karimov" className="form-input"
                value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Telefon raqam <span style={{ color: 'red' }}>*</span></label>
              <input type="text" required placeholder="901234567" className="form-input"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <small style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                9 ta raqam kiriting: 901234567 (998 siz)
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" placeholder="ali@gmail.com" className="form-input"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Manzil</label>
              <input type="text" placeholder="Toshkent, Chilonzor" className="form-input"
                value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>

            <div className="form-group">
              <label className="form-label">Parol {!editingId && <span style={{ color: 'red' }}>*</span>}</label>
              <input type="password" required={!editingId} placeholder={editingId ? "Yangi parol (ixtiyoriy)" : "Kamida 8 belgi"}
                className="form-input" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <small style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                {editingId ? "Agar o'zgartirmoqchi bo'lmasangiz bo'sh qoldiring" : "Misol: Admin123!"}
              </small>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 'auto', paddingTop: '24px',
              borderTop: '1px solid #f3f4f6',
            }}>
              <button type="button" onClick={resetForm}
                className="btn-secondary" style={{ width: '48%' }}>
                Bekor qilish
              </button>
              <button type="submit" disabled={isSubmitting}
                className="btn-primary"
                style={{ width: '48%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {isSubmitting ? (
                  <>
                    <div style={{
                      width: '16px', height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }} />
                    Saqlanmoqda...
                  </>
                ) : 'Saqlash'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ===== MODAL — O'QITUVCHINI KO'RISH ===== */}
      {isViewModalOpen && viewingTeacher && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', padding: '20px'
        }} onClick={() => setIsViewModalOpen(false)}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '480px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>O'qituvchi ma'lumotlari</h2>
              <button onClick={() => setIsViewModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <FiX size={20} />
              </button>
            </div>
            
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  backgroundColor: '#4f46e5', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', fontWeight: 'bold'
                }}>
                  {viewingTeacher.photo ? <img src={viewingTeacher.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : getInitials(viewingTeacher)}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>{getFullName(viewingTeacher)}</h3>
                  <span style={{
                    background: showArchive ? '#f3f4f6' : '#dcfce7',
                    color: showArchive ? '#4b5563' : '#16a34a',
                    padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '500'
                  }}>
                    {showArchive ? 'Arxivlangan' : 'Aktiv'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ background: '#f9fafb', padding: '12px 16px', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Telefon raqam</p>
                  <p style={{ margin: 0, fontWeight: '500', color: '#111827' }}>+998 {viewingTeacher.phone || 'Noma\'lum'}</p>
                </div>
                <div style={{ background: '#f9fafb', padding: '12px 16px', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Email manzil</p>
                  <p style={{ margin: 0, fontWeight: '500', color: '#111827' }}>{viewingTeacher.email || 'Kiritilmagan'}</p>
                </div>
                <div style={{ background: '#f9fafb', padding: '12px 16px', borderRadius: '8px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#6b7280' }}>Yashash manzili</p>
                  <p style={{ margin: 0, fontWeight: '500', color: '#111827' }}>{viewingTeacher.address || 'Kiritilmagan'}</p>
                </div>
              </div>
            </div>
            
            <div style={{ padding: '16px 24px', background: '#f9fafb', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setIsViewModalOpen(false)} className="btn-primary" style={{ padding: '8px 24px' }}>
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;
