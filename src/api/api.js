import axios from "axios";

// =============================================
// 🔧 BASE URL
// Dev: Vite proxy (/api/v1) — brauzer CORS xatosiz ulanadi
// Prod: to'g'ridan-to'g'ri backend yoki VITE_API_URL
// =============================================
export const BACKEND_API_URL =
  "https://najot-edu.softwareengineer.uz/api/v1";

const DEV_PROXY_BASE = "/api/v1";

function resolveApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  // Dev: har doim Vite proxy — to'g'ridan-to'g'ri URL CORS bloklaydi
  if (import.meta.env.DEV) {
    return envUrl?.startsWith("/") ? envUrl : DEV_PROXY_BASE;
  }
  return envUrl || BACKEND_API_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

const BASE_URL = API_BASE_URL;

// =============================================
// 🔧 AXIOS INSTANCE
// =============================================
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ Request interceptor — har bir so'rovga token qo'shadi
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Response interceptor — 401 bo'lsa loginga qaytaradi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// multipart/form-data uchun alohida instance
const apiForm = axios.create({
  baseURL: BASE_URL,
});
const clearMultipartContentType = (headers) => {
  if (!headers) return;
  if (typeof headers.delete === "function") {
    headers.delete("Content-Type");
    headers.delete("content-type");
    return;
  }
  delete headers["Content-Type"];
  delete headers["content-type"];
};

const handleUnauthorized = () => {
  localStorage.removeItem("token");
  window.location.href = "/login";
};

apiForm.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (config.data instanceof FormData) {
    clearMultipartContentType(config.headers);
  }
  return config;
});
apiForm.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

// =============================================
// 🔐 AUTH — /api/v1/auth/login
// =============================================
// Swagger: phone example = "975661099" (998 siz)
export const authAPI = {
  login: (phone, password) =>
    api.post("/auth/login", { phone, password }),
};

// =============================================
// 👤 USERS — /api/v1/users
// =============================================
export const usersAPI = {
  getAllAdmins: () => api.get("/users/admin/all"),          // SUPERADMIN
  createAdmin: (data) => api.post("/users/admin", data),   // SUPERADMIN, ADMIN
};

// =============================================
// 👨‍🎓 STUDENTS — /api/v1/students
// =============================================
export const studentsAPI = {
  getAll: (page, limit) =>
    api.get("/students", { params: { page, limit } }),           // SUPERADMIN, ADMIN
  getArchive: () => api.get("/students/archive"),               // SUPERADMIN, ADMIN
  getOne: (id) => api.get(`/students/one/${id}`),              // SUPERADMIN, ADMIN
  getMyGroups: () => api.get("/students/my/groups"),           // STUDENT
  create: (formData) => apiForm.post("/students", formData),   // multipart/form-data
  update: (id, formData) =>
    apiForm.patch(`/students/${id}`, formData),                 // multipart/form-data
  delete: (id) => api.delete(`/students/${id}`),
  submitHomework: (homeworkId, formData) =>
    apiForm.post(`/students/homeworkAnswer/${homeworkId}`, formData),
};

// =============================================
// 👥 TEACHERS — /api/v1/teachers
// =============================================
export const teachersAPI = {
  getAll: () => api.get("/teachers"),                           // SUPERADMIN, ADMIN
  getArchive: () => api.get("/teachers/archive"),              // SUPERADMIN, ADMIN
  getOne: (id) => api.get(`/teachers/one/${id}`),             // SUPERADMIN, ADMIN
  create: (formData) => apiForm.post("/teachers", formData),  // multipart/form-data
  update: (id, formData) =>
    apiForm.patch(`/teachers/${id}`, formData),                // multipart/form-data
  delete: (id) => api.delete(`/teachers/${id}`),
};

