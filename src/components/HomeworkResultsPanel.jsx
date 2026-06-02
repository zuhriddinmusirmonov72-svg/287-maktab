import { useState, useEffect } from "react";
import { FiX, FiEye, FiCheck, FiXCircle } from "react-icons/fi";
import toast from "react-hot-toast";
import {
  homeworkAPI,
  HOMEWORK_RESULT_STATUSES,
  unwrapHomeworkResults,
  parseApiError,
} from "../api/api";

const STATUS_LABELS = {
  ACCEPTED: "Qabul qilindi",
  REJECTED: "Rad etildi",
  PENDING: "Kutilmoqda",
  CHECKED: "Tekshirildi",
};

const STATUS_COLORS = {
  ACCEPTED: { bg: "#d1fae5", color: "#065f46" },
  REJECTED: { bg: "#fee2e2", color: "#991b1b" },
  PENDING: { bg: "#fef3c7", color: "#92400e" },
  CHECKED: { bg: "#dbeafe", color: "#1e40af" },
};

const getStudentName = (row) =>
  row.student?.full_name ||
  row.full_name ||
  row.student_name ||
  `${row.student?.first_name || ""} ${row.student?.last_name || ""}`.trim() ||
  row.name ||
  "—";

const getStudentId = (row) =>
  row.student_id ?? row.studentId ?? row.student?.id ?? null;

