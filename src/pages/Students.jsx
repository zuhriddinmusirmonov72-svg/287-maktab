import { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiTrash2, FiEye, FiX, FiRefreshCw, FiUser, FiEdit2 } from 'react-icons/fi';
import { FaUserGraduate } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { studentsAPI, groupsAPI } from '../api/api';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    address: '',
    birth_date: '',
    password: '',
    group_id: '',
  });

  // =============================================
  // 📡 TALABALAR RO'YXATINI OLISH
  // GET /api/v1/students
  // =============================================
  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await studentsAPI.getAll(1, 100);
      console.log('Students response:', res.data);
      const data = res.data?.data || res.data || [];
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Fetch xato:', err.response?.data || err.message);
      toast.error('Talabalarni yuklashda xato!');
    } finally {
      setIsLoading(false);
    }
  };

  // =============================================
  // 📡 GURUHLAR RO'YXATINI OLISH
  // GET /api/v1/groups/all
  // =============================================
  const fetchGroups = async () => {
    try {
      const res = await groupsAPI.getAll();
      console.log('Groups response:', res.data);
      const data = res.data?.data || res.data || [];
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Groups fetch xato:', err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchGroups();
  }, []);

  // =============================================
  // ➕ YANGI TALABA QO'SHISH
  // POST /api/v1/students  (multipart/form-data)
  // =============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.full_name || !form.phone || (!editingId && !form.password)) {
      toast.error(editingId ? 'Ism va telefon majburiy!' : 'Ism, telefon va parol majburiy!');
      return;
    }

    // ✅ Telefon: faqat oxirgi 9 raqam (998 siz)
    const rawPhone = form.phone.trim().replace(/\D/g, '');
    const phone = rawPhone.length > 9 ? rawPhone.slice(-9) : rawPhone;

    if (phone.length !== 9) {
      toast.error("Telefon raqam 9 ta raqamdan iborat bo'lishi kerak! Misol: 901234567");
      return;
    }

    // ✅ FormData (multipart/form-data) formatida yuborish
    const formData = new FormData();
    formData.append('full_name', form.full_name.trim());
    formData.append('phone', phone);
    if (form.password) formData.append('password', form.password.trim());
    
    // Ixtiyoriy maydonlar — faqat to'ldirilgan bo'lsagina yuboriladi
    if (form.email.trim()) formData.append('email', form.email.trim());
    if (form.address.trim()) formData.append('address', form.address.trim());
    if (form.birth_date) formData.append('birth_date', new Date(form.birth_date).toISOString());
    if (form.group_id) formData.append('group_id', form.group_id);

    console.log('Yuborilayotgan FormData:');
    for (let [key, val] of formData.entries()) {
      console.log(`  ${key}: ${val}`);
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await studentsAPI.update(editingId, formData);
        toast.success("Talaba muvaffaqiyatli yangilandi!");
      } else {
        await studentsAPI.create(formData);
        toast.success("Talaba muvaffaqiyatli qo'shildi!");
      }
      resetForm();
      fetchStudents();
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
  // 🗑 TALABANI O'CHIRISH
  // DELETE /api/v1/students/:id
  // =============================================
  const handleDelete = async (id) => {
    if (!window.confirm("O'chirishni tasdiqlaysizmi?")) return;
    try {
      await studentsAPI.delete(id);
      toast.success("Talaba o'chirildi!");
      fetchStudents();
    } catch (err) {
      const errData = err.response?.data;
      const msg = Array.isArray(errData?.message)
        ? errData.message.join(', ')
        : errData?.message || "O'chirishda xato!";
      toast.error(msg);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setForm({ full_name: '', phone: '', email: '', address: '', birth_date: '', password: '', group_id: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (student) => {
    setEditingId(student.id);
    const bDate = student.birth_date ? new Date(student.birth_date).toISOString().split('T')[0] : '';
    setForm({
      full_name: student.full_name || `${student.first_name || ''} ${student.last_name || ''}`.trim(),
      phone: student.phone || '',
      email: student.email || '',
      address: student.address || '',
      birth_date: bDate,
      password: '', // Parolni o'zgartirish ixtiyoriy
      group_id: student.group?.id || student.group_id || '',
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setForm({ full_name: '', phone: '', email: '', address: '', birth_date: '', password: '', group_id: '' });
    setEditingId(null);
    setIsModalOpen(false);
  };

  // Qidiruv filtri
  const filtered = students.filter((s) => {
    const name = s.full_name || `${s.first_name || ''} ${s.last_name || ''}`;
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.phone || '').includes(searchQuery)
    );
  });

  const getInitials = (s) => {
    const name = s.full_name || `${s.first_name || ''} ${s.last_name || ''}`;
    return name.trim().substring(0, 2).toUpperCase() || 'TL';
  };

  const getFullName = (s) =>
    s.full_name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || '—';

  return (
    <div className="page-container">
      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Talabalar</h1>
          <p className="page-subtitle" style={{ maxWidth: '600px', marginTop: '8px' }}>
            Ushbu sahifada talabalar ro'yxati va ularning ma'lumotlari keltirilgan.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchStudents} className="toolbar-btn" title="Yangilash">
            <FiRefreshCw size={16} />
          </button>
          <button onClick={openAddModal} className="add-btn">
            + Talaba qo'shish
          </button>
        </div>
      </div>

      {/* STAT CARD */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="group-stat-card" style={{ position: 'relative' }}>
          <div style={{ color: '#6b7280', marginBottom: '8px' }}>
            <FaUserGraduate size={20} />
          </div>
          <p className="stat-title" style={{ textAlign: 'left' }}>Jami talabalar</p>
          <h3 className="stat-value">{students.length}</h3>
        </div>
      </div>

      {/* JADVAL */}
      <div className="content-card">
        <div className="table-toolbar">
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="toolbar-btn"><FiFilter /> Filters</button>
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
                  <th>F.I.SH</th>
                  <th>TELEFON</th>
                  <th>GURUH</th>
                  <th>QO'SHILGAN SANA</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>AMALLAR</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      <FiUser size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                      <div>{searchQuery ? 'Natija topilmadi' : "Talabalar yo'q"}</div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id}>
                      <td style={{ paddingLeft: '24px' }}><input type="checkbox" /></td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '36px', height: '36px', borderRadius: '50%',
                            backgroundColor: '#059669', color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 'bold', flexShrink: 0, overflow: 'hidden',
                          }}>
                            {s.photo
                              ? <img src={s.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : getInitials(s)
                            }
                          </div>
                          <span style={{ fontWeight: '500' }}>{getFullName(s)}</span>
                        </div>
                      </td>
                      <td>{s.phone || '—'}</td>
                      <td>{s.group?.name || s.group_name || '—'}</td>
                      <td>
                        {s.created_at
                          ? new Date(s.created_at).toLocaleDateString('uz-UZ')
                          : s.createdAt
                            ? new Date(s.createdAt).toLocaleDateString('uz-UZ')
                            : '—'}
                      </td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                          <button style={{ color: '#7c3aed', border: 'none', background: 'transparent', cursor: 'pointer' }} title="Ko'rish">
                            <FiEye size={16} />
                          </button>
                          <button
                            style={{ color: '#3b82f6', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            title="Tahrirlash"
                            onClick={() => handleEdit(s)}
                          >
                            <FiEdit2 size={16} />
                          </button>
                          <button
                            style={{ color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}
                            title="O'chirish"
                            onClick={() => handleDelete(s.id)}
                          >
                            <FiTrash2 size={16} />
                          </button>
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

      {/* ===== DRAWER — TALABA QO'SHISH ===== */}
      <div
        className={`right-drawer-overlay ${isModalOpen ? 'open' : ''}`}
        onClick={resetForm}
      >
        <div
          className={`right-drawer ${isModalOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="drawer-header">
            <h2 className="drawer-title">{editingId ? "Talabani tahrirlash" : "Talaba qo'shish"}</h2>
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
              <input
                type="text" required placeholder="Ali Karimov"
                className="form-input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefon raqam <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text" required placeholder="901234567"
                className="form-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <small style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                9 ta raqam kiriting: 901234567 (998 siz)
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Parol {!editingId && <span style={{ color: 'red' }}>*</span>}</label>
              <input
                type="password" required={!editingId} placeholder={editingId ? "Yangi parol (ixtiyoriy)" : "Kamida 8 belgi"}
                className="form-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <small style={{ color: '#9ca3af', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                {editingId ? "Agar parolni o'zgartirmoqchi bo'lmasangiz bo'sh qoldiring" : "Misol: Student123!"}
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">Email <span style={{ color: '#9ca3af', fontSize: '11px' }}>(ixtiyoriy)</span></label>
              <input
                type="email" placeholder="ali@gmail.com"
                className="form-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Manzil <span style={{ color: '#9ca3af', fontSize: '11px' }}>(ixtiyoriy)</span></label>
              <input
                type="text" placeholder="Toshkent, Chilonzor"
                className="form-input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tug'ilgan sana <span style={{ color: '#9ca3af', fontSize: '11px' }}>(ixtiyoriy)</span></label>
              <input
                type="date" placeholder="2000-01-01"
                className="form-input"
                value={form.birth_date}
                onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Guruh <span style={{ color: '#9ca3af', fontSize: '11px' }}>(ixtiyoriy)</span></label>
              <select
                className="form-input"
                value={form.group_id}
                onChange={(e) => setForm({ ...form, group_id: e.target.value })}
              >
                <option value="">Guruhni tanlang</option>
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name || g.group_name} {g.course ? `— ${g.course}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 'auto', paddingTop: '24px',
              borderTop: '1px solid #f3f4f6',
            }}>
              <button
                type="button" onClick={resetForm}
                className="btn-secondary" style={{ width: '48%' }}
              >
                Bekor qilish
              </button>
              <button
                type="submit" disabled={isSubmitting}
                className="btn-primary"
                style={{ width: '48%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
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
    </div>
  );
};

export default Students;
