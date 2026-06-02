import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FiChevronLeft, FiBarChart2, FiX, FiMoreVertical, FiTrash2 } from 'react-icons/fi';
import { FaUser, FaClock, FaCheck, FaPlay } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { groupsAPI, homeworkAPI, lessonsAPI, filesAPI, parseApiError } from '../api/api';

const TAB_MAP = { malumotlar: 0, darsliklar: 1, davomat: 2 };
const TAB_BY_INDEX = ['malumotlar', 'darsliklar', 'davomat'];

const SUB_TABS = [
  { id: 'uyga-vazifa', label: 'Uyga vazifa' },
  { id: 'videolar', label: 'Videolar' },
  { id: 'imtihonlar', label: 'Imtihonlar' },
  { id: 'jurnal', label: 'Jurnal' },
];

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS_EN[d.getMonth()]}, ${d.getFullYear()} ${hours}:${minutes}`;
};

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${d.getDate()} ${MONTHS_EN[d.getMonth()]}, ${d.getFullYear()}`;
};

const unwrapList = (raw) => {
  const data = raw?.data?.data ?? raw?.data ?? raw ?? [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.homeworks)) return data.homeworks;
  if (Array.isArray(data?.lessons)) return data.lessons;
  if (Array.isArray(data?.files)) return data.files;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const parseFilesResponse = (res, groupId) => {
  const body = res?.data;
  let list = [];

  if (Array.isArray(body)) list = body;
  else if (Array.isArray(body?.data)) list = body.data;
  else if (Array.isArray(body?.files)) list = body.files;
  else if (body?.data && typeof body.data === 'object') {
    if (Array.isArray(body.data.files)) list = body.data.files;
    else list = Object.values(body.data).flat().filter((x) => x && typeof x === 'object');
  } else if (body && typeof body === 'object' && !Array.isArray(body)) {
    list = [body];
  }

  const flattened = [];
  for (const item of list) {
    if (Array.isArray(item.files)) {
      item.files.forEach((f) =>
        flattened.push({
          ...f,
          lesson_id: f.lesson_id || f.lessonId || item.lesson_id || item.id,
          lesson: f.lesson || item,
        })
      );
    } else if (item.file && typeof item.file === 'object') {
      flattened.push({
        ...item.file,
        lesson_id: item.lesson_id || item.id,
        lesson: item,
      });
    } else {
      flattened.push(item);
    }
  }

  return flattened
    .map((f) => ({
      ...f,
      group_id: f.group_id || f.groupId || groupId,
      lesson_id: f.lesson_id || f.lessonId || f.lesson?.id,
    }))
    .filter((f) => !groupId || !f.group_id || String(f.group_id) === String(groupId));
};

const getHomeworkTopic = (item) =>
  item.topic ||
  item.title ||
  item.mavzu ||
  item.lesson?.topic ||
  item.name ||
  '—';

const getHomeworkStats = (item) => ({
  students: item.students_count ?? item.student_count ?? item.total_students ?? item.students ?? 0,
  pending: item.pending_count ?? item.late_count ?? item.unchecked ?? item.waiting ?? 0,
  completed: item.completed_count ?? item.checked_count ?? item.done_count ?? item.approved ?? 0,
  givenAt: item.given_at || item.start_date || item.created_at || item.lesson?.start_time,
  deadline: item.deadline || item.end_date || item.expires_at || item.due_date,
  lessonDate: item.lesson_date || item.date || item.lesson?.date || item.lesson?.lesson_date,
});

const emptyHomeworkForm = {
  title: '',
  lesson_id: '',
  new_lesson_topic: '',
  create_new_lesson: false,
  file: null,
};

const emptyVideoForm = {
  lesson_id: '',
  file: null,
  new_lesson_topic: '',
  create_new_lesson: false,
};

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  const mb = Number(bytes) / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(2)} MB`;
  const kb = Number(bytes) / 1024;
  return `${kb.toFixed(0)} KB`;
};

const getVideoName = (file) =>
  file.name ||
  file.filename ||
  file.fileName ||
  file.original_name ||
  file.originalName ||
  file.title ||
  '—';

const getLessonName = (file) =>
  file.lesson?.topic || file.lesson_name || file.lesson_topic || file.topic || '—';

const getVideoStatus = (file) => {
  const status = file.status || file.state;
  if (!status || status === 'ready' || status === 'READY' || status === 'Tayyor') return 'Tayyor';
  return status;
};

const MONTH_SHORT = {
  January: 'Yan', February: 'Fev', March: 'Mar', April: 'Apr',
  May: 'May', June: 'Iyun', July: 'Iyul', August: 'Avg',
  September: 'Sen', October: 'Okt', November: 'Noy', December: 'Dek',
};

const getTeacherName = (t) =>
  t?.full_name ||
  `${t?.first_name || ''} ${t?.last_name || ''}`.trim() ||
  t?.name ||
  '—';

const getTeacherPhoto = (t) =>
  t?.photo || t?.image || t?.avatar || t?.profile_photo || null;

const parseSchedules = (raw) => {
  const data = raw?.data?.data ?? raw?.data ?? raw ?? [];
  const arr = Array.isArray(data) ? data : [data];
  if (!arr.length || !arr[0]) return [];

  const monthObj = arr[0];
  return Object.entries(monthObj)
    .filter(([key]) => !Number.isNaN(Number(key)))
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([monthNum, monthData]) => ({
      title: `${monthNum}-o'quv oyi`,
      isActive: monthData?.isActive,
      days: monthData?.days || [],
    }));
};