const HomeworkResultsPanel = ({ groupId, homework, onClose }) => {
  const homeworkId = homework?.id;
  const topic =
    homework?.title ||
    homework?.topic ||
    homework?.lesson?.topic ||
    "Uy vazifa";

  const [statusFilter, setStatusFilter] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [checkingId, setCheckingId] = useState(null);

  const fetchResults = async (status = statusFilter) => {
    if (!groupId || !homeworkId) return;
    setLoading(true);
    try {
      const res = await homeworkAPI.getResults(groupId, homeworkId, status || undefined);
      setResults(unwrapHomeworkResults(res));
    } catch (err) {
      console.error("Natijalar xato:", err.response?.data || err.message);
      const msg = await parseApiError(err);
      toast.error(msg);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [groupId, homeworkId, statusFilter]);

  const openStudentDetail = async (row) => {
    const studentId = getStudentId(row);
    if (!studentId) {
      toast.error("Talaba ID topilmadi!");
      return;
    }
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await homeworkAPI.getStudentResult(groupId, homeworkId, studentId);
      const body = res.data?.data ?? res.data;
      setDetail({ ...body, student_id: studentId, _row: row });
    } catch (err) {
      const msg = await parseApiError(err);
      toast.error(msg);
    } finally {
      setDetailLoading(false);
    }
  };

  // POST /group/{groupId}/homework/{homeworkId}/check
  const handleCheck = async (status, studentId) => {
    if (!studentId) {
      toast.error("Talaba ID topilmadi!");
      return;
    }
    setCheckingId(`${studentId}-${status}`);
    try {
      await homeworkAPI.check(groupId, homeworkId, {
        student_id: studentId,
        status,
      });
      toast.success(
        status === "ACCEPTED"
          ? "Qabul qilindi ✅"
          : status === "REJECTED"
          ? "Rad etildi ❌"
          : "Tekshirildi ✔️"
      );
      // detail va ro'yxatni yangilash
      setDetail((prev) => (prev ? { ...prev, status } : prev));
      await fetchResults();
    } catch (err) {
      const msg = await parseApiError(err);
      toast.error(msg || "Check qilishda xato!");
    } finally {
      setCheckingId(null);
    }
  };

  if (!homeworkId) return null;

  return (
    <div
      className="right-drawer-overlay open"
      onClick={onClose}
      style={{ zIndex: 1100 }}
    >
      <div
        className="right-drawer open"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "520px", maxWidth: "100%" }}
      >
        <div className="drawer-header">
          <div>
            <h2 className="drawer-title" style={{ marginBottom: "4px" }}>
              Uy vazifa natijalari
            </h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#6b7280" }}>{topic}</p>
          </div>
          <button type="button" className="drawer-close" onClick={onClose}>
            <FiX />
          </button>
        </div>

        <div style={{ padding: "0 20px 12px", display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setStatusFilter("")}
            style={{
              padding: "6px 12px",
              borderRadius: "20px",
              border: "none",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              background: !statusFilter ? "#7c3aed" : "#f3f4f6",
              color: !statusFilter ? "#fff" : "#374151",
            }}
          >
            Barchasi
          </button>
          {HOMEWORK_RESULT_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                border: "none",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                background: statusFilter === st ? "#7c3aed" : "#f3f4f6",
                color: statusFilter === st ? "#fff" : "#374151",
              }}
            >
              {STATUS_LABELS[st] || st}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px" }}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "32px" }}>
              Yuklanmoqda...
            </p>
          ) : results.length === 0 ? (
            <p style={{ textAlign: "center", color: "#9ca3af", padding: "32px" }}>
              Natijalar topilmadi
            </p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Talaba</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {results.map((row, idx) => {
                  const st = row.status || row.state || "—";
                  const colors = STATUS_COLORS[st] || { bg: "#f3f4f6", color: "#374151" };
                  return (
                    <tr key={`${getStudentId(row) || idx}-${idx}`}>
                      <td>{idx + 1}</td>
                      <td style={{ fontWeight: 600 }}>{getStudentName(row)}</td>
                      <td>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: colors.bg,
                            color: colors.color,
                          }}
                        >
                          {STATUS_LABELS[st] || st}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => openStudentDetail(row)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            background: "none",
                            border: "none",
                            color: "#7c3aed",
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: "13px",
                          }}
                        >
                          <FiEye size={14} /> Ko&apos;rish
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {(detail || detailLoading) && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                background: "#f9fafb",
              }}
            >
              <h4 style={{ margin: "0 0 12px" }}>Talaba javobi</h4>
              {detailLoading ? (
                <p style={{ color: "#9ca3af" }}>Yuklanmoqda...</p>
              ) : (
                <>
                  <p style={{ margin: "0 0 6px" }}>
                    <strong>Talaba:</strong>{" "}
                    {getStudentName(detail._row || detail)}
                  </p>
                  <p style={{ margin: "0 0 6px" }}>
                    <strong>Status:</strong>{" "}
                    <span
                      style={{
                        padding: "2px 10px",
                        borderRadius: "12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        ...(STATUS_COLORS[detail.status] || { bg: "#f3f4f6", color: "#374151" }),
                        background: (STATUS_COLORS[detail.status] || { bg: "#f3f4f6" }).bg,
                        color: (STATUS_COLORS[detail.status] || { color: "#374151" }).color,
                      }}
                    >
                      {STATUS_LABELS[detail.status] || detail.status || "—"}
                    </span>
                  </p>
                  {detail.comment && (
                    <p style={{ margin: "0 0 6px" }}>
                      <strong>Izoh:</strong> {detail.comment}
                    </p>
                  )}
                  {detail.score != null && (
                    <p style={{ margin: "0 0 6px" }}>
                      <strong>Baho:</strong> {detail.score}
                    </p>
                  )}
                  {(detail.file || detail.file_url || detail.fileUrl || detail.answer_file) && (
                    <p style={{ margin: "0 0 12px" }}>
                      <strong>Fayl:</strong>{" "}
                      <a
                        href={detail.file_url || detail.fileUrl || detail.file || detail.answer_file}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#7c3aed" }}
                      >
                        Yuklab olish / ko&apos;rish
                      </a>
                    </p>
                  )}

                  {/* ✅ CHECK TUGMALARI */}
                  <div style={{ marginTop: "14px", borderTop: "1px solid #e5e7eb", paddingTop: "14px" }}>
                    <p style={{ margin: "0 0 10px", fontWeight: 600, fontSize: "13px", color: "#374151" }}>
                      Uy vazifani tekshirish:
                    </p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {[
                        { status: "ACCEPTED", label: "Qabul qilish", bg: "#10b981", icon: <FiCheck size={14} /> },
                        { status: "CHECKED",  label: "Tekshirildi",  bg: "#3b82f6", icon: <FiEye size={14} /> },
                        { status: "REJECTED", label: "Rad etish",    bg: "#ef4444", icon: <FiXCircle size={14} /> },
                      ].map(({ status, label, bg, icon }) => {
                        const sid = detail.student_id;
                        const key = `${sid}-${status}`;
                        const isActive = detail.status === status;
                        const isLoading = checkingId === key;
                        return (
                          <button
                            key={status}
                            type="button"
                            disabled={isActive || !!checkingId}
                            onClick={() => handleCheck(status, sid)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              padding: "8px 14px",
                              borderRadius: "8px",
                              border: "none",
                              cursor: isActive || !!checkingId ? "not-allowed" : "pointer",
                              background: isActive ? "#d1d5db" : bg,
                              color: "#fff",
                              fontWeight: 600,
                              fontSize: "13px",
                              opacity: isActive ? 0.6 : 1,
                              transition: "opacity 0.2s",
                            }}
                          >
                            {isLoading ? (
                              <div style={{
                                width: "14px", height: "14px",
                                border: "2px solid rgba(255,255,255,0.4)",
                                borderTopColor: "#fff",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite",
                              }} />
                            ) : icon}
                            {isLoading ? "..." : label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeworkResultsPanel;
