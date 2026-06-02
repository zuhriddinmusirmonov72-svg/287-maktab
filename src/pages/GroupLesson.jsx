import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiChevronLeft } from "react-icons/fi";
import { FaUser } from "react-icons/fa";
import toast from "react-hot-toast";
import {
  groupsAPI,
  lessonsAPI,
  attendanceAPI,
  parseApiError,
} from "../api/api";
import {
  formatLessonDateLabel,
  flattenScheduleDays,
  parseSchedules,
} from "../utils/schedule";
import {
  buildCompletedDatesSet,
  markDateCompleted,
  isDateCompleted,
  LESSON_ALREADY_DONE_MESSAGE,
} from "../utils/attendanceSchedule";

const unwrapList = (raw) => {
  const data = raw?.data?.data ?? raw?.data ?? raw ?? [];
  return Array.isArray(data) ? data : [];
};

const getStudentName = (s) =>
  s?.full_name ||
  `${s?.first_name || ""} ${s?.last_name || ""}`.trim() ||
  s?.name ||
  "—";

const getTeacherName = (t) =>
  t?.full_name ||
  `${t?.first_name || ""} ${t?.last_name || ""}`.trim() ||
  t?.name ||
  "—";

const parseLessonResponse = (res) => {
  const body = res?.data?.data ?? res?.data;
  if (!body || typeof body !== "object") return null;
  if (Array.isArray(body)) {
    return body.find((l) => l?.id != null) || body[0] || null;
  }
  if (body.lesson && typeof body.lesson === "object") return body.lesson;
  if (body.id != null || body.topic) return body;
  return null;
};

const lessonMatchesDate = (lesson, dateStr) => {
  const d = String(
    lesson?.date || lesson?.lesson_date || lesson?.lessonDate || ""
  ).slice(0, 10);
  return d === dateStr;
};

const attendanceMatchesDay = (record, groupId, date, lessonId) => {
  if (String(record.group_id ?? record.groupId) !== String(groupId)) {
    return false;
  }
  const recordDate = String(
    record.date || record.lesson_date || record.lessonDate || ""
  ).slice(0, 10);
  if (recordDate) return recordDate === date;
  if (lessonId) {
    return String(record.lesson_id ?? record.lessonId) === String(lessonId);
  }
  return false;
};