const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const initialTab = TAB_BY_INDEX[Number(tabParam)] || 'malumotlar';

  const [group, setGroup] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [subTab, setSubTab] = useState('uyga-vazifa');
  const [homeworkList, setHomeworkList] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [groupLessons, setGroupLessons] = useState([]);
  const [darsliklarLoading, setDarsliklarLoading] = useState(false);

  const [isHomeworkDrawerOpen, setIsHomeworkDrawerOpen] = useState(false);
  const [editingHomeworkId, setEditingHomeworkId] = useState(null);
  const [homeworkForm, setHomeworkForm] = useState(emptyHomeworkForm);
  const [isHomeworkSubmitting, setIsHomeworkSubmitting] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);

  const [isVideoDrawerOpen, setIsVideoDrawerOpen] = useState(false);
  const [videoForm, setVideoForm] = useState(emptyVideoForm);
  const [isVideoSubmitting, setIsVideoSubmitting] = useState(false);
  const [openVideoMenuId, setOpenVideoMenuId] = useState(null);
  const [playingVideo, setPlayingVideo] = useState(null);
  const [videoPlayerLoading, setVideoPlayerLoading] = useState(false);

  const [mentorOpen, setMentorOpen] = useState(true);
  const [paramsOpen, setParamsOpen] = useState(true);
  const [showAllMonths, setShowAllMonths] = useState(false);

  useEffect(() => {
    const tabFromUrl = TAB_BY_INDEX[Number(searchParams.get('tab'))];
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams({ tab: String(TAB_MAP[tabId]) });
  };

  const fetchGroupLessons = async () => {
    try {
      const res = await lessonsAPI.getMyGroupLessons(id);
      setGroupLessons(unwrapList(res));
    } catch (err) {
      console.error('Darslar xato:', err.response?.data || err.message);
      setGroupLessons([]);
    }
  };

  const fetchHomeworkList = async () => {
    setDarsliklarLoading(true);
    try {
      const res = await homeworkAPI.getByGroup(id);
      let list = unwrapList(res);

      if (list.length === 0) {
        const lessonsRes = await lessonsAPI.getMyGroupLessons(id);
        const lessons = unwrapList(lessonsRes);
        list = lessons.flatMap((lesson) => {
          if (Array.isArray(lesson.homeworks) && lesson.homeworks.length > 0) {
            return lesson.homeworks.map((hw) => ({ ...hw, lesson }));
          }
          if (lesson.homework) {
            return [{ ...lesson.homework, lesson }];
          }
          return [{ ...lesson, topic: lesson.topic, lesson_date: lesson.date || lesson.created_at }];
        });
      }

      setHomeworkList(list);
    } catch (err) {
      console.error('Darsliklar xato:', err.response?.data || err.message);
      toast.error("Darsliklarni yuklashda xato!");
      setHomeworkList([]);
    } finally {
      setDarsliklarLoading(false);
    }
  };

  const resetHomeworkForm = () => {
    setHomeworkForm(emptyHomeworkForm);
    setEditingHomeworkId(null);
    setIsHomeworkDrawerOpen(false);
  };

  const openAddHomework = async () => {
    setEditingHomeworkId(null);
    setHomeworkForm(emptyHomeworkForm);
    setIsHomeworkDrawerOpen(true);
    await fetchGroupLessons();
  };

  const openEditHomework = async (item) => {
    setOpenMenuId(null);
    setEditingHomeworkId(item.id);
    setHomeworkForm({
      title: getHomeworkTopic(item),
      lesson_id: String(item.lesson_id || item.lesson?.id || ''),
      new_lesson_topic: '',
      create_new_lesson: false,
      file: null,
    });
    setIsHomeworkDrawerOpen(true);
    await fetchGroupLessons();
  };

  const handleHomeworkSubmit = async (e) => {
    e.preventDefault();

    // Yangi formada title = description yoki dars nomi
    const titleValue = (homeworkForm.title || '').trim()
      || (homeworkForm.description || '').trim()
      || (homeworkForm.create_new_lesson
          ? homeworkForm.new_lesson_topic.trim()
          : groupLessons.find(l => String(l.id) === String(homeworkForm.lesson_id))?.topic || '');

    if (!titleValue) {
      toast.error('Izoh yoki mavzu kiriting!');
      return;
    }

    let lessonId = homeworkForm.lesson_id;

    if (homeworkForm.create_new_lesson) {
      if (!homeworkForm.new_lesson_topic.trim()) {
        toast.error('Yangi dars mavzusini kiriting!');
        return;
      }
    } else if (!lessonId) {
      toast.error('Mavzulardan birini tanlang!');
      return;
    }

    setIsHomeworkSubmitting(true);
    try {
      if (homeworkForm.create_new_lesson) {
        const lessonRes = await groupsAPI.createLesson(id, {
          group_id: Number(id),
          topic: homeworkForm.new_lesson_topic.trim(),
          description: titleValue,
        });
        const createdLesson = lessonRes.data?.data || lessonRes.data;
        lessonId = createdLesson?.id;
        if (!lessonId) throw new Error('Dars yaratilmadi');
      }

      const formData = new FormData();
      formData.append('group_id', String(id));
      formData.append('lesson_id', String(lessonId));
      formData.append('title', titleValue);
      if (homeworkForm.description?.trim()) formData.append('description', homeworkForm.description.trim());
      if (homeworkForm.file) formData.append('file', homeworkForm.file);

      if (editingHomeworkId) {
        await homeworkAPI.update(editingHomeworkId, formData);
        toast.success('Uyga vazifa yangilandi!');
      } else {
        await homeworkAPI.create(formData);
        toast.success("Uyga vazifa qo'shildi!");
      }

      resetHomeworkForm();
      fetchHomeworkList();
      fetchGroupLessons();
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.message && Array.isArray(errData.message)) {
        errData.message.forEach((m) => toast.error(m, { duration: 6000 }));
      } else {
        toast.error(errData?.message || errData?.error || 'Xato yuz berdi!', { duration: 6000 });
      }
    } finally {
      setIsHomeworkSubmitting(false);
    }
  };

  const handleDeleteHomework = async (item) => {
    setOpenMenuId(null);
    if (!window.confirm(`"${getHomeworkTopic(item)}" vazifasini o'chirishni tasdiqlaysizmi?`)) return;

    try {
      await homeworkAPI.delete(item.id);
      toast.success("Uyga vazifa o'chirildi!");
      fetchHomeworkList();
    } catch (err) {
      const errData = err.response?.data;
      toast.error(errData?.message || "O'chirishda xato!");
    }
  };

  const fetchVideoList = async () => {
    setDarsliklarLoading(true);
    try {
      const res = await filesAPI.getFiles(id);
      setMediaList(parseFilesResponse(res, id));
    } catch (err) {
      console.error('Videolar xato:', err.response?.data || err.message);
      toast.error(err.response?.data?.message || 'Videolarni yuklashda xato!');
      setMediaList([]);
    } finally {
      setDarsliklarLoading(false);
    }
  };

  const closeVideoPlayer = () => {
    if (playingVideo?.blobUrl) URL.revokeObjectURL(playingVideo.blobUrl);
    setPlayingVideo(null);
  };

  const openVideoPlayer = async (file) => {
    setOpenVideoMenuId(null);

    const fileId = file.id ?? file.file_id ?? file.fileId;
    if (!fileId) {
      toast.error('Video ID topilmadi!');
      return;
    }

    setVideoPlayerLoading(true);
    try {
      const res = await filesAPI.getOne(fileId);
      const contentType = res.headers['content-type'] || 'video/mp4';

      if (contentType.includes('application/json')) {
        const text = await res.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || 'Video topilmadi');
      }

      const blob =
        res.data instanceof Blob
          ? res.data
          : new Blob([res.data], { type: contentType });
      const blobUrl = URL.createObjectURL(blob);
      setPlayingVideo({ name: getVideoName(file), blobUrl });
    } catch (err) {
      console.error('Video ochish xato:', err.response?.status, err.response?.data);
      let message = "Videoni ochib bo'lmadi!";
      if (err.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          message = json.message || message;
        } catch {
          // ignore
        }
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message) {
        message = err.message;
      }
      toast.error(message);
    } finally {
      setVideoPlayerLoading(false);
    }
  };

  const resetVideoForm = () => {
    setVideoForm(emptyVideoForm);
    setIsVideoDrawerOpen(false);
  };

  const openAddVideo = async () => {
    setVideoForm(emptyVideoForm);
    setIsVideoDrawerOpen(true);
    await fetchGroupLessons();
  };

  const handleVideoUpload = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    const files = videoForm.files || [];
    if (files.length === 0) {
      toast.error('Video fayllarni tanlang!');
      return;
    }

    // Har bir faylda dars tanlangan bo'lishi kerak
    const missing = files.find(item => !item.lesson_id);
    if (missing) {
      toast.error(`"${missing.file.name}" uchun darsni tanlang!`);
      return;
    }

    setIsVideoSubmitting(true);
    let successCount = 0;
    try {
      for (const item of files) {
        const groupId = Number(id);
        const lessonIdNum = Number(item.lesson_id);
        try {
          await filesAPI.upload(groupId, lessonIdNum, item.file);
          successCount++;
        } catch (err) {
          const msg = await parseApiError(err);
          toast.error(`${item.file.name}: ${msg}`, { duration: 5000 });
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} ta video muvaffaqiyatli yuklandi!`);
        resetVideoForm();
        await fetchVideoList();
        await fetchGroupLessons();
      }
    } finally {
      setIsVideoSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchGroupDetails = async () => {
      setIsLoading(true);
      try {
        const [groupRes, scheduleRes, studentsRes] = await Promise.allSettled([
          groupsAPI.getOne(id),
          groupsAPI.getSchedules(id),
          groupsAPI.getStudents(id),
        ]);

        if (groupRes.status !== 'fulfilled') throw groupRes.reason;

        const groupData = groupRes.value.data?.data || groupRes.value.data;
        setGroup(groupData);

        if (scheduleRes.status === 'fulfilled') {
          setSchedules(parseSchedules(scheduleRes.value.data));
        }

        if (studentsRes.status === 'fulfilled') {
          const studentData = studentsRes.value.data?.data || studentsRes.value.data || [];
          setStudents(Array.isArray(studentData) ? studentData : []);
        }
      } catch (err) {
        console.error('Guruh ma\'lumotlari xato:', err.response?.data || err.message);
        toast.error("Guruh ma'lumotlarini yuklashda xato!");
        setGroup(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchGroupDetails();
  }, [id]);

  useEffect(() => {
    if (activeTab !== 'darsliklar' || !id) return;

    if (subTab === 'uyga-vazifa') {
      fetchHomeworkList();
      fetchGroupLessons();
    } else if (subTab === 'videolar') {
      fetchVideoList();
      fetchGroupLessons();
    } else {
      setHomeworkList([]);
      setMediaList([]);
    }
  }, [activeTab, subTab, id]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '100px', color: '#6b7280' }}>
        <div style={{
          width: '36px', height: '36px',
          border: '3px solid #e5e7eb', borderTopColor: '#7c3aed',
          borderRadius: '50%', animation: 'spin 1s linear infinite',
          margin: '0 auto 12px',
        }} />
        Yuklanmoqda...
      </div>
    );
  }

  if (!group) {
    return (
      <div style={{ textAlign: 'center', paddingTop: '100px' }}>
        <h2>Guruh topilmadi</h2>
        <button onClick={() => navigate('/groups')}>
          Orqaga
        </button>
      </div>
    );
  }

  const teachers = Array.isArray(group.teachers) ? group.teachers : [];

  const studentCount = students.length > 0
    ? students.length
    : Array.isArray(group.students)
      ? group.students.length
      : group.student_count ?? group.students_count ?? group.current_students ?? 0;

  const courseDuration =
    group.course?.duration ??
    group.course?.duration_month ??
    group.course_duration ??
    group.duration ??
    '—';

  const durationNumber = (() => {
    if (typeof courseDuration === 'number') return `${courseDuration}.0`;
    const match = String(courseDuration).match(/[\d.]+/);
    return match ? (match[0].includes('.') ? match[0] : `${match[0]}.0`) : '—';
  })();

  const lessonsPerMonth =
    group.lessons_per_month ??
    group.lesson_per_month ??
    group.monthly_lesson_count ??
    group.course?.lessons_per_month ??
    (schedules[0]?.days?.length ?? '—');

  const scheduleTotal = schedules.reduce(
    (sum, m) => sum + (m.days?.length || 0),
    0
  );

  const totalLessons =
    group.total_lessons ??
    group.total_lesson_count ??
    group.course?.total_lessons ??
    (scheduleTotal > 0 ? scheduleTotal : '—');

  const averageAge =
    group.average_age ??
    group.avg_age ??
    group.middle_age ??
    group.averageAge ??
    '—';

  const params = [
    { label: 'Kurs', value: group.course?.name || group.course_name || '—' },
    { label: "O'rta yosh", value: averageAge },
    { label: "O'quvchilar sig'imi", value: group.max_student ?? '—' },
    { label: "Mavjud o'quvchilar", value: studentCount },
    { label: "O'quv oyidagi darslar soni", value: lessonsPerMonth },
    { label: 'Kurs davomiyligi (oy)', value: durationNumber },
    { label: 'Jami darslar soni', value: totalLessons },
  ];

  const firstMonth = schedules[0];
  const restMonths = schedules.slice(1);

  const renderMonthDays = (month) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
      {month.days.map((d, idx) => (
        <div
          key={idx}
          style={{
            width: '60px',
            height: '70px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: d.isCompleted ? '#f0fdf4' : '#fff',
          }}
        >
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {MONTH_SHORT[d.month] || d.month?.slice(0, 3) || ''}
          </span>
          <strong>{d.day}</strong>
        </div>
      ))}
    </div>
  );

  return (
    <>
    {/* UYGA VAZIFA TO'LIQ SAHIFA FORMASI */}
    {isHomeworkDrawerOpen && (
      <div style={{ padding: '32px 40px', background: '#fff', borderRadius: '12px', minHeight: '80vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <button
            type="button"
            onClick={resetHomeworkForm}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
          >
            <FiChevronLeft size={22} color="#374151" />
          </button>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#111827' }}>
            {editingHomeworkId ? 'Uyga vazifani tahrirlash' : 'Yangi uyga vazifa yaratish'}
          </h2>
        </div>

        <form onSubmit={handleHomeworkSubmit} style={{ maxWidth: '660px' }}>
          {/* MAVZU */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#111827', marginBottom: '6px' }}>
              * Mavzu
            </label>
            {homeworkForm.create_new_lesson ? (
              <input
                type="text"
                required
                placeholder="Yangi dars mavzusini kiriting"
                value={homeworkForm.new_lesson_topic}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, new_lesson_topic: e.target.value })}
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #d1d5db', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
              />
            ) : (
              <div style={{ position: 'relative' }}>
                <select
                  value={homeworkForm.lesson_id}
                  onChange={(e) => setHomeworkForm({ ...homeworkForm, lesson_id: e.target.value })}
                  style={{ width: '100%', borderRadius: '8px', border: '1px solid #d1d5db', padding: '10px 36px 10px 14px', fontSize: '14px', appearance: 'none', background: '#fff', cursor: 'pointer', outline: 'none', boxSizing: 'border-box', color: homeworkForm.lesson_id ? '#111827' : '#9ca3af' }}
                >
                  <option value="">Mavzulardan birini tanlang</option>
                  {groupLessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.topic || lesson.title || `Dars #${lesson.id}`}
                    </option>
                  ))}
                </select>
                <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280', fontSize: '12px' }}>▼</span>
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px', cursor: 'pointer', fontSize: '13px', color: '#6b7280' }}>
              <input
                type="checkbox"
                checked={homeworkForm.create_new_lesson}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, create_new_lesson: e.target.checked, lesson_id: '' })}
              />
              Yangi dars yaratish
            </label>
          </div>

          {/* IZOH */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#111827', marginBottom: '6px' }}>
              * Izoh
            </label>
            <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', overflow: 'hidden' }}>
              {/* Toolbar */}
              <div style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', gap: '4px', background: '#fafafa', borderBottom: '1px solid #e5e7eb', flexWrap: 'wrap' }}>
                {['H1', 'H2'].map((h) => (
                  <button key={h} type="button" style={{ padding: '2px 7px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', color: '#374151' }}>{h}</button>
                ))}
                <span style={{ width: '1px', height: '16px', background: '#e5e7eb', margin: '0 2px' }} />
                <select style={{ border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px', padding: '2px 4px', background: '#fff', cursor: 'pointer' }}>
                  <option>Sans Serif</option><option>Serif</option><option>Monospace</option>
                </select>
                <select style={{ border: '1px solid #e5e7eb', borderRadius: '4px', fontSize: '11px', padding: '2px 4px', background: '#fff', cursor: 'pointer' }}>
                  <option>Normal</option><option>Small</option><option>Large</option>
                </select>
                <span style={{ width: '1px', height: '16px', background: '#e5e7eb', margin: '0 2px' }} />
                {[{ t: 'B', s: { fontWeight: 700 } }, { t: 'I', s: { fontStyle: 'italic' } }, { t: 'U', s: { textDecoration: 'underline' } }, { t: 'S', s: { textDecoration: 'line-through' } }].map(({ t, s }) => (
                  <button key={t} type="button" style={{ padding: '2px 7px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#374151', ...s }}>{t}</button>
                ))}
                {['❝', '<>', '≡', '⊟', '⊞', '⊠', '🔗'].map((icon, i) => (
                  <button key={i} type="button" style={{ padding: '2px 6px', border: '1px solid #e5e7eb', borderRadius: '4px', background: '#fff', fontSize: '12px', cursor: 'pointer', color: '#374151' }}>{icon}</button>
                ))}
              </div>
              <textarea
                placeholder="Vazifa haqida batafsil ma'lumot kiriting ..."
                value={homeworkForm.description || ''}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, description: e.target.value })}
                rows={6}
                style={{ width: '100%', border: 'none', padding: '12px 14px', fontSize: '14px', resize: 'vertical', outline: 'none', fontFamily: 'inherit', color: '#374151', boxSizing: 'border-box', display: 'block' }}
              />
            </div>
          </div>

          {/* FAYL YUKLASH */}
          <div style={{ marginBottom: '28px' }}>
            <div
              onClick={() => document.getElementById('hw-file-input-main').click()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setHomeworkForm({ ...homeworkForm, file: f }); }}
              onDragOver={(e) => e.preventDefault()}
              style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '32px 24px', textAlign: 'center', cursor: 'pointer', background: '#fff' }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Faylni tanlash yoki shu yerga tashlang</p>
              <input id="hw-file-input-main" type="file" accept=".pdf,.zip,.rar,.doc,.docx,.ppt,.pptx,.txt,image/*" style={{ display: 'none' }} onChange={(e) => setHomeworkForm({ ...homeworkForm, file: e.target.files?.[0] || null })} />
            </div>
            {homeworkForm.file && (
              <div style={{ marginTop: '8px', padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#374151' }}>{homeworkForm.file.name}</span>
                <button type="button" onClick={() => setHomeworkForm({ ...homeworkForm, file: null })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                  <FiX size={15} />
                </button>
              </div>
            )}
          </div>

          {/* TUGMALAR */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={resetHomeworkForm} style={{ padding: '10px 28px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
              Bekor qilish
            </button>
            <button type="submit" disabled={isHomeworkSubmitting} style={{ padding: '10px 28px', borderRadius: '8px', border: 'none', background: '#10b981', fontSize: '14px', fontWeight: 600, cursor: isHomeworkSubmitting ? 'not-allowed' : 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', opacity: isHomeworkSubmitting ? 0.7 : 1 }}>
              {isHomeworkSubmitting ? (<><div style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Saqlanmoqda...</>) : "E'lon qilish"}
            </button>
          </div>
        </form>
      </div>
    )}

    {!isHomeworkDrawerOpen && (
    <div style={{ padding: '24px', background: '#fff', borderRadius: '12px' }}>
      {/* HEADER */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '30px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/groups')}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <FiChevronLeft size={24} />
          </button>

          <h1 style={{ margin: 0, fontSize: '28px' }}>
            {group.name || '—'}
          </h1>

          <span style={{
            background: group.is_active !== false ? '#dcfce7' : '#fee2e2',
            color: group.is_active !== false ? '#16a34a' : '#dc2626',
            padding: '4px 12px',
            borderRadius: '6px',
            fontWeight: '600',
          }}>
            {group.is_active !== false ? 'Aktiv' : 'Faol emas'}
          </span>
        </div>

        <button style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '10px 18px', borderRadius: '8px',
          border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer',
        }}>
          <FiBarChart2 />
          Statistika
        </button>
      </div>

      {/* TABS */}
      <div style={{
        display: 'flex', gap: '30px',
        borderBottom: '1px solid #e5e7eb', marginBottom: '24px',
      }}>
        {[
          { id: 'malumotlar', label: "Ma'lumotlar" },
          { id: 'darsliklar', label: 'Guruh darsliklari' },
          { id: 'davomat', label: 'Akademik davomati' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              padding: '14px 0', border: 'none', background: 'none',
              cursor: 'pointer', fontWeight: '600',
              borderBottom: activeTab === tab.id ? '2px solid #7c3aed' : '2px solid transparent',
              color: activeTab === tab.id ? '#7c3aed' : '#6b7280',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'malumotlar' && (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '24px', marginBottom: '24px',
          }}>
            {/* MENTORLAR */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                background: '#3b82f6', color: '#fff', padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <h3 style={{ margin: 0 }}>Guruh mentorlari</h3>
                <FiX size={18} style={{ cursor: 'pointer' }} onClick={() => setMentorOpen(!mentorOpen)} />
              </div>

              <div style={{
                maxHeight: mentorOpen ? '600px' : '0px',
                opacity: mentorOpen ? 1 : 0,
                overflow: 'hidden', transition: 'all 0.4s ease',
              }}>
                {teachers.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af' }}>
                    Mentorlar topilmadi
                  </div>
                ) : (
                  teachers.map((teacher, idx) => {
                    const photo = getTeacherPhoto(teacher);
                    return (
                      <div
                        key={teacher.id || idx}
                        style={{
                          padding: '24px', display: 'flex', flexDirection: 'column',
                          alignItems: 'center',
                          borderBottom: idx < teachers.length - 1 ? '1px solid #f3f4f6' : 'none',
                        }}
                      >
                        {photo ? (
                          <img
                            src={photo}
                            alt={getTeacherName(teacher)}
                            style={{
                              width: '120px', height: '120px',
                              borderRadius: '50%', marginBottom: '16px', objectFit: 'cover',
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '120px', height: '120px', borderRadius: '50%',
                            marginBottom: '16px', background: '#ede9fe',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '32px', fontWeight: '700', color: '#7c3aed',
                          }}>
                            {getTeacherName(teacher).substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <h3 style={{ margin: 0, color: '#10b981' }}>Teacher</h3>
                        <h2 style={{ marginTop: '10px', marginBottom: 0 }}>
                          {getTeacherName(teacher)}
                        </h2>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* PARAMETRLAR */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{
                background: '#3b82f6', color: '#fff', padding: '16px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <h3 style={{ margin: 0 }}>Parametrlar</h3>
                <FiX size={18} style={{ cursor: 'pointer' }} onClick={() => setParamsOpen(!paramsOpen)} />
              </div>

              <div style={{
                maxHeight: paramsOpen ? '700px' : '0px',
                opacity: paramsOpen ? 1 : 0,
                overflow: 'hidden', transition: 'all 0.4s ease',
              }}>
                <div style={{ padding: '20px' }}>
                  {params.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '12px 0',
                        borderBottom: '1px solid #f3f4f6',
                      }}
                    >
                      <span>{item.label}</span>
                      <strong>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* DARS JADVALI */}
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '24px' }}>
            <h2 style={{ marginBottom: '24px' }}>Dars jadvali</h2>

            {schedules.length === 0 ? (
              <p style={{ color: '#9ca3af', textAlign: 'center', padding: '20px' }}>
                Dars jadvali mavjud emas
              </p>
            ) : (
              <>
                {firstMonth && (
                  <div style={{ marginBottom: '40px' }}>
                    <h3>{firstMonth.title}</h3>
                    {renderMonthDays(firstMonth)}
                  </div>
                )}

                {restMonths.length > 0 && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
                      <button
                        onClick={() => setShowAllMonths(!showAllMonths)}
                        style={{
                          padding: '12px 30px', border: '1px solid #e5e7eb',
                          background: 'white', borderRadius: '8px', cursor: 'pointer',
                        }}
                      >
                        {showAllMonths ? 'Yopish' : "Barchasini ko'rish"}
                      </button>
                    </div>

                    {showAllMonths && restMonths.map((month, index) => (
                      <div key={index} style={{ marginBottom: '40px' }}>
                        <h3>{month.title}</h3>
                        {renderMonthDays(month)}
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}

      {activeTab === 'darsliklar' && (
        <>
          {/* SUB TABS */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f3f4f6',
            borderRadius: '10px',
            padding: '6px 8px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {SUB_TABS.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSubTab(st.id)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '14px',
                    cursor: 'pointer',
                    background: subTab === st.id ? '#fff' : 'transparent',
                    color: subTab === st.id ? '#111827' : '#6b7280',
                    boxShadow: subTab === st.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  }}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {(subTab === 'uyga-vazifa' || subTab === 'videolar') && (
            <button
              type="button"
              style={{
                background: '#10b981',
                color: '#fff',
                padding: '8px 18px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '14px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
              onClick={subTab === 'uyga-vazifa' ? openAddHomework : openAddVideo}
            >
              + Qo'shish
            </button>
            )}
          </div>

          {darsliklarLoading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <div style={{
                width: '36px', height: '36px',
                border: '3px solid #e5e7eb', borderTopColor: '#7c3aed',
                borderRadius: '50%', animation: 'spin 1s linear infinite',
                margin: '0 auto 12px',
              }} />
              Yuklanmoqda...
            </div>
          ) : subTab === 'uyga-vazifa' ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Mavzu</th>
                    <th style={{ width: '60px', textAlign: 'center' }}>
                      <FaUser size={14} color="#9ca3af" />
                    </th>
                    <th style={{ width: '60px', textAlign: 'center' }}>
                      <FaClock size={14} color="#9ca3af" />
                    </th>
                    <th style={{ width: '60px', textAlign: 'center' }}>
                      <FaCheck size={14} color="#9ca3af" />
                    </th>
                    <th>Berilgan vaqt</th>
                    <th>Tugash vaqt</th>
                    <th>Dars sanasi</th>
                    <th style={{ width: '50px' }} />
                  </tr>
                </thead>
                <tbody>
                  {homeworkList.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                        Uyga vazifalar yo'q
                      </td>
                    </tr>
                  ) : (
                    homeworkList.map((item, idx) => {
                      const stats = getHomeworkStats(item);
                      return (
                        <tr key={item.id || idx}>
                          <td>{idx + 1}</td>
                          <td style={{ fontWeight: '600' }}>{getHomeworkTopic(item)}</td>
                          <td style={{ textAlign: 'center', color: '#6b7280' }}>{stats.students}</td>
                          <td style={{ textAlign: 'center', color: '#6b7280' }}>{stats.pending}</td>
                          <td style={{ textAlign: 'center', color: '#6b7280' }}>{stats.completed}</td>
                          <td style={{ fontSize: '13px', color: '#374151' }}>{formatDateTime(stats.givenAt)}</td>
                          <td style={{ fontSize: '13px', color: '#374151' }}>{formatDateTime(stats.deadline)}</td>
                          <td style={{ fontSize: '13px', color: '#374151' }}>{formatDate(stats.lessonDate)}</td>
                          <td style={{ textAlign: 'center', position: 'relative' }}>
                            {(item.title || item.lesson_id) && item.id ? (
                              <>
                            <button
                              type="button"
                              style={{ color: '#9ca3af', padding: '4px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === item.id ? null : item.id);
                              }}
                            >
                              <FiMoreVertical size={18} />
                            </button>
                            {openMenuId === item.id && (
                              <div style={{
                                position: 'absolute',
                                right: '24px',
                                top: '100%',
                                background: '#fff',
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 10,
                                minWidth: '140px',
                                overflow: 'hidden',
                              }}>
                                <button
                                  type="button"
                                  style={{
                                    display: 'block', width: '100%', padding: '10px 16px',
                                    textAlign: 'left', background: 'none', border: 'none',
                                    cursor: 'pointer', fontSize: '14px',
                                  }}
                                  onClick={() => openEditHomework(item)}
                                >
                                  Tahrirlash
                                </button>
                                <button
                                  type="button"
                                  style={{
                                    display: 'block', width: '100%', padding: '10px 16px',
                                    textAlign: 'left', background: 'none', border: 'none',
                                    cursor: 'pointer', fontSize: '14px', color: '#ef4444',
                                  }}
                                  onClick={() => handleDeleteHomework(item)}
                                >
                                  O'chirish
                                </button>
                              </div>
                            )}
                              </>
                            ) : '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : subTab === 'videolar' ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Video nomi</th>
                    <th>Dars nomi</th>
                    <th>Status</th>
                    <th>Dars sanasi</th>
                    <th>Hajmi</th>
                    <th>Qo'shilgan vaqti</th>
                    <th style={{ width: '50px' }} />
                  </tr>
                </thead>
                <tbody>
                  {mediaList.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                        Videolar yo'q
                      </td>
                    </tr>
                  ) : (
                    mediaList.map((file, idx) => {
                      const rowKey = file.id ?? idx;
                      return (
                        <tr key={rowKey}>
                          <td>{idx + 1}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <button
                                type="button"
                                onClick={() => openVideoPlayer(file)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '10px',
                                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                }}
                              >
                                <span style={{
                                  width: '28px', height: '28px', borderRadius: '50%',
                                  background: '#ede9fe', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                  <FaPlay size={10} color="#7c3aed" style={{ marginLeft: '2px' }} />
                                </span>
                                <span style={{ color: '#2563eb', fontWeight: '600' }}>
                                  {getVideoName(file)}
                                </span>
                              </button>
                            </div>
                          </td>
                          <td>{getLessonName(file)}</td>
                          <td>
                            <span style={{
                              padding: '3px 10px', borderRadius: '12px', fontSize: '11px',
                              fontWeight: '600', backgroundColor: '#d1fae5', color: '#065f46',
                            }}>
                              {getVideoStatus(file)}
                            </span>
                          </td>
                          <td style={{ fontSize: '13px', color: '#374151' }}>
                            {formatDate(file.lesson_date || file.lesson?.date || file.lesson?.created_at)}
                          </td>
                          <td style={{ fontSize: '13px', color: '#374151' }}>
                            {formatFileSize(file.size || file.file_size)}
                          </td>
                          <td style={{ fontSize: '13px', color: '#374151' }}>
                            {formatDate(file.created_at || file.uploaded_at || file.createdAt)}
                          </td>
                          <td style={{ textAlign: 'center', position: 'relative' }}>
                            <button
                              type="button"
                              style={{ color: '#9ca3af', padding: '4px' }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenVideoMenuId(openVideoMenuId === rowKey ? null : rowKey);
                              }}
                            >
                              <FiMoreVertical size={18} />
                            </button>
                            {openVideoMenuId === rowKey && (
                              <div style={{
                                position: 'absolute', right: '24px', top: '100%',
                                background: '#fff', border: '1px solid #e5e7eb',
                                borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                zIndex: 10, minWidth: '140px', overflow: 'hidden',
                              }}>
                                <button
                                  type="button"
                                  style={{
                                    display: 'block', width: '100%', padding: '10px 16px',
                                    textAlign: 'left', background: 'none', border: 'none',
                                    cursor: 'pointer', fontSize: '14px',
                                  }}
                                  onClick={() => openVideoPlayer(file)}
                                >
                                  Ko'rish
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
              {subTab === 'imtihonlar' ? 'Imtihonlar mavjud emas' : 'Jurnal mavjud emas'}
            </div>
          )}
        </>
      )}

      {activeTab === 'davomat' && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          Akademik davomat tez orada qo'shiladi
        </div>
      )}
    </div>
    )}

    {/* VIDEO PLAYER MODAL */}
    {(playingVideo || videoPlayerLoading) && (
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}
        onClick={closeVideoPlayer}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: '#fff', borderRadius: '12px', width: '100%',
            maxWidth: '900px', overflow: 'hidden',
          }}
        >
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
          }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>
              {playingVideo?.name || 'Video yuklanmoqda...'}
            </h3>
            <button type="button" onClick={closeVideoPlayer} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <FiX size={22} />
            </button>
          </div>
          <div style={{ background: '#000', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {videoPlayerLoading ? (
              <div style={{ color: '#fff', padding: '40px' }}>Yuklanmoqda...</div>
            ) : playingVideo?.blobUrl ? (
              <video
                src={playingVideo.blobUrl}
                controls
                autoPlay
                style={{ width: '100%', maxHeight: '70vh' }}
              />
            ) : null}
          </div>
        </div>
      </div>
    )}

    {/* VIDEO QO'SHISH DRAWER */}
    {/* VIDEO QO'SHISH MODAL */}
    {isVideoDrawerOpen && (
      <div
        onClick={resetVideoForm}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '620px', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: '1px solid #f3f4f6' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Qo&apos;shish</h3>
            <button type="button" onClick={resetVideoForm} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
              <FiX size={20} />
            </button>
          </div>

          <div style={{ padding: '20px 24px' }}>
            {/* Drag & Drop zona */}
            <div
              onClick={() => document.getElementById('video-multi-input').click()}
              onDrop={(e) => {
                e.preventDefault();
                const files = Array.from(e.dataTransfer.files);
                const videoFiles = files.filter(f => f.type.startsWith('video/') || /\.(mp4|webm|mpeg|avi|mkv|m4v|ogm|mov)$/i.test(f.name));
                if (videoFiles.length > 0) {
                  setVideoForm(prev => ({
                    ...prev,
                    files: [...(prev.files || []), ...videoFiles.map(f => ({ file: f, lesson_id: '', name: f.name }))],
                  }));
                }
              }}
              onDragOver={(e) => e.preventDefault()}
              style={{ border: '1.5px dashed #d1d5db', borderRadius: '10px', padding: '32px 20px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', marginBottom: '16px' }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#111827', fontSize: '14px' }}>
                Videofaylni yuklash uchun ushbu hudud ustiga bosing yoki faylni shu yerga olib keling
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9ca3af' }}>
                Videofayl: .mp4, .webm, .mpeg, .avi, .mkv, .m4v, .ogm, .mov formatlaridan birida bo&apos;lishi kerak
              </p>
              <input
                id="video-multi-input"
                type="file"
                accept="video/*,.mp4,.mov,.avi,.mkv,.webm,.mpeg,.m4v,.ogm"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setVideoForm(prev => ({
                    ...prev,
                    files: [...(prev.files || []), ...files.map(f => ({ file: f, lesson_id: '', name: f.name }))],
                  }));
                  e.target.value = '';
                }}
              />
            </div>

            {/* Jadval — tanlangan fayllar */}
            {(videoForm.files || []).length > 0 && (
              <div style={{ overflowX: 'auto', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <th style={{ padding: '8px 10px', textAlign: 'left', color: '#374151', fontWeight: 600 }}>File name</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', color: '#374151', fontWeight: 600 }}>* Dars</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left', color: '#374151', fontWeight: 600 }}>* Video nomi</th>
                      <th style={{ padding: '8px 10px', textAlign: 'center', color: '#374151', fontWeight: 600 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(videoForm.files || []).map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '8px 10px', color: '#6b7280', maxWidth: '130px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.file.name}
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <select
                            value={item.lesson_id}
                            onChange={(e) => {
                              const updated = [...(videoForm.files || [])];
                              updated[idx] = { ...updated[idx], lesson_id: e.target.value };
                              setVideoForm(prev => ({ ...prev, files: updated }));
                            }}
                            style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', background: '#fff', cursor: 'pointer', minWidth: '120px' }}
                          >
                            <option value="">Darsni tanlang</option>
                            {groupLessons.map((lesson) => (
                              <option key={lesson.id} value={lesson.id}>
                                {lesson.topic || lesson.title || `Dars #${lesson.id}`}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '8px 10px' }}>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const updated = [...(videoForm.files || [])];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setVideoForm(prev => ({ ...prev, files: updated }));
                            }}
                            style={{ border: '1px solid #d1d5db', borderRadius: '6px', padding: '5px 8px', fontSize: '12px', width: '100%', boxSizing: 'border-box' }}
                          />
                        </td>
                        <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = (videoForm.files || []).filter((_, i) => i !== idx);
                              setVideoForm(prev => ({ ...prev, files: updated }));
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Tugmalar */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button type="button" onClick={resetVideoForm} style={{ padding: '9px 24px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                Bekor qilish
              </button>
              <button
                type="button"
                disabled={isVideoSubmitting || !(videoForm.files || []).length}
                onClick={handleVideoUpload}
                style={{ padding: '9px 24px', borderRadius: '8px', border: 'none', background: isVideoSubmitting || !(videoForm.files || []).length ? '#d1d5db' : '#10b981', fontSize: '14px', fontWeight: 600, cursor: isVideoSubmitting || !(videoForm.files || []).length ? 'not-allowed' : 'pointer', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {isVideoSubmitting ? (
                  <><div style={{ width: '15px', height: '15px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />Yuklanmoqda...</>
                ) : 'Fayllarni yuklash'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default GroupDetails;