// =============================================
// 📖 COURSES — /api/v1/courses
// =============================================
export const coursesAPI = {
  getAll: () => api.get("/courses"),                            // SUPERADMIN, ADMIN
  getArchive: () => api.get("/courses/archive"),               // SUPERADMIN, ADMIN
  getOne: (id) => api.get(`/courses/one/${id}`),              // SUPERADMIN, ADMIN
  create: (data) => api.post("/courses", data),               // JSON
  update: (id, data) => api.patch(`/courses/${id}`, data),    // JSON
  delete: (id) => api.delete(`/courses/${id}`),
};

// =============================================
// 📚 GROUPS — /api/v1/groups
// =============================================
export const groupsAPI = {
  getAll: (groupName, max_student) =>
    api.get("/groups/all", { params: { groupName, max_student } }), // SUPERADMIN, ADMIN
  getArchive: () => api.get("/groups/archive"),               // SUPERADMIN, ADMIN
  getOne: (id) => api.get(`/groups/one/${id}`),              // SUPERADMIN, ADMIN
  getById: (groupId) => api.get(`/groups/${groupId}`),       // SUPERADMIN, ADMIN, TEACHER
  getStudents: (groupId) =>
    api.get(`/groups/one/students/${groupId}`),               // SUPERADMIN, ADMIN
  getSchedules: (groupId) =>
    api.get(`/groups/${groupId}/schedules`),
  getLessonByDate: (groupId, date) =>
    api.get(`/groups/${groupId}/lesson`, { params: { date } }),
  createLesson: (groupId, data) => {
    const gid = Number(groupId);
    const payload = {
      group_id: gid,
      topic: String(data?.topic ?? "").trim(),
    };
    const desc = data?.description != null ? String(data.description).trim() : "";
    if (desc) payload.description = desc;
    const lessonDate = data?.date ?? data?.lesson_date;
    if (lessonDate) {
      // Faqat YYYY-MM-DD formatida yuborish
      const d = String(lessonDate).slice(0, 10);
      payload.lesson_date = d;
    }
    // attendances array bo'lsa qo'shish
    if (Array.isArray(data?.attendances)) {
      payload.attendances = data.attendances;
    }
    return api.post(`/groups/${gid}/lesson`, payload);
  },
  create: (data) => api.post("/groups", data),               // JSON
  update: (id, data) => api.patch(`/groups/${id}`, data),    // JSON
  delete: (id) => api.delete(`/groups/${id}`),
};

// =============================================
// 🔗 STUDENT-GROUP — /api/v1/student-group
// =============================================
export const studentGroupAPI = {
  getAll: () => api.get("/student-group/all"),
  create: (data) => api.post("/student-group", data), // { student_id, group_id }
};

// =============================================
// 🏫 ROOMS — /api/v1/rooms
// =============================================
export const roomsAPI = {
  getAll: () => api.get("/rooms"),                             // SUPERADMIN, ADMIN
  getArchive: () => api.get("/rooms/arxive"),                 // SUPERADMIN, ADMIN
  getOne: (id) => api.get(`/rooms/one/${id}`),               // SUPERADMIN, ADMIN
  create: (data) => api.post("/rooms", data),                // { name, capacity }
  update: (id, data) => api.patch(`/rooms/${id}`, data),     // { name?, capacity? }
  delete: (id) => api.delete(`/rooms/${id}`),
};

// =============================================
// 📝 LESSONS — /api/v1/lessons
// =============================================
export const lessonsAPI = {
  getAll: () => api.get("/lessons"),                           // ADMIN
  getMyGroupLessons: (groupId) =>
    api.get(`/lessons/my/group/${groupId}`),                  // ALL ROLES
  create: (data) => api.post("/lessons", data), // { group_id, topic, description? }
};

// =============================================
// ✅ ATTENDANCE — /api/v1/attendance
// =============================================
export const attendanceAPI = {
  getAll: () => api.get("/attendance/all"),                    // SUPERADMIN, ADMIN, TEACHER
  create: (data) => api.post("/attendance", data), // { group_id, student_id, isPresent }
};