const GroupLesson = () => {
  const { groupId, date } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [students, setStudents] = useState([]);
  const [lesson, setLesson] = useState(null);
  const [presence, setPresence] = useState({});
  const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [topicSource, setTopicSource] = useState("other");
  const [roleTab, setRoleTab] = useState("teacher");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const teachers = useMemo(() => {
    if (!group) return [];
    if (Array.isArray(group.teachers)) return group.teachers;
    if (group.teacher) return [group.teacher];
    if (group.mentor) return [group.mentor];
    return [];
  }, [group]);

  const displayTeacher =
    roleTab === "assistant"
      ? teachers[1] || teachers[0]
      : teachers[0] || teachers[1];

  const lessonStatus = lesson?.status || lesson?.state || "Dars o'tilmagan";

  const loadPage = async () => {
    if (!groupId || !date) return;
    setLoading(true);
    try {
      const [groupRes, studentsRes, schedulesRes, lessonRes, attendanceRes] =
        await Promise.allSettled([
          groupsAPI.getOne(groupId),
          groupsAPI.getStudents(groupId),
          groupsAPI.getSchedules(groupId),
          groupsAPI.getLessonByDate(groupId, date),
          attendanceAPI.getAll(),
        ]);

      if (groupRes.status === "fulfilled") {
        setGroup(groupRes.value.data?.data || groupRes.value.data);
      }

      const studentList =
        studentsRes.status === "fulfilled"
          ? unwrapList(studentsRes.value)
          : [];
      setStudents(studentList);

      let lessonData = null;
      if (lessonRes.status === "fulfilled") {
        lessonData = parseLessonResponse(lessonRes.value);
      }

      if (!lessonData?.id) {
        try {
          const lessonsRes = await lessonsAPI.getMyGroupLessons(groupId);
          const fromList = unwrapList(lessonsRes).find((l) =>
            lessonMatchesDate(l, date)
          );
          if (fromList) lessonData = fromList;
        } catch {
          // ignore
        }
      }

      if (lessonData?.id || lessonData?.topic) {
        setLesson(lessonData);
        setTopic(lessonData.topic || "");
        setDescription(lessonData.description || "");
      } else {
        setLesson(null);
        setTopic("");
        setDescription("");
      }

      const lessonId = lessonData?.id;
      const allAttendance =
        attendanceRes.status === "fulfilled"
          ? unwrapList(attendanceRes.value)
          : [];

      const initial = {};
      studentList.forEach((s) => {
        initial[s.id] = false;
      });

      allAttendance
        .filter((a) => attendanceMatchesDay(a, groupId, date, lessonId))
        .forEach((a) => {
          const sid = a.student_id ?? a.studentId;
          if (sid != null) {
            initial[sid] = Boolean(a.isPresent ?? a.is_present);
          }
        });

      setPresence(initial);

      const groupData =
        groupRes.status === "fulfilled"
          ? groupRes.value.data?.data || groupRes.value.data
          : null;
      const year =
        groupData?.start_year ||
        groupData?.year ||
        (date?.length >= 4 ? Number(date.slice(0, 4)) : new Date().getFullYear());
      const schedules =
        schedulesRes.status === "fulfilled"
          ? parseSchedules(schedulesRes.value.data)
          : [];
      const scheduleDays = flattenScheduleDays(schedules, year);
      const completedSet = buildCompletedDatesSet(
        groupId,
        scheduleDays,
        allAttendance,
        studentList.length
      );
      if (isDateCompleted(date, completedSet)) {
        toast.error(LESSON_ALREADY_DONE_MESSAGE);
        navigate(`/groups/${groupId}?tab=2`, { replace: true });
        return;
      }
    } catch (err) {
      console.error("Davomat yuklash:", err);
      toast.error("Ma'lumotlarni yuklashda xato!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage();
  }, [groupId, date]);

  const togglePresence = (studentId) => {
    setPresence((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleSave = async () => {
    if (!topic.trim()) {
      toast.error("Mavzuni kiriting!");
      return;
    }

    setSaving(true);
    try {
      let lessonId = lesson?.id;

      // Attendance array — barcha talabalar uchun
      const attendances = students.map((s) => ({
        student_id: Number(s.id),
        isPresent: Boolean(presence[s.id]),
      }));

      if (!lessonId) {
        const payload = {
          group_id: Number(groupId),
          topic: topic.trim(),
          date,
          attendances,
        };
        if (description.trim()) payload.description = description.trim();

        try {
          const createRes = await groupsAPI.createLesson(groupId, payload);
          const created = parseLessonResponse(createRes);
          lessonId = created?.id;
          if (created) setLesson(created);
        } catch (createErr) {
          if (createErr.response?.status === 400) {
            try {
              const byDate = await groupsAPI.getLessonByDate(groupId, date);
              const existing = parseLessonResponse(byDate);
              if (existing?.id) {
                lessonId = existing.id;
                setLesson(existing);
              } else {
                const lessonsRes = await lessonsAPI.getMyGroupLessons(groupId);
                const found = unwrapList(lessonsRes).find((l) =>
                  lessonMatchesDate(l, date)
                );
                if (found?.id) {
                  lessonId = found.id;
                  setLesson(found);
                }
              }
            } catch {
              // davomat uchun davom etamiz
            }
          }
          if (!lessonId && createErr.response?.status !== 400) {
            throw createErr;
          }
        }

        // Agar lesson yaratishda attendances qabul qilinmagan bo'lsa, alohida yuborish
        if (lessonId) {
          try {
            await Promise.all(
              students.map((s) =>
                attendanceAPI.create({
                  group_id: Number(groupId),
                  student_id: Number(s.id),
                  isPresent: Boolean(presence[s.id]),
                })
              )
            );
          } catch {
            // attendance xatosi bo'lsa ham davom etamiz
          }
        }
      } else {
        // Lesson mavjud — faqat attendance yuborish
        await Promise.all(
          students.map((s) =>
            attendanceAPI.create({
              group_id: Number(groupId),
              student_id: Number(s.id),
              isPresent: Boolean(presence[s.id]),
            })
          )
        );
      }

      markDateCompleted(groupId, date);
      toast.success("Davomat saqlandi!");
      navigate(`/groups/${groupId}?tab=2`);
    } catch (err) {
      const msg = await parseApiError(err);
      toast.error(msg, { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px", color: "#6b7280" }}>
        Yuklanmoqda...
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", background: "#fff", borderRadius: "12px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(`/groups/${groupId}`)}
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          <FiChevronLeft size={24} />
        </button>
        <h1 style={{ margin: 0, fontSize: "22px" }}>
          {group?.name || "Guruh"} — Davomat
        </h1>
      </div>

      {/* Rol tablari */}
      <div
        style={{
          display: "flex",
          gap: "24px",
          borderBottom: "1px solid #e5e7eb",
          marginBottom: "24px",
        }}
      >
        {[
          { id: "assistant", label: "Assistant" },
          { id: "teacher", label: "Teacher" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setRoleTab(tab.id)}
            style={{
              padding: "12px 0",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: "600",
              borderBottom:
                roleTab === tab.id ? "2px solid #10b981" : "2px solid transparent",
              color: roleTab === tab.id ? "#10b981" : "#6b7280",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ma'lumot */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "20px",
          marginBottom: "24px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Ma&apos;lumot</h3>
        <p>
          <strong>{roleTab === "teacher" ? "Teacher" : "Assistant"}:</strong>{" "}
          {displayTeacher ? getTeacherName(displayTeacher) : "—"}
        </p>
        <p>
          <strong>Dars kuni:</strong> {formatLessonDateLabel(date)}
        </p>
        <p>
          <strong>Holat:</strong> {lessonStatus}
        </p>
      </div>

      {/* Yo'qlama va mavzu */}
      <div
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: "10px",
          padding: "24px",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Yo&apos;qlama va mavzu kiritish</h3>

        <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="radio"
              name="topicSource"
              checked={topicSource === "plan"}
              onChange={() => setTopicSource("plan")}
            />
            O&apos;quv reja bo&apos;yicha
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="radio"
              name="topicSource"
              checked={topicSource === "other"}
              onChange={() => setTopicSource("other")}
            />
            Boshqa
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">
            Mavzu <span style={{ color: "red" }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="Mavzuni kiriting..."
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={topicSource === "plan"}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Tavsif (ixtiyoriy)</label>
          <textarea
            className="form-input"
            rows={3}
            placeholder="Dars haqida qo'shimcha ma'lumot..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ resize: "vertical" }}
          />
        </div>

        <table className="data-table" style={{ marginTop: "24px" }}>
          <thead>
            <tr>
              <th style={{ width: "50px" }}>#</th>
              <th>O&apos;quvchi ismi</th>
              <th style={{ width: "120px", textAlign: "center" }}>Keldi</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: "center", padding: "32px", color: "#9ca3af" }}>
                  O&apos;quvchilar topilmadi
                </td>
              </tr>
            ) : (
              students.map((student, idx) => (
                <tr key={`student-${student.id}-${idx}`}>
                  <td>{idx + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span
                        style={{
                          width: "32px",
                          height: "32px",
                          borderRadius: "50%",
                          background: "#f3f4f6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FaUser size={14} color="#9ca3af" />
                      </span>
                      {getStudentName(student)}
                    </div>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      type="button"
                      className={`status-switch ${presence[student.id] ? "active" : "inactive"}`}
                      onClick={() => togglePresence(student.id)}
                      aria-label="Keldi"
                    >
                      <span className="switch-knob" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
          <button
            type="button"
            className="btn-primary"
            disabled={saving || students.length === 0}
            onClick={handleSave}
            style={{ minWidth: "140px", padding: "12px 24px" }}
          >
            {saving ? "Saqlanmoqda..." : "Saqlash"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupLesson;
