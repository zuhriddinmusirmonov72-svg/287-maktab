import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FiChevronLeft, FiBarChart2, FiX, FiMoreVertical } from 'react-icons/fi';
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

    if (!homeworkForm.title.trim()) {
      toast.error('Mavzuni kiriting!');
      return;
    }

    let lessonId = homeworkForm.lesson_id;

    if (homeworkForm.create_new_lesson) {
      if (!homeworkForm.new_lesson_topic.trim()) {
        toast.error('Yangi dars mavzusini kiriting!');
        return;
      }
    } else if (!lessonId) {
      toast.error('Darsni tanlang yoki yangi dars yarating!');
      return;
    }

    setIsHomeworkSubmitting(true);
    try {
      if (homeworkForm.create_new_lesson) {
        const lessonRes = await groupsAPI.createLesson(id, {
          group_id: Number(id),
          topic: homeworkForm.new_lesson_topic.trim(),
          description: homeworkForm.title.trim(),
        });
        const createdLesson = lessonRes.data?.data || lessonRes.data;
        lessonId = createdLesson?.id;
        if (!lessonId) throw new Error('Dars yaratilmadi');
      }

      const formData = new FormData();
      formData.append('group_id', String(id));
      formData.append('lesson_id', String(lessonId));
      formData.append('title', homeworkForm.title.trim());
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
    e.preventDefault();

    if (!videoForm.file) {
      toast.error('Video faylni tanlang!');
      return;
    }

    const maxSizeMb = 500;
    if (videoForm.file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`Video hajmi ${maxSizeMb}MB dan oshmasligi kerak!`);
      return;
    }

    setIsVideoSubmitting(true);
    try {
      let lessonId = videoForm.lesson_id;

      if (videoForm.create_new_lesson) {
        if (!videoForm.new_lesson_topic.trim()) {
          toast.error('Yangi dars mavzusini kiriting!');
          return;
        }
        try {
          const lessonRes = await groupsAPI.createLesson(id, {
            group_id: Number(id),
            topic: videoForm.new_lesson_topic.trim(),
            description: videoForm.file.name,
          });
          const created = lessonRes.data?.data || lessonRes.data;
          lessonId = created?.id;
        } catch {
          const lessonRes = await lessonsAPI.create({
            group_id: Number(id),
            topic: videoForm.new_lesson_topic.trim(),
            description: videoForm.file.name,
          });
          const created = lessonRes.data?.data || lessonRes.data;
          lessonId = created?.id;
        }
        if (!lessonId) {
          toast.error('Dars yaratilmadi. Avval mavjud darsni tanlang.');
          return;
        }
      } else if (!lessonId) {
        toast.error('Darsni tanlang yoki «Yangi dars yaratish» ni belgilang!');
        return;
      }

      const groupId = Number(id);
      const lessonIdNum = Number(lessonId);

      const res = await filesAPI.upload(groupId, lessonIdNum, videoForm.file);
      const uploaded = res.data?.data ?? res.data;

      toast.success("Video muvaffaqiyatli qo'shildi!");
      resetVideoForm();

      const item = uploaded
        ? (Array.isArray(uploaded) ? uploaded[0] : uploaded)
        : null;

      if (item) {
        setMediaList((prev) => [
          ...prev,
          {
            ...item,
            id: item.id ?? item.file_id ?? item.fileId,
            group_id: groupId,
            lesson_id: lessonIdNum,
            name:
              item.name ||
              item.filename ||
              item.fileName ||
              videoForm.file.name,
          },
        ]);
      }

      await fetchVideoList();
      await fetchGroupLessons();
    } catch (err) {
      console.error('Video yuklash xato:', err.response?.status, err.response?.data);
      const message = await parseApiError(err);
      toast.error(message, { duration: 6000 });
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
        <button onClick={() => navigate('/dashboard/groups')}>
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
    <div style={{ padding: '24px', background: '#fff', borderRadius: '12px' }}>
      {/* HEADER */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '30px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/dashboard/groups')}
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

    {/* UYGA VAZIFA DRAWER */}
    <div
      className={`right-drawer-overlay ${isHomeworkDrawerOpen ? 'open' : ''}`}
      onClick={resetHomeworkForm}
    >
      <div
        className={`right-drawer ${isHomeworkDrawerOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '440px', maxWidth: '100%' }}
      >
        <div className="drawer-header">
          <h2 className="drawer-title">
            {editingHomeworkId ? 'Uyga vazifani tahrirlash' : "Uyga vazifa qo'shish"}
          </h2>
          <button type="button" className="drawer-close" onClick={resetHomeworkForm}>
            <FiX />
          </button>
        </div>

        <form
          onSubmit={handleHomeworkSubmit}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}
        >
          <div className="form-group">
            <label className="form-label">
              Mavzu <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Html asoslari"
              className="form-input"
              value={homeworkForm.title}
              onChange={(e) => setHomeworkForm({ ...homeworkForm, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={homeworkForm.create_new_lesson}
                onChange={(e) => setHomeworkForm({
                  ...homeworkForm,
                  create_new_lesson: e.target.checked,
                  lesson_id: e.target.checked ? '' : homeworkForm.lesson_id,
                })}
              />
              <span className="form-label" style={{ margin: 0 }}>Yangi dars yaratish</span>
            </label>
          </div>

          {homeworkForm.create_new_lesson ? (
            <div className="form-group">
              <label className="form-label">
                Dars mavzusi <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Dars nomi"
                className="form-input"
                value={homeworkForm.new_lesson_topic}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, new_lesson_topic: e.target.value })}
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">
                Dars <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                required
                className="form-input"
                value={homeworkForm.lesson_id}
                onChange={(e) => setHomeworkForm({ ...homeworkForm, lesson_id: e.target.value })}
              >
                <option value="">— Dars tanlang —</option>
                {groupLessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.topic || lesson.title || `Dars #${lesson.id}`}
                  </option>
                ))}
              </select>
              {groupLessons.length === 0 && (
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                  Darslar yo'q — «Yangi dars yaratish» ni belgilang
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Fayl {editingHomeworkId ? '(ixtiyoriy)' : ''}
            </label>
            <input
              type="file"
              className="form-input"
              onChange={(e) => setHomeworkForm({
                ...homeworkForm,
                file: e.target.files?.[0] || null,
              })}
            />
            {homeworkForm.file && (
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                {homeworkForm.file.name}
              </p>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: '20px',
            borderTop: '1px solid #f3f4f6',
          }}>
            <button type="button" onClick={resetHomeworkForm} className="btn-secondary" style={{ width: '48%' }}>
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isHomeworkSubmitting}
              className="btn-primary"
              style={{ width: '48%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isHomeworkSubmitting ? (
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
    <div
      className={`right-drawer-overlay ${isVideoDrawerOpen ? 'open' : ''}`}
      onClick={resetVideoForm}
    >
      <div
        className={`right-drawer ${isVideoDrawerOpen ? 'open' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ width: '440px', maxWidth: '100%' }}
      >
        <div className="drawer-header">
          <h2 className="drawer-title">Video qo'shish</h2>
          <button type="button" className="drawer-close" onClick={resetVideoForm}>
            <FiX />
          </button>
        </div>

        <form
          onSubmit={handleVideoUpload}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}
        >
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={videoForm.create_new_lesson}
                onChange={(e) => setVideoForm({
                  ...videoForm,
                  create_new_lesson: e.target.checked,
                  lesson_id: e.target.checked ? '' : videoForm.lesson_id,
                })}
              />
              <span className="form-label" style={{ margin: 0 }}>Yangi dars yaratish</span>
            </label>
          </div>

          {videoForm.create_new_lesson ? (
            <div className="form-group">
              <label className="form-label">
                Dars mavzusi <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Nodejs"
                className="form-input"
                value={videoForm.new_lesson_topic}
                onChange={(e) => setVideoForm({ ...videoForm, new_lesson_topic: e.target.value })}
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">
                Dars <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                className="form-input"
                value={videoForm.lesson_id}
                onChange={(e) => setVideoForm({ ...videoForm, lesson_id: e.target.value })}
              >
                <option value="">— Dars tanlang —</option>
                {groupLessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.topic || lesson.title || `Dars #${lesson.id}`}
                  </option>
                ))}
              </select>
              {groupLessons.length === 0 && (
                <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
                  Darslar yo&apos;q — «Yangi dars yaratish» ni belgilang
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              Video fayl <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              type="file"
              required
              accept="video/*,.mp4,.mov,.avi,.mkv,.webm"
              className="form-input"
              onChange={(e) => setVideoForm({
                ...videoForm,
                file: e.target.files?.[0] || null,
              })}
            />
            {videoForm.file && (
              <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                {videoForm.file.name} ({formatFileSize(videoForm.file.size)})
              </p>
            )}
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 'auto',
            paddingTop: '20px',
            borderTop: '1px solid #f3f4f6',
          }}>
            <button type="button" onClick={resetVideoForm} className="btn-secondary" style={{ width: '48%' }}>
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isVideoSubmitting}
              className="btn-primary"
              style={{ width: '48%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {isVideoSubmitting ? (
                <>
                  <div style={{
                    width: '16px', height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: 'white', borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                  }} />
                  Yuklanmoqda...
                </>
              ) : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default GroupDetails;