// =============================================
// 📋 HOMEWORK — /api/v1/homework
// GET  /homework/all — barcha uy vazifalar (SUPERADMIN, ADMIN)
// GET  /homework/{groupId} — bitta guruhning uy vazifalari
// POST /homework — yangi uy vazifa (multipart: lesson_id, group_id, title, file)
// GET  /homework/own/{lessonId} — talaba: dars bo'yicha uy vazifa
// GET  /group/{groupId}/homework/{homeworkId}/results?status=
// GET  /group/{groupId}/homework/{homeworkId}/result/{studentId}
// =============================================
export const HOMEWORK_RESULT_STATUSES = [
  "ACCEPTED",
  "REJECTED",
  "PENDING",
  "CHECKED",
];

export const unwrapHomeworkList = (res) => {
  const body = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.homeworks)) return body.homeworks;
  if (Array.isArray(body?.items)) return body.items;
  if (body && typeof body === "object" && body.id) return [body];
  return [];
};

/** GET /homework/{groupId} — to'g'ridan-to'g'ri yoki darslar ichidagi vazifalar */
export const flattenHomeworksFromLessons = (lessons) => {
  if (!Array.isArray(lessons)) return [];
  return lessons.flatMap((lesson) => {
    if (Array.isArray(lesson.homeworks) && lesson.homeworks.length > 0) {
      return lesson.homeworks.map((hw) => ({
        ...hw,
        lesson: hw.lesson ?? lesson,
      }));
    }
    if (lesson.homework) {
      return [{ ...lesson.homework, lesson }];
    }
    return [];
  });
};

export const unwrapHomeworkByGroup = (res) => {
  const body = res?.data?.data ?? res?.data ?? res;

  if (Array.isArray(body?.homeworks) && body.homeworks.length > 0) {
    return body.homeworks;
  }

  const fromLessons = flattenHomeworksFromLessons(body?.lessons);
  if (fromLessons.length > 0) return fromLessons;

  const direct = unwrapHomeworkList(res);
  const nested = flattenHomeworksFromLessons(direct);
  if (nested.length > 0) return nested;

  return direct.filter(
    (item) => item && item.id && (item.title || item.topic || item.description)
  );
};

/** POST/PATCH /homework — lesson_id, group_id, title, file */
export const buildHomeworkFormData = ({
  lesson_id,
  group_id,
  title,
  file,
}) => {
  const formData = new FormData();
  formData.append("lesson_id", String(lesson_id));
  formData.append("group_id", String(group_id));
  formData.append("title", String(title).trim());
  if (file) {
    formData.append("file", file, file.name || "homework");
  }
  return formData;
};

export const unwrapHomeworkResults = (res) => {
  const body = res?.data?.data ?? res?.data ?? res;
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.results)) return body.results;
  if (Array.isArray(body?.items)) return body.items;
  if (Array.isArray(body?.students)) return body.students;
  return [];
};

export const homeworkAPI = {
  /** Barcha uy vazifalar: id, title, description, lesson, created_at, deadline */
  getAll: () => api.get("/homework/all"),
  /** Guruh bo'yicha: GET /homework/{groupId} */
  getByGroup: (groupId) => api.get(`/homework/${Number(groupId)}`),
  /** Talaba — dars uchun berilgan uy vazifa */
  getOwn: (lessonId) => api.get(`/homework/own/${Number(lessonId)}`),
  /** Guruh + vazifa bo'yicha topshirilganlar ro'yxati */
  getResults: (groupId, homeworkId, status) =>
    api.get(`/group/${Number(groupId)}/homework/${Number(homeworkId)}/results`, {
      params: status ? { status } : {},
    }),
  /** Bitta talabaning topshirig'i */
  getStudentResult: (groupId, homeworkId, studentId) =>
    api.get(
      `/group/${Number(groupId)}/homework/${Number(homeworkId)}/result/${Number(studentId)}`
    ),
  /** POST /homework — multipart: lesson_id, group_id, title, file */
  create: (payload) =>
    apiForm.post(
      "/homework",
      payload instanceof FormData
        ? payload
        : buildHomeworkFormData(payload)
    ),
  update: (id, payload) =>
    apiForm.patch(
      `/homework/${id}`,
      payload instanceof FormData
        ? payload
        : buildHomeworkFormData(payload)
    ),
  delete: (id) => api.delete(`/homework/${id}`),
  check: (groupId, homeworkId, data) =>
    api.post(`/group/${groupId}/homework/${homeworkId}/check`, data),
};

