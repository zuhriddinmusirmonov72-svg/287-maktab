import axios from "axios";

// =============================================
// 🔧 BASE URL
// =============================================
const BASE_URL = "https://najot-edu.softwareengineer.uz/api/v1";

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
apiForm.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // FormData: Content-Type ni o'chiramiz — brauzer boundary bilan qo'yadi
  if (config.data instanceof FormData) {
    if (config.headers?.set) {
      config.headers.set("Content-Type", undefined);
    } else if (config.headers) {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
  }
  return config;
});
apiForm.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
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
  createLesson: (groupId, data) =>
    api.post(`/groups/${groupId}/lesson`, data),
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
// =============================================
export const homeworkAPI = {
  getAll: () => api.get("/homework/all"),                      // SUPERADMIN, ADMIN
  getByGroup: (groupId) => api.get(`/homework/${groupId}`),   // ADMIN, TEACHER, SUPERADMIN
  getOwn: (lessonId) => api.get(`/homework/own/${lessonId}`), // STUDENT
  getResults: (groupId, homeworkId, status) =>
    api.get(`/group/${groupId}/homework/${homeworkId}/results`, {
      params: { status },
    }),
  getStudentResult: (groupId, homeworkId, studentId) =>
    api.get(
      `/group/${groupId}/homework/${homeworkId}/result/${studentId}`
    ),
  create: (formData) => apiForm.post("/homework", formData),  // multipart/form-data
  update: (id, formData) => apiForm.patch(`/homework/${id}`, formData),
  delete: (id) => api.delete(`/homework/${id}`),
  check: (groupId, homeworkId, data) =>
    api.post(`/group/${groupId}/homework/${homeworkId}/check`, data),
};

// =============================================
// 📁 FILES — /api/v1/files
// =============================================
export const parseApiError = async (error) => {
  const data = error?.response?.data;
  if (!data) return error?.message || "Xato yuz berdi";
  if (data instanceof Blob) {
    try {
      const json = JSON.parse(await data.text());
      if (Array.isArray(json.message)) return json.message.join(", ");
      return json.message || json.error || "Xato yuz berdi";
    } catch {
      return "Xato yuz berdi";
    }
  }
  if (Array.isArray(data.message)) return data.message.join(", ");
  if (typeof data.message === "string") return data.message;
  return data.error || "Xato yuz berdi";
};

export const filesAPI = {
  getFiles: (groupId) => api.get(`/files/${groupId}`),
  // Video ko'rish: GET /files/{fileId}
  getOne: (fileId) =>
    api.get(`/files/${fileId}`, { responseType: "blob" }),
  // Video yuklash: POST /files/group/{groupId}/upload?lessonId={lessonId}
  upload: (groupId, lessonId, file) => {
    const formData = new FormData();
    formData.append("file", file, file.name || "video.mp4");
    const gid = Number(groupId);
    const lid = Number(lessonId);
    return apiForm.post(`/files/group/${gid}/upload`, formData, {
      params: { lessonId: lid },
      timeout: 600000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
  },
};

export default api;
