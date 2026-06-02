import { MONTH_SHORT } from "../utils/schedule";
import {
  isDateCompleted,
  LESSON_ALREADY_DONE_MESSAGE,
} from "../utils/attendanceSchedule";

const getMonthLabel = (day) =>
  MONTH_SHORT[day.monthKey] ||
  MONTH_SHORT[day.monthLabel] ||
  day.monthKey ||
  day.monthLabel ||
  "";

/**
 * Dars jadvali — rasmdagidek gorizontal kun kartochkalari
 */
const AttendanceDayRow = ({ days, completedSet, onDayClick, singleRow = true }) => {
  if (!days.length) {
    return (
      <p style={{ color: "#9ca3af", textAlign: "center", padding: "20px" }}>
        Dars jadvali mavjud emas
      </p>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexWrap: singleRow ? "nowrap" : "wrap",
        gap: "10px",
        overflowX: singleRow ? "auto" : "visible",
        paddingBottom: singleRow ? "4px" : 0,
      }}
    >
      {days.map((d) => {
        const done = isDateCompleted(d.iso, completedSet);
        return (
          <button
            key={d.iso}
            type="button"
            title={done ? LESSON_ALREADY_DONE_MESSAGE : "Davomat kiritish"}
            onClick={() => onDayClick(d.iso)}
            style={{
              flex: singleRow ? "0 0 auto" : undefined,
              width: "60px",
              height: "70px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              background: done ? "#f0fdf4" : "#fff",
              cursor: done ? "not-allowed" : "pointer",
              padding: 0,
            }}
          >
            <span style={{ fontSize: "12px", color: "#6b7280", lineHeight: 1.2 }}>
              {getMonthLabel(d)}
            </span>
            <strong
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#111827",
                lineHeight: 1.2,
              }}
            >
              {d.dayNum}
            </strong>
          </button>
        );
      })}
    </div>
  );
};

export default AttendanceDayRow;