// =============================================
// 📁 FILES — Swagger "Files" (faqat 2 ta endpoint)
// GET  /files/{groupId}              — guruh videolari ro'yxati
// POST /files/group/{grupId}/upload?lessonId=  — multipart field: file
// =============================================

const FILES_UPLOAD_TIMEOUT = 600000;

/** Fayl obyektidan video URL/path ajratish */
export const getFileMediaPath = (file) => {
  if (!file || typeof file !== "object") return null;
  return (
    file.url ||
    file.path ||
    file.filePath ||
    file.file_path ||
    file.fileUrl ||
    file.file_url ||
    file.link ||
    file.src ||
    null
  );
};

/** GET /files/{groupId} javobini massivga aylantirish */
export const parseFilesList = (response, groupId) => {
  const body = response?.data;
  let list = [];

  if (Array.isArray(body)) list = body;
  else if (Array.isArray(body?.data)) list = body.data;
  else if (Array.isArray(body?.files)) list = body.files;
  else if (body?.data && typeof body.data === "object") {
    if (Array.isArray(body.data.files)) list = body.data.files;
    else {
      list = Object.values(body.data)
        .flat()
        .filter((x) => x && typeof x === "object");
    }
  } else if (body && typeof body === "object" && !Array.isArray(body)) {
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
    } else if (item.file && typeof item.file === "object") {
      flattened.push({
        ...item.file,
        lesson_id: item.lesson_id || item.id,
        lesson: item,
      });
    } else {
      flattened.push(item);
    }
  }

  const seen = new Set();
  return flattened
    .map((f) => ({
      ...f,
      id: f.id ?? f.file_id ?? f.fileId,
      group_id: f.group_id || f.groupId || groupId,
      lesson_id: f.lesson_id || f.lessonId || f.lesson?.id,
    }))
    .filter(
      (f) => !groupId || !f.group_id || String(f.group_id) === String(groupId)
    )
    .filter((f) => {
      const key =
        f.id != null
          ? String(f.id)
          : `${f.lesson_id}-${f.name}-${f.created_at}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const resolveMediaRequest = (path) => {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return { type: "absolute", url: path };
  }
  if (path.startsWith("/api/v1")) {
    return { type: "api", path: path.replace(/^\/api\/v1/, "") };
  }
  if (path.startsWith("/")) {
    return { type: "relative", url: path };
  }
  return { type: "relative", url: `/${path}` };
};

const fetchBlobWithAuth = async (url) => {
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(url, { headers });
  if (res.status === 401) {
    handleUnauthorized();
    throw Object.assign(new Error("Avtorizatsiya muddati tugagan"), {
      response: { status: 401 },
    });
  }
  if (!res.ok) {
    const text = await res.text();
    let parsed = text;
    try {
      parsed = JSON.parse(text);
    } catch {
      // matn sifatida qoldiramiz
    }
    const err = new Error(
      (typeof parsed === "object" && parsed?.message) || `Xato (${res.status})`
    );
    err.response = { status: res.status, data: parsed };
    throw err;
  }
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const json = await res.json();
    throw new Error(json.message || "Video topilmadi");
  }
  return res.blob();
};

export const parseApiError = async (error) => {
  if (!error?.response) {
    if (error?.code === "ERR_NETWORK" || error?.message === "Network Error") {
      if (import.meta.env.DEV) {
        return (
          "Serverga ulanib bo'lmadi. Dev serverni to'xtatib, qayta `npm run dev` " +
          "ishga tushiring. Brauzerda localhost manzili ochilganiga ishonch hosil qiling."
        );
      }
      return "Serverga ulanib bo'lmadi. Internet aloqasini va login holatini tekshiring.";
    }
    if (error?.code === 'ECONNABORTED') {
      return 'So\'rov vaqti tugadi. Video juda katta bo\'lishi mumkin.';
    }
    return error?.message || 'Tarmoq xatosi';
  }

  const data = error.response?.data;
  if (data instanceof Blob) {
    try {
      const json = JSON.parse(await data.text());
      if (Array.isArray(json.message)) return json.message.join(", ");
      return json.message || json.error || "Xato yuz berdi";
    } catch {
      return "Xato yuz berdi";
    }
  }
  if (!data) return error?.message || "Xato yuz berdi";
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;
  return data.error || "Xato yuz berdi";
};

export const filesAPI = {
  /**
   * GET /files/{groupId}
   * Swagger: FilesController_getFiles — ADMIN, TEACHER, SUPERADMIN
   */
  getByGroup: (groupId) => api.get(`/files/${Number(groupId)}`),

  getFiles: (groupId) => api.get(`/files/${Number(groupId)}`),

  /**
   * POST /files/group/{grupId}/upload?lessonId=
   * XMLHttpRequest bilan — stream yuborish, buffer muammosi yo'q
   */
  upload: (grupId, lessonId, file, onProgress) => {
    const gid = Number(grupId);
    const lid = Number(lessonId);

    if (!Number.isFinite(gid) || gid < 1) {
      return Promise.reject(
        Object.assign(new Error("Guruh ID noto'g'ri"), { code: "INVALID_GROUP" })
      );
    }
    if (!Number.isFinite(lid) || lid < 1) {
      return Promise.reject(
        Object.assign(new Error("Darsni tanlang"), { code: "INVALID_LESSON" })
      );
    }
    if (!file) {
      return Promise.reject(
        Object.assign(new Error("Video fayl tanlanmagan"), { code: "NO_FILE" })
      );
    }

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file, file.name || "video.mp4");

      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/v1/files/group/${gid}/upload?lessonId=${lid}`);

      const token = localStorage.getItem("token");
      if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

      xhr.timeout = FILES_UPLOAD_TIMEOUT;

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };
      }

      xhr.onload = () => {
        if (xhr.status === 401) {
          handleUnauthorized();
          return reject(Object.assign(new Error("Avtorizatsiya muddati tugagan"), {
            response: { status: 401 },
          }));
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          let data = {};
          try { data = JSON.parse(xhr.responseText); } catch { /* ignore */ }
          resolve({ data });
        } else {
          let errData = {};
          try { errData = JSON.parse(xhr.responseText); } catch { /* ignore */ }
          const msg = Array.isArray(errData?.message)
            ? errData.message.join(", ")
            : errData?.message || `Yuklash xatosi (${xhr.status})`;
          const err = new Error(msg);
          err.response = { status: xhr.status, data: errData };
          reject(err);
        }
      };

      xhr.onerror = () => reject(new Error("Tarmoq xatosi. Internet aloqasini tekshiring."));
      xhr.ontimeout = () => reject(new Error("Vaqt tugadi. Video juda katta bo'lishi mumkin."));

      xhr.send(formData);
    });
  },

  /** Ro'yxatdagi fayl obyektidan video blob (Swagger da alohida GET yo'q) */
  fetchVideoBlob: async (file) => {
    const mediaPath = getFileMediaPath(file);
    const req = resolveMediaRequest(mediaPath);

    if (req?.type === "api") {
      const res = await api.get(req.path, { responseType: "blob" });
      const ct = res.headers["content-type"] || "";
      if (ct.includes("application/json")) {
        const text = await res.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message || "Video topilmadi");
      }
      return res.data;
    }

    if (req?.type === "absolute") {
      return fetchBlobWithAuth(req.url);
    }

    if (req?.type === "relative") {
      return fetchBlobWithAuth(req.url);
    }

    throw new Error(
      "Video manzili topilmadi. Avval videoni yuklang yoki ro'yxatni yangilang."
    );
  },
};

export default api;
