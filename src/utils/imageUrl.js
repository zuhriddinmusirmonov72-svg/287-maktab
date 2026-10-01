// =============================================
// 🖼️ IMAGE URL HELPER
// Backend'dan kelgan rasm path'ni to'liq URL'ga aylantirish
// =============================================

/**
 * Get full image URL from backend path
 * @param {string} photoPath - Backend'dan kelgan path (masalan: /uploads/photos/123.jpg)
 * @returns {string} - To'liq URL (masalan: http://localhost:3002/uploads/photos/123.jpg)
 */
export function getImageUrl(photoPath) {
  if (!photoPath) return null;
  
  // Agar allaqachon to'liq URL bo'lsa
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  
  // Development
  if (import.meta.env.DEV) {
    return `http://localhost:3002${photoPath}`;
  }
  
  // Production
  const productionBackend = 'https://two87-maktab-backend.onrender.com';
  return `${productionBackend}${photoPath}`;
}

/**
 * Get student photo URL with fallback to initials
 * @param {object} student - Student object
 * @returns {string|null} - Photo URL or null
 */
export function getStudentPhotoUrl(student) {
  if (!student) return null;
  
  const photo = student.photo || student.image || student.avatar || student.profile_photo;
  return getImageUrl(photo);
}

/**
 * Get teacher photo URL
 * @param {object} teacher - Teacher object
 * @returns {string|null} - Photo URL or null
 */
export function getTeacherPhotoUrl(teacher) {
  if (!teacher) return null;
  
  const photo = teacher.photo || teacher.image || teacher.avatar;
  return getImageUrl(photo);
}
