import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaUserGraduate, FaSyncAlt } from 'react-icons/fa';
import { FiMoreVertical, FiX, FiSearch, FiRefreshCw, FiCalendar, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { groupsAPI, teachersAPI, coursesAPI, roomsAPI } from '../api/api';

const WEEK_DAYS = [
  { label: 'Du', value: 'MONDAY' },
  { label: 'Se', value: 'TUESDAY' },
  { label: 'Chor', value: 'WEDNESDAY' },
  { label: 'Pay', value: 'THURSDAY' },
  { label: 'Ju', value: 'FRIDAY' },
  { label: 'Sha', value: 'SATURDAY' },
  { label: 'Ya', value: 'SUNDAY' },
];

const emptyForm = {
  name: '',
  description: '',
  course_id: '',
  teachers: [],
  room_id: '',
  start_date: '',
  week_day: [],
  start_time: '',
  max_student: '',
};

const Groups = () => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [searchName, setSearchName] = useState('');
  const [searchMax, setSearchMax] = useState('');

  const [form, setForm] = useState(emptyForm);

  // ============================================
  // 📡 GURUHLAR RO'YXATI — GET /groups/all
  // ============================================
  const fetchGroups = async (name = '', max = '') => {
    setIsLoading(true);
    try {
      const res = await groupsAPI.getAll(name || undefined, max ? Number(max) : undefined);
      const data = res.data?.data || res.data || [];
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Guruhlar xato:', err.response?.data || err.message);
      toast.error('Guruhlarni yuklashda xato!');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // 📡 DROPDOWN MA'LUMOTLAR
  // ============================================
  const fetchDropdowns = async () => {
    try {
      const [tRes, cRes, rRes] = await Promise.allSettled([
        teachersAPI.getAll(),
        coursesAPI.getAll(),
        roomsAPI.getAll(),
      ]);
      if (tRes.status === 'fulfilled') {
        const d = tRes.value.data?.data || tRes.value.data || [];
        setTeachers(Array.isArray(d) ? d : []);
      }
      if (cRes.status === 'fulfilled') {
        const d = cRes.value.data?.data || cRes.value.data || [];
        setCourses(Array.isArray(d) ? d : []);
      }
      if (rRes.status === 'fulfilled') {
        const d = rRes.value.data?.data || rRes.value.data || [];
        setRooms(Array.isArray(d) ? d : []);
      }
    } catch (err) {
      console.error('Dropdown xato:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
    fetchDropdowns();
  }, []);

  // ============================================
  // 🔍 QIDIRUV
  // ============================================
  const handleSearch = (e) => {
    e.preventDefault();
    fetchGroups(searchName, searchMax);
  };

  // ============================================
  // ➕ GURUH QO'SHISH — POST /groups (JSON)
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.course_id || !form.room_id || !form.start_date || !form.start_time || !form.max_student) {
      toast.error("Barcha majburiy maydonlarni to'ldiring!");
      return;
    }
    if (form.week_day.length === 0) {
      toast.error("Kamida bitta dars kuni tanlang!");
      return;
    }
    if (form.teachers.length === 0) {
      toast.error("Kamida bitta o'qituvchi tanlang!");
      return;
    }

    const body = {
      name: form.name.trim(),
      description: form.description.trim() || form.name.trim(),
      course_id: Number(form.course_id),
      teachers: form.teachers.map(Number),
      students: [],
      room_id: Number(form.room_id),
      start_date: form.start_date,
      week_day: form.week_day,
      start_time: form.start_time,
      max_student: Number(form.max_student),
    };

    console.log('Yuborilayotgan body:', body);

    setIsSubmitting(true);
    try {
      await groupsAPI.create(body);
      toast.success("Guruh muvaffaqiyatli qo'shildi!");
      resetForm();
      fetchGroups(searchName, searchMax);
    } catch (err) {
      const errData = err.response?.data;
      console.log('Xato:', errData);
      if (errData?.message && Array.isArray(errData.message)) {
        errData.message.forEach((m) => toast.error(m, { duration: 6000 }));
      } else {
        toast.error(errData?.message || errData?.error || 'Xato yuz berdi!', { duration: 6000 });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // 🗑 GURUH O'CHIRISH — DELETE /groups/:id
  // ============================================
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Guruhni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await groupsAPI.delete(id);
      toast.success("Guruh o'chirildi!");
      fetchGroups(searchName, searchMax);
    } catch (err) {
      const errData = err.response?.data;
      toast.error(errData?.message || "O'chirishda xato!");
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setIsModalOpen(false);
  };

  const toggleWeekDay = (day) => {
    setForm((prev) => ({
      ...prev,
      week_day: prev.week_day.includes(day)
        ? prev.week_day.filter((d) => d !== day)
        : [...prev.week_day, day],
    }));
  };

  const toggleTeacher = (id) => {
    const numId = Number(id);
    setForm((prev) => ({
      ...prev,
      teachers: prev.teachers.includes(numId)
        ? prev.teachers.filter((t) => t !== numId)
        : [...prev.teachers, numId],
    }));
  };

  const getTeacherName = (t) =>
    t.full_name || `${t.first_name || ''} ${t.last_name || ''}`.trim() || '—';

  const totalStudents = groups.reduce((sum, g) => sum + (g.max_student || g.students?.length || 0), 0);

  return (
    <div className="page-container">

      {/* HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">Guruhlar</h1>
          <p className="page-subtitle" style={{ marginTop: '4px' }}>
            Barcha guruhlar ro'yxati va ularni boshqarish.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => fetchGroups(searchName, searchMax)} className="toolbar-btn" title="Yangilash">
            <FiRefreshCw size={16} />
          </button>
          <button onClick={() => setIsModalOpen(true)} className="add-btn">
            + Guruh qo'shish
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="group-stat-card" style={{ position: 'relative' }}>
          <div style={{ color: '#7c3aed', marginBottom: '8px' }}><FaUsers size={20} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>Jami guruhlar</p>
          <h3 className="stat-value">{groups.length}</h3>
          <button style={{ position: 'absolute', top: '16px', right: '16px', color: '#9ca3af' }}><FiMoreVertical /></button>
        </div>
        <div className="group-stat-card" style={{ position: 'relative' }}>
          <div style={{ color: '#7c3aed', marginBottom: '8px' }}><FaUsers size={20} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>O'qituvchilar</p>
          <h3 className="stat-value">{teachers.length}</h3>
          <button style={{ position: 'absolute', top: '16px', right: '16px', color: '#9ca3af' }}><FiMoreVertical /></button>
        </div>
        <div className="group-stat-card" style={{ position: 'relative' }}>
          <div style={{ color: '#7c3aed', marginBottom: '8px' }}><FaUserGraduate size={20} /></div>
          <p className="stat-title" style={{ textAlign: 'left' }}>Max o'quvchilar</p>
          <h3 className="stat-value">{totalStudents}</h3>
          <button style={{ position: 'absolute', top: '16px', right: '16px', color: '#9ca3af' }}><FiMoreVertical /></button>
        </div>
      </div>

      {/* QIDIRUV */}
      <div className="content-card" style={{ marginBottom: '16px', padding: '16px 24px' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-container" style={{ flex: 1, minWidth: '200px' }}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Guruh nomi bo'yicha qidirish..."
              className="search-input"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
            />
          </div>
          <input
            type="number"
            placeholder="Max talabalar soni"
            className="form-input"
            style={{ width: '180px', margin: 0 }}
            value={searchMax}
            onChange={(e) => setSearchMax(e.target.value)}
          />
          <button type="submit" className="add-btn" style={{ whiteSpace: 'nowrap' }}>
            <FiSearch size={14} /> Qidirish
          </button>
          {(searchName || searchMax) && (
            <button type="button" className="toolbar-btn" onClick={() => { setSearchName(''); setSearchMax(''); fetchGroups(); }}>
              <FiX size={14} /> Tozalash
            </button>
          )}
        </form>
      </div>

      {/* JADVAL */}
      <div className="content-card">
        <div style={{ overflowX: 'auto' }}>
          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <div style={{
                width: '36px', height: '36px',
                border: '3px solid #e5e7eb', borderTopColor: '#7c3aed',
                borderRadius: '50%', animation: 'spin 1s linear infinite',
                margin: '0 auto 12px',
              }} />
              Yuklanmoqda...
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px', width: '120px' }}>Status</th>
                  <th>Guruh nomi</th>
                  <th>Kurs</th>
                  <th>Boshlanish</th>
                  <th>Vaqt</th>
                  <th>Xona</th>
                  <th>O'qituvchi</th>
                  <th>Max talaba</th>
                  <th style={{ textAlign: 'right', paddingRight: '24px' }}>
                    <FaSyncAlt
                      style={{ cursor: 'pointer' }}
                      onClick={() => fetchGroups(searchName, searchMax)}
                      title="Yangilash"
                    />
                  </th>
                </tr>
              </thead>
              <tbody>
                {groups.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                      <FaUsers size={32} style={{ marginBottom: '8px', opacity: 0.4 }} />
                      <div>Guruhlar yo'q</div>
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => (
                    <tr
                      key={group.id}
                      onClick={() => navigate(`/dashboard/groups/${group.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ paddingLeft: '24px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                          backgroundColor: group.is_active !== false ? '#d1fae5' : '#fee2e2',
                          color: group.is_active !== false ? '#065f46' : '#991b1b',
                        }}>
                          {group.is_active !== false ? 'FAOL' : 'FAOL EMAS'}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{group.name || '—'}</td>
                      <td>
                        <span className="badge-course">
                          {group.course?.name || group.course_name || '—'}
                        </span>
                      </td>
                      <td style={{ fontSize: '13px' }}>
                        {group.start_date ? group.start_date.slice(0, 10) : '—'}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{group.start_time || '—'}</div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>
                          {Array.isArray(group.week_day)
                            ? group.week_day.map(d => WEEK_DAYS.find(w => w.value === d)?.label || d).join(', ')
                            : '—'}
                        </div>
                      </td>
                      <td>{group.room?.name || group.room_name || '—'}</td>
                      <td>
                        {Array.isArray(group.teachers) && group.teachers.length > 0
                          ? getTeacherName(group.teachers[0])
                          : group.teacher_name || '—'}
                      </td>
                      <td>{group.max_student ?? '—'}</td>
                      <td style={{ textAlign: 'right', paddingRight: '24px' }}>
                        <button
                          style={{ color: '#ef4444' }}
                          title="O'chirish"
                          onClick={(e) => handleDelete(e, group.id)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ===== DRAWER — GURUH QO'SHISH ===== */}
      <div
        className={`right-drawer-overlay ${isModalOpen ? 'open' : ''}`}
        onClick={resetForm}
      >
        <div
          className={`right-drawer ${isModalOpen ? 'open' : ''}`}
          onClick={(e) => e.stopPropagation()}
          style={{ width: '440px', maxWidth: '100%' }}
        >
          <div className="drawer-header">
            <h2 className="drawer-title">Guruh qo'shish</h2>
            <button className="drawer-close" onClick={resetForm}><FiX /></button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>

            {/* Guruh nomi */}
            <div className="form-group">
              <label className="form-label">Guruh nomi <span style={{ color: 'red' }}>*</span></label>
              <input type="text" required placeholder="N-107" className="form-input"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            {/* Tavsif */}
            <div className="form-group">
              <label className="form-label">Tavsif</label>
              <input type="text" placeholder="Guruh haqida qisqacha..." className="form-input"
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            {/* Kurs */}
            <div className="form-group">
              <label className="form-label">Kurs <span style={{ color: 'red' }}>*</span></label>
              <select required className="form-input"
                value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
                <option value="">— Kurs tanlang —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* O'qituvchilar (multi-select) */}
            <div className="form-group">
              <label className="form-label">O'qituvchilar <span style={{ color: 'red' }}>*</span></label>
              {teachers.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#9ca3af' }}>O'qituvchilar yuklanmadi</p>
              ) : (
                <div style={{
                  border: '1px solid #e5e7eb', borderRadius: '8px',
                  maxHeight: '130px', overflowY: 'auto', padding: '8px',
                }}>
                  {teachers.map((t) => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={form.teachers.includes(Number(t.id))}
                        onChange={() => toggleTeacher(t.id)}
                      />
                      <span style={{ fontSize: '13px' }}>{getTeacherName(t)}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Xona */}
            <div className="form-group">
              <label className="form-label">Xona <span style={{ color: 'red' }}>*</span></label>
              <select required className="form-input"
                value={form.room_id} onChange={(e) => setForm({ ...form, room_id: e.target.value })}>
                <option value="">— Xona tanlang —</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} (max: {r.capacity})</option>
                ))}
              </select>
            </div>

            {/* Boshlanish sanasi */}
            <div className="form-group">
              <label className="form-label"><FiCalendar size={13} style={{ marginRight: 4 }} />Boshlanish sanasi <span style={{ color: 'red' }}>*</span></label>
              <input type="date" required className="form-input"
                value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            </div>

            {/* Dars vaqti */}
            <div className="form-group">
              <label className="form-label"><FiClock size={13} style={{ marginRight: 4 }} />Dars vaqti <span style={{ color: 'red' }}>*</span></label>
              <input type="time" required className="form-input"
                value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} />
            </div>

            {/* Hafta kunlari */}
            <div className="form-group">
              <label className="form-label">Hafta kunlari <span style={{ color: 'red' }}>*</span></label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                {WEEK_DAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleWeekDay(d.value)}
                    style={{
                      padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                      border: '1.5px solid',
                      borderColor: form.week_day.includes(d.value) ? '#7c3aed' : '#e5e7eb',
                      backgroundColor: form.week_day.includes(d.value) ? '#ede9fe' : 'transparent',
                      color: form.week_day.includes(d.value) ? '#7c3aed' : '#6b7280',
                      cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Max talabalar */}
            <div className="form-group">
              <label className="form-label">Max talabalar soni <span style={{ color: 'red' }}>*</span></label>
              <input type="number" required min="1" max="100" placeholder="20" className="form-input"
                value={form.max_student} onChange={(e) => setForm({ ...form, max_student: e.target.value })} />
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              marginTop: 'auto', paddingTop: '20px',
              borderTop: '1px solid #f3f4f6',
            }}>
              <button type="button" onClick={resetForm} className="btn-secondary" style={{ width: '48%' }}>
                Bekor qilish
              </button>
              <button type="submit" disabled={isSubmitting} className="btn-primary"
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
    </div>
  );
};

export default Groups;
