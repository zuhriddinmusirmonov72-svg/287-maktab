import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { FiArrowLeft, FiUpload } from "react-icons/fi";
import toast from "react-hot-toast";
import { homeworkAPI, unwrapHomeworkList, parseApiError } from "../api/api";

const HomeworkOwn = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [homework, setHomework] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!lessonId) return;
      setLoading(true);
      try {
        const res = await homeworkAPI.getOwn(lessonId);
        const list = unwrapHomeworkList(res);
        const item = list[0] || (res.data?.data?.id ? res.data.data : res.data?.data) || null;
        setHomework(item);
      } catch (err) {
        const msg = await parseApiError(err);
        toast.error(msg);
        setHomework(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [lessonId]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px", color: "#6b7280" }}>
        Yuklanmoqda...
      </div>
    );
  }

  if (!homework?.id) {
    return (
      <div className="page-container" style={{ textAlign: "center", paddingTop: "60px" }}>
        <p style={{ color: "#6b7280", marginBottom: "16px" }}>
          Bu dars uchun uy vazifa topilmadi
        </p>
        <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
          <FiArrowLeft style={{ marginRight: "6px" }} /> Orqaga
        </button>
      </div>
    );
  }

  const title = homework.title || homework.topic || "Uy vazifa";
  const deadline = homework.deadline || homework.end_date || homework.due_date;

  return (
    <div className="page-container">
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "8px" }}
        >
          <FiArrowLeft size={18} />
        </button>
        <h1 className="page-title" style={{ margin: 0 }}>
          Uy vazifa
        </h1>
      </div>

      <div className="content-card" style={{ maxWidth: "640px" }}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        {homework.description && (
          <p style={{ color: "#4b5563", lineHeight: 1.6 }}>{homework.description}</p>
        )}
        {deadline && (
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            <strong>Muddat:</strong> {String(deadline).slice(0, 16).replace("T", " ")}
          </p>
        )}
        <Link
          to={`/homework/${homework.id}/submit`}
          className="btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            marginTop: "24px",
            padding: "12px 24px",
            textDecoration: "none",
          }}
        >
          <FiUpload size={16} /> Topshirish
        </Link>
      </div>
    </div>
  );
};

export default HomeworkOwn;
