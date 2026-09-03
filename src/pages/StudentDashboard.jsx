import { useState, useEffect } from 'react';
import { studentsAPI, lessonsAPI, filesAPI, homeworkAPI, loadVideoForPlayback, coinsAPI, notificationsAPI, api, reelsAPI } from '../api/api';
import { FiUsers, FiBarChart2, FiAward, FiBookOpen, FiSettings, FiBell, FiX, FiPlay, FiUpload, FiFileText, FiClock, FiCheckCircle, FiAlertCircle, FiUsers as FiUsersIcon, FiChevronUp, FiChevronDown, FiMenu, FiFilm, FiCreditCard, FiMessageSquare } from 'react-icons/fi';
import TeachersModal from '../components/TeachersModal';
import ReelsViewer from '../components/ReelsViewer';
import TelegramChat from './TelegramChat';
import NajotLogo from '../assets/Najot.png';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  CircularProgress,
  Alert,
  Grid,
  LinearProgress,
  Badge
} from '@mui/material';
import { Close as CloseIcon, UploadFile as UploadFileIcon, Description as DescriptionIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('active');
  const [activeNav, setActiveNav] = useState('Guruhlarim'); // Navigation uchun
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isTeachersModalOpen, setIsTeachersModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedGroupForLessons, setSelectedGroupForLessons] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [isHomeworkModalOpen, setIsHomeworkModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState(null);
  const [homeworkData, setHomeworkData] = useState(null);
  const [loadingHomework, setLoadingHomework] = useState(false);
  const [studentSubmissions, setStudentSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [githubLink, setGithubLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isLessonDetailOpen, setIsLessonDetailOpen] = useState(false);
  const [lessonsStatusFilter, setLessonsStatusFilter] = useState('Barchasi');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  
  // 💎 Kumush tangalar va bildirishnomalar uchun state'lar
  const [coins, setCoins] = useState(0);
  const [xp, setXP] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelProgress, setLevelProgress] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // 📱 Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 🎬 Reels viewer state
  const [isReelsOpen, setIsReelsOpen] = useState(false);
  const [isReelsUploadOpen, setIsReelsUploadOpen] = useState(false);
  const [reelsVideoFile, setReelsVideoFile] = useState(null);
  const [reelsTitle, setReelsTitle] = useState('');
  const [reelsUploading, setReelsUploading] = useState(false);
  const [reelsUploadProgress, setReelsUploadProgress] = useState(0);

  // 💳 PAYMENT tizimi state
  const [paymentPlan, setPaymentPlan] = useState('MONTHLY');
  const [paymentAmount, setPaymentAmount] = useState(7000);
  const [paymentProvider, setPaymentProvider] = useState('click');
  const [paymentStatus, setPaymentStatus] = useState(null); // null | 'PENDING' | 'ACTIVE' | 'PENDING_REVIEW' | 'REJECTED' | 'EXPIRED'
  const [paymentData, setPaymentData] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [receiptUploading, setReceiptUploading] = useState(false);
  const [receiptResult, setReceiptResult] = useState(null);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(null);
  const [rejectionReason, setRejectionReason] = useState(null);

  useEffect(() => {
    fetchMyGroups();
    fetchCoins();
    fetchNotifications();
    fetchPaymentStatus();
    const intervalId = setInterval(() => { fetchNotifications(); }, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // 💳 Payment status yuklash
  const fetchPaymentStatus = async () => {
    try {
      const res = await api.get('/subscription/status');  // ✅ To'g'ri endpoint
      const data = res?.data?.data;
      console.log('💳 Payment status data:', data);
      if (data) {
        setPaymentStatus(data.status);
        setPaymentData(data);
        if (data.receipt?.rejectionReason) setRejectionReason(data.receipt.rejectionReason);
      }
    } catch (err) { console.warn('💳 Payment status xato:', err?.response?.status, err?.response?.data); }
  };

  // 💳 Payment yaratish
  const handleCreatePayment = async () => {
    try {
      setCreatingPayment(true);
      const res = await api.post('/payments/create', {
        plan: paymentPlan,
        amount: Number(paymentAmount),
        provider: paymentProvider,
      });
      setPaymentCreated(res?.data?.data?.payment);
      toast.success("To'lov yaratildi! Chek rasmini yuklang.");
      await fetchPaymentStatus();
    } catch (err) {
      toast.error(err?.response?.data?.message || "To'lov yaratishda xato");
    } finally { setCreatingPayment(false); }
  };

  // 💳 Chek yuklash
  const handleReceiptUpload = async () => {
    if (!receiptFile) { toast.error('Chek rasmini tanlang (JPG, PNG, WEBP)'); return; }
    if (!transactionId.trim() || transactionId.trim().length < 6) {
      toast.error('Tranzaksiya ID ni kiriting (Click/Payme chekidagi raqam, kamida 6 ta belgi)');
      return;
    }
    try {
      setReceiptUploading(true);
      toast.loading('AI chekni tekshirmoqda...', { id: 'ai-check', duration: 10000 });
      
      const formData = new FormData();
      formData.append('receipt', receiptFile);
      formData.append('transactionId', transactionId.trim());
      const res = await api.post('/payments/receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const data = res?.data?.data;
      setReceiptResult(data);
      
      // ✅ AI tekshiruv tugadi toast'ni o'chirish
      toast.dismiss('ai-check');
      
      if (data?.receipt?.verificationStatus === 'REJECTED') {
        toast.error('❌ ' + (data?.receipt?.rejectionReason || 'Bu rasm to\'lov cheki emas. Haqiqiy bank chekini yuklang.'), {
          duration: 8000,
          icon: '🚫',
          style: { background: '#fef2f2', color: '#991b1b', fontWeight: '600' },
        });
        setRejectionReason(data?.receipt?.rejectionReason);
      } else if (data?.receipt?.verificationStatus === 'VERIFIED') {
        // 🎉 Tarif sotib olindi!
        const planName = paymentData?.plan === 'MONTHLY' ? 'Oylik' : 
                        paymentData?.plan === 'YEARLY' ? 'Yillik' : 'Tarif';
        toast.success(`🎉 ${planName} tarifni sotib oldingiz!`, {
          duration: 8000,
          icon: '✅',
          style: {
            background: '#10b981',
            color: '#fff',
            fontWeight: 'bold',
            fontSize: '16px',
          },
        });
        setTimeout(() => {
          toast('Obuna faollashtirildi! Endi barcha xususiyatlardan foydalanishingiz mumkin! 🚀', {
            duration: 6000,
            icon: '🎓',
          });
        }, 1000);
      } else if (data?.receipt?.verificationStatus === 'NEEDS_REVIEW') {
        toast('⏳ Chek admin tekshiruviga yuborildi. Tez orada tasdiqlanadi.', {
          duration: 6000,
          icon: '🔍',
        });
      } else {
        toast.success('Chek yuklandi! Tekshirilmoqda... ⏳', { duration: 4000 });
      }
      setReceiptFile(null);
      setTransactionId('');
      await fetchPaymentStatus();
    } catch (err) {
      toast.dismiss('ai-check');
      toast.error(err?.response?.data?.message || 'Chek yuklashda xato');
    } finally { setReceiptUploading(false); }
  };

  const fetchMyGroups = async () => {
    try {
      console.log('🔵 fetchMyGroups boshlandi');
      console.log('🔵 API base URL:', import.meta.env.VITE_API_URL);
      const res = await studentsAPI.getMyGroups();
      const data = res?.data?.data || res?.data || [];
      console.log('✅ API response:', res);
      console.log('✅ Groups data:', data);
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Guruhlarni yuklashda xato:', err);
      console.error('❌ Error response:', err?.response?.data);
      console.error('❌ Error status:', err?.response?.status);
      toast.error('Guruhlarni yuklashda xato: ' + (err?.response?.data?.message || err.message));
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  // 💎 Kumush tangalarni yuklash
  const fetchCoins = async () => {
    try {
      const res = await coinsAPI.getMy();
      const data = res?.data?.data || {};
      setCoins(data.coins || 0);
      setXP(data.xp || 0);
      setLevel(data.level || 1);
      setLevelProgress(data.levelProgress || 0);
    } catch (err) {
      console.error('Kumush tangalarni yuklashda xato:', err);
    }
  };

  // 🔔 Bildirishnomalarni yuklash
  const fetchNotifications = async () => {
    try {
      const res = await notificationsAPI.getMy();
      const data = res?.data?.data || {};
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Bildirishnomalarni yuklashda xato:', err);
    }
  };

  // Bildirishnomani o'qilgan deb belgilash
  const markNotificationAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      await fetchNotifications(); // Yangilash
    } catch (err) {
      console.error('Bildirishnomani o\'qilgan deb belgilashda xato:', err);
    }
  };

  // Barcha bildirishnomalarni o'qilgan deb belgilash
  const markAllNotificationsAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      await fetchNotifications();
    } catch (err) {
      console.error('Barcha bildirishnomalarni o\'qilgan deb belgilashda xato:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  // 🎬 Reels video yuklash
  const handleReelsVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 100MB limit
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Video hajmi 100MB dan oshmasligi kerak!');
      return;
    }

    // Video formatlarini tekshirish
    const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'];
    if (!validTypes.includes(file.type)) {
      toast.error('Faqat video fayllar yuklanadi (MP4, WebM, MOV, AVI)!');
      return;
    }

    setReelsVideoFile(file);
  };

  const handleReelsUpload = async () => {
    if (!reelsVideoFile) {
      toast.error('Video faylni tanlang!');
      return;
    }

    try {
      setReelsUploading(true);
      setReelsUploadProgress(0);

      const formData = new FormData();
      formData.append('video', reelsVideoFile);
      formData.append('title', reelsTitle || 'Video');

      // Upload with progress tracking
      const res = await api.post('/reels', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setReelsUploadProgress(percentCompleted);
        }
      });

      if (res.data.success) {
        toast.success('Video muvaffaqiyatli yuklandi! ✅');
        setIsReelsUploadOpen(false);
        setReelsVideoFile(null);
        setReelsTitle('');
        setReelsUploadProgress(0);
      }
    } catch (err) {
      console.error('Video yuklashda xato:', err);
      toast.error('Video yuklashda xatolik: ' + (err.response?.data?.message || err.message));
    } finally {
      setReelsUploading(false);
    }
  };

  const handleCancelReelsUpload = () => {
    setIsReelsUploadOpen(false);
    setReelsVideoFile(null);
    setReelsTitle('');
    setReelsUploadProgress(0);
  };

  const handleOpenTeachersModal = (group) => {
    setSelectedGroup(group);
    setIsTeachersModalOpen(true);
  };

  const handleCloseTeachersModal = () => {
    setIsTeachersModalOpen(false);
    setSelectedGroup(null);
  };

  const fetchGroupLessons = async (groupId) => {
    try {
      setLoadingLessons(true);
      // getGroupLessonsAll → /groups/{groupId}/lessons/all — status va videoCount qaytaradi
      const res = await lessonsAPI.getGroupLessonsAll(groupId);
      const data = res?.data?.data || res?.data || [];
      
      console.log('📚 Darslar API response:', res?.data);
      console.log('📚 Darslar array:', data);
      
      setLessons(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('⚠️ Darslarni yuklashda xato:', err.message);
      setLessons([]);
      // Don't throw - this is non-critical
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleGroupClick = (group) => {
    setSelectedGroupForLessons(group);
    const groupId = group.id || group.group_id || group.groupId;
    if (groupId) {
      fetchGroupLessons(groupId);
    }
  };

  const handleCloseLessons = () => {
    setSelectedGroupForLessons(null);
    setLessons([]);
  };

  const fetchLessonVideos = async (groupId, lessonId) => {
    try {
      setLoadingVideos(true);
      const res = await lessonsAPI.getLessonVideos(groupId, lessonId);
      const data = res?.data?.data || res?.data || [];
      const list = Array.isArray(data) ? data : [];

      // Video URLlarini local backend dan olamiz
      // /files/videos/{filename} → Vite proxy → http://localhost:3001/files/videos/{filename}
      const formattedVideos = list.map(v => {
        const filename = v.filename || v.video_url || v.originalname || '';
        // Local backend: /files/videos/{filename}
        const videoUrl = filename
          ? `/files/videos/${filename}`
          : v.url || v.path || '';

        return {
          ...v,
          formattedUrl: videoUrl,
          revoke: false,
        };
      });

      setVideos(formattedVideos);
    } catch (err) {
      console.error('Videolarni yuklashda xato:', err);
      setVideos([]);
    } finally {
      setLoadingVideos(false);
    }
  };

  const fetchHomeworkData = async (groupId, lessonId) => {
    try {
      setLoadingHomework(true);
      const res = await lessonsAPI.getLessonHomeworks(groupId, lessonId);
      const data = res?.data?.data || res?.data || null;
      
      console.log('📝 Uyga vazifa API response:', res?.data);
      console.log('📝 Homework data:', data);
      
      // API array qaytarsa birinchisini ol
      if (Array.isArray(data)) {
        setHomeworkData(data.length > 0 ? data[0] : null);
      } else {
        setHomeworkData(data || null);
      }
    } catch (err) {
      console.warn('⚠️ Uyga vazifa yuklashda xato:', err.message);
      setHomeworkData(null);
      // Don't throw - this is non-critical
    } finally {
      setLoadingHomework(false);
    }
  };

  const fetchStudentSubmissions = async (groupId, lessonId) => {
    // Bu endpoint hozircha mavjud emas, bo'sh qoldiramiz
    setStudentSubmissions([]);
  };

  const handleOpenHomeworkModal = (lesson) => {
    // Clear previous homework data first
    setHomeworkData(null);
    setVideos([]);
    setVideoError(null);
    setSelectedFile(null);
    setGithubLink('');
    setActiveVideoIndex(0);
    
    // Set new lesson
    setSelectedLesson(lesson);
    const groupId = selectedGroupForLessons?.id || selectedGroupForLessons?.group_id || selectedGroupForLessons?.groupId;
    const lessonId = lesson?.id;
    if (groupId && lessonId) {
      fetchLessonVideos(groupId, lessonId);
      fetchHomeworkData(groupId, lessonId);
    }
    setIsHomeworkModalOpen(true);
    setIsLessonDetailOpen(false);
  };

  const handleCloseHomeworkModal = () => {
    setIsHomeworkModalOpen(false);
    setSelectedLesson(null);
    setVideos([]);
    setVideoError(null);
    setHomeworkData(null);
    setStudentSubmissions([]);
    setSelectedFile(null);
    setGithubLink('');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmitHomework = async () => {
    console.log('🔵 handleSubmitHomework called, homeworkData:', homeworkData);
    
    // Extract homeworkId from nested structure
    const homeworkId = homeworkData?.homework?.id || homeworkData?.id || homeworkData?.homeworkId;
    
    console.log('🔑 Extracted homeworkId:', homeworkId);
    
    if (!homeworkId) {
      console.error('❌ homeworkId topilmadi:', homeworkData);
      toast.error('Uyga vazifa topilmadi (Homework ID mavjud emas)');
      return;
    }
    if (!selectedFile && !githubLink.trim()) {
      toast.error('Iltimos, kamida bitta (fayl yoki matn) kiriting!');
      return;
    }
    
    console.log('📦 Selected file:', {
      name: selectedFile?.name,
      size: selectedFile?.size,
      type: selectedFile?.type,
      lastModified: selectedFile?.lastModified
    });
    console.log('🔗 GitHub link/comment:', githubLink);
    
    try {
      setUploading(true);
      const formData = new FormData();
      
      // Backend majburiy fieldlari:
      // 1. title (string, majburiy)
      const title = homeworkData?.homework?.title || 
                   homeworkData?.title || 
                   homeworkData?.homework?.topic || 
                   homeworkData?.topic || 
                   'Uy vazifa topshiruvi';
      formData.append('title', title);
      
      // 2. file (File, ixtiyoriy)
      if (selectedFile) {
        console.log('✅ File obyekti:', selectedFile);
        console.log('✅ File instanceof File:', selectedFile instanceof File);
        formData.append('file', selectedFile);
      }
      
      // 3. comment (string, ixtiyoriy)
      if (githubLink.trim()) {
        formData.append('comment', githubLink.trim());
      }

      console.log('📤 Yuborilayotgan homework FormData:');
      for (let [key, val] of formData.entries()) {
        console.log(`  ${key}:`, val instanceof File ? `${val.name} (${val.size} bytes, ${val.type})` : val);
      }
      
      console.log('🌐 API endpoint:', `/students/homeworkAnswer/${homeworkId}`);

      // POST /students/homeworkAnswer/{homeworkId}
      const response = await studentsAPI.submitHomework(homeworkId, formData);
      
      console.log('✅ Success response:', response?.data);

      // Backend javobidan kumush tangalar ma'lumotini olish
      const responseData = response?.data?.data || response?.data || {};
      const coinsEarned = responseData.coinsEarned || 0;
      
      if (coinsEarned > 0) {
        if (coinsEarned >= 200) {
          toast.success(`🎉 Ajoyib! +${coinsEarned} kumush tanga oldingiz! (1 soat ichida topshirdingiz)`, {
            duration: 5000,
            icon: '💎'
          });
        } else {
          toast.success(`+${coinsEarned} kumush tanga oldingiz!`, {
            duration: 4000,
            icon: '💎'
          });
        }
      }

      toast.success('Uyga vazifa muvaffaqiyatli yuborildi! ✅');
      
      // Kumush tangalarni yangilash
      await fetchCoins();
      await fetchNotifications();
      
      // Clear form
      setSelectedFile(null);
      setGithubLink('');

      // Refresh: backend dan yangilangan ma'lumotlarni olish
      const groupId = selectedGroupForLessons?.id || selectedGroupForLessons?.group_id;
      if (groupId) {
        // 1. Darslar ro'yxatini yangilash — status "Kutilmoqda" bo'lib qoladi
        fetchGroupLessons(groupId);

        // 2. Uyga vazifa ma'lumotini yangilash — "Mening jo'natmalarim" ko'rinishi uchun
        if (selectedLesson?.id) {
          fetchHomeworkData(groupId, selectedLesson.id);
        }
      }

      // Modal ochiq qoladi — o'quvchi "Mening jo'natmalarim" ni ko'radi
    } catch (err) {
      console.error('=== XATO TAFSILOTI ===');
      console.error('❌ Error object:', err);
      console.error('❌ Error message:', err.message);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error name:', err.name);
      console.error('❌ Response exists:', !!err.response);
      console.error('❌ Response status:', err.response?.status);
      console.error('❌ Response data:', err.response?.data);
      console.error('❌ Response headers:', err.response?.headers);
      console.error('❌ Request URL:', err.config?.url);
      console.error('❌ Request method:', err.config?.method);
      console.error('❌ Request baseURL:', err.config?.baseURL);
      
      const errData = err.response?.data;
      
      // Tarmoq xatosi (server javob bermadi)
      if (!err.response) {
        console.error('🔴 Tarmoq xatosi - server javob bermadi');
        toast.error('Server bilan aloqa yo\'qoldi. Internet ulanishini tekshiring yoki keyinroq qayta urinib ko\'ring.', { duration: 8000 });
        return;
      }
      
      // Backend xatosi (server javob qaytardi)
      if (errData?.message && Array.isArray(errData.message)) {
        errData.message.forEach((m) => toast.error(m, { duration: 6000 }));
      } else if (errData?.message) {
        toast.error(errData.message, { duration: 6000 });
      } else if (err.response?.status === 413) {
        toast.error('Fayl hajmi juda katta! Iltimos, kichikroq fayl yuklang.', { duration: 6000 });
      } else if (err.response?.status === 415) {
        toast.error('Fayl turi qo\'llab-quvvatlanmaydi.', { duration: 6000 });
      } else if (err.response?.status === 500) {
        toast.error('Server xatosi yuz berdi. Iltimos, keyinroq qayta urinib ko\'ring.', { duration: 6000 });
      } else {
        toast.error(errData?.error || err.message || 'Xato yuz berdi!', { duration: 6000 });
      }
    } finally {
      setUploading(false);
    }
  };

  const getHomeworkStatus = (lesson) => {
    const raw = String(lesson?.status || 'Berilmagan').toLowerCase();
    
    console.log(`📊 Dars status - ID: ${lesson?.id}, Status: "${lesson?.status}", Raw: "${raw}"`);

    // 1. Qabul qilingan: tekshirilgan va 60+ ball
    if (raw.includes('qabul') || raw.includes('accepted') || raw.includes('approved')) {
      return { text: 'Qabul qilingan', color: '#22c55e', bg: '#22c55e' };
    }
    
    // 2. Qaytarilgan: tekshirilgan va 60 dan past
    if (raw.includes('qaytarilgan') || raw.includes('rejected') || raw.includes('returned')) {
      return { text: 'Qaytarilgan', color: '#f59e0b', bg: '#f59e0b' };
    }
    
    // 3. Kutilmoqda: yuklangan lekin hali tekshirilmagan
    if (raw.includes('kutilmoqda') || raw.includes('pending') || raw.includes('waiting') || raw.includes('submitted')) {
      return { text: 'Kutilmoqda', color: '#3b82f6', bg: '#3b82f6' };
    }
    
    // 4. Bajarilmagan: uyga vazifa berilgan lekin yuklanmagan
    if (raw.includes('bajarilmagan') || raw.includes('bajarmaganlar') || raw.includes('not submitted')) {
      return { text: 'Bajarilmagan', color: '#ef4444', bg: '#ef4444' };
    }
    
    // 5. Berilmagan: uyga vazifa yo'q
    return { text: 'Berilmagan', color: '#6b7280', bg: '#6b7280' };
  };

  const navItems = [
    { name: "Guruhlarim", icon: <FiUsers size={18} /> },
    { name: "Telegram", icon: <FiMessageSquare size={18} /> },
    { name: "Reels", icon: <FiFilm size={18} /> },
    { name: "To'lov", icon: <FiCreditCard size={18} /> },
    { name: "Reyting", icon: <FiAward size={18} /> },
    { name: "Qo'shimcha darslar", icon: <FiBookOpen size={18} /> },
    { name: "Sozlamalar", icon: <FiSettings size={18} /> },
  ];

  // Foydalanuvchi ma'lumotlari
  const userData = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  })();
  const userName = userData.full_name || userData.name || 'Student';
  const userInitial = userName.charAt(0).toUpperCase();

  // 📱 Mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', backgroundColor:'#e8f0f7' }}>

      {/* ═══ TELEGRAM VIEW ═══ */}
      {activeNav === 'Telegram' && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          <TelegramChat />
          {/* Back button */}
          <button
            onClick={() => setActiveNav('Guruhlarim')}
            style={{
              position: 'fixed',
              top: '16px',
              left: '16px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: '#7c3aed',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              zIndex: 10000,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            ←
          </button>
        </div>
      )}

      {/* 📱 Mobile Menu Button */}
      <button 
        className="mobile-menu-btn"
        onClick={toggleMobileMenu}
        style={{
          display: 'none',
          position: 'fixed',
          top: '8px',
          left: '8px',
          zIndex: 998,
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          backgroundColor: '#7c3aed',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <FiMenu size={20} />
      </button>

      {/* 📱 Mobile Sidebar Overlay */}
      <div 
        className={`mobile-sidebar-overlay ${isMobileMenuOpen ? 'active' : ''}`}
        onClick={closeMobileMenu}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          display: isMobileMenuOpen ? 'block' : 'none',
        }}
      />

      {/* ═══ CHAP SIDEBAR ═══ */}
      <div 
        className={`student-dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}
        style={{
        width:'200px', backgroundColor:'#fff', borderRight:'1px solid #e5e7eb',
        display:'flex', flexDirection:'column', position:'fixed',
        height:'100vh', left:0, top:0, zIndex:1000,
      }}>
        {/* Logo */}
        <div style={{ padding:'20px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ 
              fontSize:'28px', 
              fontWeight:800, 
              background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent',
              backgroundClip:'text',
              letterSpacing:'-0.5px',
              lineHeight:1.2,
              fontFamily:'"Inter", "Segoe UI", sans-serif'
            }}>287-maktab</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 8px', overflowY:'auto' }}>
          {navItems.map(item => {
            const isActive = activeNav === item.name;
            return (
              <button key={item.name}
                onClick={() => {
                  if (item.name === 'Reels') {
                    // Show Reels viewer directly - upload button will be inside
                    setIsReelsOpen(true);
                    closeMobileMenu();
                  } else if (item.name === 'Telegram') {
                    // Show Telegram in Student Dashboard
                    setActiveNav('Telegram');
                    closeMobileMenu();
                  } else {
                    setActiveNav(item.name);
                    if (item.name === 'Guruhlarim') {
                      setSelectedGroupForLessons(null);
                      setSelectedLesson(null);
                    }
                    closeMobileMenu();
                  }
                }}
                style={{
                  width:'100%', padding:'10px 12px', marginBottom:'2px',
                  borderRadius:'8px', border:'none',
                  backgroundColor: isActive ? '#e8f5e9' : 'transparent',
                  color: isActive ? '#16a34a' : '#4b5563',
                  display:'flex', alignItems:'center', gap:'10px',
                  cursor:'pointer', fontSize:'13px',
                  fontWeight: isActive ? 600 : 400,
                  transition:'all 0.15s',
                  textAlign:'left',
                }}
              >
                <span style={{ color: isActive ? '#16a34a' : '#9ca3af' }}>{item.icon}</span>
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ padding:'12px', borderTop:'1px solid #e5e7eb', display:'flex', alignItems:'center', gap:'8px' }}>
          <div style={{
            width:'32px', height:'32px', borderRadius:'50%', background:'#7c3aed',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontWeight:700, fontSize:'14px', flexShrink:0
          }}>{userInitial}</div>
          <div style={{ minWidth:0 }}>
            <p style={{ margin:0, fontSize:'12px', fontWeight:600, color:'#1f2937', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{userName}</p>
            <p style={{ margin:0, fontSize:'11px', color:'#6b7280' }}>Talaba</p>
          </div>
          <button onClick={handleLogout} title="Chiqish"
            style={{ marginLeft:'auto', border:'none', background:'none', cursor:'pointer', color:'#ef4444', flexShrink:0 }}>
            ⏻
          </button>
        </div>
      </div>

      {/* ═══ ASOSIY KONTENT ═══ */}
      <div 
        className="main-dashboard-content" 
        style={{ 
          flex: 1, 
          marginLeft: window.innerWidth <= 768 ? '0' : '200px', 
          minHeight: '100vh',
          width: window.innerWidth <= 768 ? '100%' : 'calc(100% - 200px)',
          padding: window.innerWidth <= 768 ? '0 16px' : '0 24px'
        }}
      >

        {/* Top navbar */}
        <div style={{
          height:'56px', background:'transparent',
          display:'flex', alignItems:'center', justifyContent:'flex-end',
          padding:'0 16px', gap:'12px',
          position:'sticky', top:0, zIndex:100,
        }}>
          {/* 🔔 Bildirishnomalar */}
          <div style={{ position:'relative' }}>
            <Badge badgeContent={unreadCount} color="error">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  width:'36px', height:'36px', borderRadius:'50%',
                  border:'1px solid #e5e7eb', background:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer',
                }}>
                <FiBell size={16} color="#6b7280" />
              </button>
            </Badge>
            
            {/* Bildirishnomalar paneli */}
            {showNotifications && (
              <div 
                className="notification-panel"
                style={{
                position:'absolute', top:'50px', right:0,
                width:'min(380px, calc(100vw - 20px))', maxHeight:'500px',
                background:'#fff', borderRadius:'12px',
                border:'1px solid #e5e7eb',
                boxShadow:'0 8px 24px rgba(0,0,0,0.15)',
                zIndex:1000, overflow:'hidden',
                display:'flex', flexDirection:'column'
              }}>
                {/* Header */}
                <div style={{
                  padding:'16px 20px',
                  borderBottom:'1px solid #e5e7eb',
                  display:'flex', alignItems:'center', justifyContent:'space-between'
                }}>
                  <h3 style={{ margin:0, fontSize:'16px', fontWeight:700, color:'#1f2937' }}>
                    Xabarlar
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      style={{
                        border:'none', background:'none',
                        color:'#7c3aed', fontSize:'13px',
                        fontWeight:600, cursor:'pointer'
                      }}>
                      Barchasini o'qilgan deb belgilash
                    </button>
                  )}
                </div>
                
                {/* Bildirishnomalar ro'yxati */}
                <div style={{ 
                  flex:1, overflowY:'auto', 
                  maxHeight:'420px'
                }}>
                  {notifications.length === 0 ? (
                    <div style={{ 
                      padding:'48px 20px', 
                      textAlign:'center', 
                      color:'#9ca3af' 
                    }}>
                      Yangi xabarlar yo'q
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationAsRead(notif.id)}
                        style={{
                          padding:'16px 20px',
                          borderBottom:'1px solid #f3f4f6',
                          background: notif.is_read ? '#fff' : '#f0f9ff',
                          cursor:'pointer',
                          transition:'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                        onMouseLeave={(e) => e.currentTarget.style.background = notif.is_read ? '#fff' : '#f0f9ff'}
                      >
                        <div style={{ display:'flex', alignItems:'flex-start', gap:'12px' }}>
                          <div style={{
                            width:'40px', height:'40px',
                            borderRadius:'50%',
                            background: notif.type === 'COINS' ? '#fef9c3' : '#dbeafe',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            fontSize:'20px', flexShrink:0
                          }}>
                            {notif.type === 'COINS' ? '💎' : notif.type === 'HOMEWORK_ACCEPTED' ? '✅' : notif.type === 'HOMEWORK_REJECTED' ? '❌' : '📢'}
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ 
                              margin:'0 0 4px', 
                              fontSize:'14px', 
                              fontWeight:600, 
                              color:'#1f2937' 
                            }}>
                              {notif.title}
                            </p>
                            <p style={{ 
                              margin:0, 
                              fontSize:'13px', 
                              color:'#6b7280',
                              overflow:'hidden',
                              textOverflow:'ellipsis',
                              display:'-webkit-box',
                              WebkitLineClamp:2,
                              WebkitBoxOrient:'vertical'
                            }}>
                              {notif.message}
                            </p>
                            <p style={{ 
                              margin:'6px 0 0', 
                              fontSize:'11px', 
                              color:'#9ca3af' 
                            }}>
                              {(() => {
                                const d = new Date(notif.created_at);
                                const now = new Date();
                                const diff = Math.floor((now - d) / 1000 / 60); // minutlar
                                if (diff < 1) return 'Hozir';
                                if (diff < 60) return `${diff} daqiqa oldin`;
                                const hours = Math.floor(diff / 60);
                                if (hours < 24) return `${hours} soat oldin`;
                                const days = Math.floor(hours / 24);
                                return `${days} kun oldin`;
                              })()}
                            </p>
                          </div>
                          {!notif.is_read && (
                            <div style={{
                              width:'8px', height:'8px',
                              borderRadius:'50%',
                              background:'#3b82f6',
                              flexShrink:0,
                              marginTop:'6px'
                            }} />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div onClick={() => setShowProfileMenu(!showProfileMenu)} style={{
            width:'36px', height:'36px', borderRadius:'50%', background:'#7c3aed',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#fff', fontWeight:700, cursor:'pointer', fontSize:'14px', position:'relative'
          }}>
            {userInitial}
            {showProfileMenu && (
              <div style={{
                position:'absolute', top:'44px', right:0, background:'#fff',
                border:'1px solid #e5e7eb', borderRadius:'8px',
                boxShadow:'0 4px 12px rgba(0,0,0,0.1)', zIndex:1000, minWidth:'130px'
              }}>
                <button onClick={handleLogout} style={{
                  width:'100%', padding:'10px 14px', border:'none', background:'none',
                  color:'#ef4444', fontSize:'13px', cursor:'pointer', textAlign:'left', borderRadius:'8px'
                }}>Chiqish</button>
              </div>
            )}
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div className="dashboard-page-content" style={{ padding:'0 24px 32px' }}>

          {/* ═══ TO'LOV ═══ */}
          {activeNav === "To'lov" && (
            <div style={{ maxWidth: '800px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#1f2937', marginBottom: '24px', marginTop: 0 }}>
                To'lov va Obuna
              </h2>

              {/* Status Banner */}
              <div style={{
                background: paymentStatus === 'ACTIVE' ? '#ecfdf5' : 
                           paymentStatus === 'PENDING_REVIEW' ? '#fefce8' : 
                           paymentStatus === 'REJECTED' ? '#fef2f2' : '#f3f4f6',
                border: `1px solid ${paymentStatus === 'ACTIVE' ? '#10b981' : 
                                      paymentStatus === 'PENDING_REVIEW' ? '#eab308' : 
                                      paymentStatus === 'REJECTED' ? '#ef4444' : '#d1d5db'}`,
                borderRadius: '12px', padding: '20px', marginBottom: '24px',
                display: 'flex', alignItems: 'center', gap: '16px'
              }}>
                <div style={{ fontSize: '32px' }}>
                  {paymentStatus === 'ACTIVE' ? '✅' : 
                   paymentStatus === 'PENDING_REVIEW' ? '⏳' : 
                   paymentStatus === 'REJECTED' ? '❌' : '💳'}
                </div>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#1f2937' }}>
                    {paymentStatus === 'ACTIVE' ? 'Obuna faol' : 
                     paymentStatus === 'PENDING_REVIEW' ? "Chek tekshirilmoqda" : 
                     paymentStatus === 'REJECTED' ? "To'lov rad etildi" : "Obuna mavjud emas"}
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>
                    {paymentStatus === 'ACTIVE' ? `Sizning obunangiz ${new Date(paymentData?.subscription?.expiresAt).toLocaleDateString('uz-UZ')} gacha faol.` : 
                     paymentStatus === 'PENDING_REVIEW' ? "Admin to'lovni tasdiqlashi kutilmoqda. Bu biroz vaqt olishi mumkin." : 
                     paymentStatus === 'REJECTED' ? `Sabab: ${rejectionReason}` : "Platformadan to'liq foydalanish uchun to'lovni amalga oshiring."}
                  </p>
                </div>
              </div>

              {/* To'lov formasi (agar obuna yo'q bo'lsa yoki rad etilgan bo'lsa) */}
              {(!paymentStatus || paymentStatus === 'NOT_PAID' || paymentStatus === 'REJECTED' || paymentStatus === 'EXPIRED') && (
                <div style={{ background: '#fff', borderRadius: '12px', padding: '32px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 600 }}>Tarifni tanlang</h3>
                  
                  <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                    <div onClick={() => { setPaymentPlan('MONTHLY'); setPaymentAmount(7000); }}
                         style={{ flex: 1, padding: '20px', border: `2px solid ${paymentPlan === 'MONTHLY' ? '#7c3aed' : '#e5e7eb'}`, borderRadius: '12px', cursor: 'pointer', background: paymentPlan === 'MONTHLY' ? '#f5f3ff' : '#fff' }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>Oylik obuna</h4>
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#7c3aed' }}>7 000 so'm</p>
                      <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>(5 000 - 10 000 so'm oralig'ida ixtiyoriy summani kiriting)</p>
                    </div>
                    
                    <div onClick={() => { setPaymentPlan('YEARLY'); setPaymentAmount(50000); }}
                         style={{ flex: 1, padding: '20px', border: `2px solid ${paymentPlan === 'YEARLY' ? '#7c3aed' : '#e5e7eb'}`, borderRadius: '12px', cursor: 'pointer', background: paymentPlan === 'YEARLY' ? '#f5f3ff' : '#fff' }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: '16px' }}>Yillik obuna</h4>
                      <p style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#7c3aed' }}>50 000 so'm</p>
                      <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>1 yil uchun barcha imkoniyatlar</p>
                    </div>
                  </div>

                  {paymentPlan === 'MONTHLY' && (
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>O'zingiz xohlagan summani kiriting (5000 dan 10000 gacha):</label>
                      <input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)}
                             style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px' }} />
                    </div>
                  )}

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>To'lov usuli:</label>
                    <select value={paymentProvider} onChange={(e) => setPaymentProvider(e.target.value)}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '16px' }}>
                      <option value="click">Click</option>
                      <option value="payme">Payme</option>
                      <option value="paynet">Paynet</option>
                      <option value="card">Bank kartasi (Karta raqami orqali)</option>
                    </select>
                  </div>

                  {!paymentCreated ? (
                    <button onClick={handleCreatePayment} disabled={creatingPayment}
                            style={{ width: '100%', padding: '14px', borderRadius: '8px', background: '#7c3aed', color: '#fff', border: 'none', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}>
                      {creatingPayment ? 'Kuting...' : "Davom etish"}
                    </button>
                  ) : (
                    <div style={{ padding: '24px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 16px', color: '#1e293b', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        💳 Karta ma'lumotlari:
                      </h4>
                      <p style={{ margin: '0 0 12px', fontSize: '15px', color: '#475569', lineHeight: '1.5' }}>
                        Iltimos, tanlagan ilovangiz orqali quyidagi hisob raqamiga belgilangan <strong>{paymentCreated.amount} so'm</strong> summani o'tkazing va to'lov muvaffaqiyatli amalga oshirilganligini tasdiqlovchi chek rasmini (skrinshotni) yuklang.
                      </p>
                      <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Karta raqami:</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '22px', fontWeight: 700, letterSpacing: '2px', color: '#0f172a', marginBottom: '12px' }}>
                          9860 1234 5678 9012
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Karta egasi (Qabul qiluvchi):</div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a' }}>
                          Najot Ta'lim (MCHJ)
                        </div>
                      </div>
                      
                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                        <h4 style={{ margin: '0 0 12px', color: '#1e293b', fontSize: '16px' }}>🧾 To'lov chekini yuklang:</h4>
                        
                        {/* Tranzaksiya ID */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                            Tranzaksiya ID (Chek raqami) *
                          </label>
                          <input
                            type="text"
                            value={transactionId}
                            onChange={(e) => setTransactionId(e.target.value)}
                            placeholder="Masalan: 123456789 yoki TX-ABC123"
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              borderRadius: '8px',
                              border: '1px solid #d1d5db',
                              fontSize: '15px',
                              fontFamily: 'monospace',
                              boxSizing: 'border-box'
                            }}
                          />
                          <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#6b7280' }}>
                            Click/Payme chekidagi tranzaksiya raqamini kiriting
                          </p>
                        </div>

                        {/* Chek rasmi */}
                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                            Chek rasmi *
                          </label>
                          <input type="file" accept="image/jpeg, image/png, image/webp" 
                                 onChange={(e) => setReceiptFile(e.target.files[0])}
                                 style={{ display: 'block', width: '100%', padding: '10px', background: '#fff', border: '1px dashed #cbd5e1', borderRadius: '8px' }} />
                          {receiptFile && (
                            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#10b981' }}>
                              ✓ {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
                            </p>
                          )}
                        </div>
                        
                        <button onClick={handleReceiptUpload} disabled={receiptUploading || !receiptFile || !transactionId.trim()}
                                style={{ 
                                  width: '100%', padding: '14px', borderRadius: '8px', 
                                  background: receiptUploading ? '#f59e0b' : (receiptFile && transactionId.trim() ? '#10b981' : '#9ca3af'), 
                                  color: '#fff', border: 'none', fontSize: '16px', fontWeight: 600, 
                                  cursor: (receiptFile && transactionId.trim() && !receiptUploading) ? 'pointer' : 'not-allowed',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                  transition: 'background 0.2s'
                                }}>
                          {receiptUploading ? (
                            <>⏳ AI tizimi tekshirmoqda...</>
                          ) : (
                            <>Chekni yuborish</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ═══ SOZLAMALAR ═══ */}
          {activeNav === 'Sozlamalar' && (
            <div style={{ maxWidth:'800px' }}>
              <h2 style={{ fontSize:'24px', fontWeight:700, color:'#1f2937', marginBottom:'24px', marginTop:0 }}>
                Shaxsiy ma'lumotlar
              </h2>

              {/* Asosiy ma'lumotlar kartasi */}
              <div style={{
                background:'#fff', borderRadius:'12px', padding:'32px',
                boxShadow:'0 1px 4px rgba(0,0,0,0.08)', marginBottom:'20px'
              }}>
                {/* Ism va Familiya */}
                <div style={{ marginBottom:'24px' }}>
                  <label style={{ display:'block', fontSize:'14px', fontWeight:600, color:'#374151', marginBottom:'8px' }}>
                    Ism
                  </label>
                  <input
                    type="text"
                    value={userName}
                    disabled
                    style={{
                      width:'100%', padding:'12px 16px', borderRadius:'8px',
                      border:'1px solid #e5e7eb', fontSize:'14px',
                      background:'#f9fafb', color:'#6b7280',
                      boxSizing:'border-box', cursor:'not-allowed'
                    }}
                  />
                </div>

                {/* Telefon raqam */}
                <div style={{ marginBottom:'24px' }}>
                  <label style={{ display:'block', fontSize:'14px', fontWeight:600, color:'#374151', marginBottom:'8px' }}>
                    Telefon raqam
                  </label>
                  <input
                    type="text"
                    value={userData.phone || '998901234569'}
                    disabled
                    style={{
                      width:'100%', padding:'12px 16px', borderRadius:'8px',
                      border:'1px solid #e5e7eb', fontSize:'14px',
                      background:'#f9fafb', color:'#6b7280',
                      boxSizing:'border-box', cursor:'not-allowed'
                    }}
                  />
                </div>

                {/* Parol o'zgartirish */}
                <div style={{ 
                  background:'#f9fafb', 
                  padding:'20px', 
                  borderRadius:'8px',
                  border:'1px solid #e5e7eb'
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
                    <div>
                      <h3 style={{ margin:'0 0 4px', fontSize:'16px', fontWeight:600, color:'#1f2937' }}>
                        Parol
                      </h3>
                      <p style={{ margin:0, fontSize:'13px', color:'#6b7280' }}>
                        Hisobingizni himoya qilish uchun parolni o'zgartiring
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        const newPassword = prompt('Yangi parolni kiriting:');
                        if (newPassword && newPassword.length >= 6) {
                          try {
                            const res = await api.post('/auth/change-password-authenticated', {
                              new_password: newPassword
                            });
                            
                            if (res.data.success) {
                              toast.success('Parol muvaffaqiyatli o\'zgartirildi! ✅');
                            }
                          } catch (err) {
                            console.error('Parol o\'zgartirishda xato:', err);
                            toast.error(err.response?.data?.message || 'Parol o\'zgartirishda xato yuz berdi');
                          }
                        } else if (newPassword !== null) {
                          toast.error('Parol kamida 6 ta belgidan iborat bo\'lishi kerak!');
                        }
                      }}
                      style={{
                        padding:'10px 20px', borderRadius:'8px',
                        border:'1px solid #7c3aed', background:'#7c3aed',
                        color:'#fff', fontSize:'14px', fontWeight:600,
                        cursor:'pointer', display:'flex', alignItems:'center', gap:'8px',
                        transition:'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#6d28d9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = '#7c3aed'}
                    >
                      <span style={{ fontSize:'16px' }}>✏️</span>
                      Parolni o'zgartirish
                    </button>
                  </div>
                  <div style={{ fontSize:'13px', color:'#9ca3af', marginTop:'12px' }}>
                    ••••••••
                  </div>
                </div>
              </div>

              {/* Kirish ma'lumotlari */}
              <div style={{
                background:'#fff', borderRadius:'12px', padding:'32px',
                boxShadow:'0 1px 4px rgba(0,0,0,0.08)'
              }}>
                <h3 style={{ margin:'0 0 20px', fontSize:'18px', fontWeight:600, color:'#1f2937' }}>
                  Kirish
                </h3>
                
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #f3f4f6' }}>
                    <span style={{ fontSize:'14px', color:'#6b7280' }}>Telefon</span>
                    <span style={{ fontSize:'14px', fontWeight:600, color:'#1f2937' }}>
                      {userData.phone || '998901234569'}
                    </span>
                  </div>
                  
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0' }}>
                    <span style={{ fontSize:'14px', color:'#6b7280' }}>Parol</span>
                    <span style={{ fontSize:'14px', fontWeight:600, color:'#1f2937' }}>
                      ••••••••
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ GURUHLARIM ═══ */}
          {activeNav === 'Guruhlarim' && (
            <div>
              {!selectedGroupForLessons && (
                <>
                  {/* TABS */}
                  <div style={{ display:'flex', gap:'8px', marginBottom:'20px' }}>
                    {['active','finished'].map(tab => (
                      <button key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                          padding:'8px 20px', borderRadius:'8px', border:'none',
                          background: activeTab === tab ? '#7c3aed' : '#fff',
                          color: activeTab === tab ? '#fff' : '#4b5563',
                          fontSize:'13px', fontWeight:600, cursor:'pointer',
                        }}>
                        {tab === 'active' ? 'Faol' : 'Tugagan'}
                      </button>
                    ))}
                  </div>
                {loading ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                    Yuklanmoqda...
                  </div>
                ) : groups.length === 0 ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                    Guruhlar topilmadi
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>#</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Guruh nomi</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Yo'nalishi</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>O'qituvchi</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Boshlash vaqti</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groups.map((group, index) => (
                        <tr key={group.id || index}
                          style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer', transition: 'background-color 0.2s' }}
                          onClick={() => handleGroupClick(group)}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{index + 1}</td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                            {group.name || group.group_name || 'Nomsiz guruh'}
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                            {group.course || group.course_name || '-'}
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenTeachersModal(group); }}
                              style={{
                                padding: '6px 12px', borderRadius: '6px',
                                border: '1px solid #7c3aed', backgroundColor: '#ffffff',
                                color: '#7c3aed', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#7c3aed'; e.currentTarget.style.color = '#ffffff'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.color = '#7c3aed'; }}
                            >Ko'rish</button>
                          </td>
                          <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                            {formatDate(group.start_date || group.created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                </>
              )}
            </div>
          )}

          {selectedGroupForLessons && !selectedLesson && (
            <div>
              <div style={{ marginBottom: '20px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#4b5563', fontWeight: '500' }}>
                  Uy vazifa statusi
                </p>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <select
                    value={lessonsStatusFilter}
                    onChange={(e) => setLessonsStatusFilter(e.target.value)}
                    style={{
                      padding: '10px 40px 10px 16px',
                      borderRadius: '8px',
                      border: '1px solid #d1d5db',
                      background: 'white',
                      color: '#374151',
                      fontSize: '14px',
                      fontWeight: '500',
                      outline: 'none',
                      minWidth: '180px',
                      cursor: 'pointer',
                      appearance: 'none',
                      WebkitAppearance: 'none',
                    }}
                  >
                    <option value="Barchasi">Barchasi</option>
                    <option value="Qabul qilingan">Qabul qilingan</option>
                    <option value="Qaytarilgan">Qaytarilgan</option>
                    <option value="Bajarilmagan">Bajarilmagan</option>
                    <option value="Berilmagan">Berilmagan</option>
                    <option value="Kutilmoqda">Kutilmoqda</option>
                  </select>
                  <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#6b7280', fontSize: '12px' }}>▼</span>
                </div>
              </div>

              {/* Lessons Table */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  overflow: 'hidden',
                }}
              >
                {loadingLessons ? (
                  <div style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>
                    <div style={{ width: '36px', height: '36px', border: '3px solid #e5e7eb', borderTopColor: '#7c3aed', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    Yuklanmoqda...
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }}>Mavzular</th>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }}>Video</th>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }}>Uyga vazifa Holati</th>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }}>Uyga vazifa tugash vaqti</th>
                        <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#111827' }}>Dars sanasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filtered = lessons.filter(l => {
                          if (lessonsStatusFilter === 'Barchasi') return true;
                          const hs = getHomeworkStatus(l);
                          return hs.text === lessonsStatusFilter;
                        });
                        if (filtered.length === 0) return (
                          <tr><td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: '#6b7280' }}>Darslar topilmadi</td></tr>
                        );
                        return filtered.map((lesson, index) => {
                          const hs = getHomeworkStatus(lesson);
                          const videoCount = lesson?.videoCount || lesson?.video_count || 0;
                          // Deadline format: "2026 M06 11 20:00" or "-"
                          const fmtDeadline = (val) => {
                            if (!val) return '-';
                            const d = new Date(val);
                            if (isNaN(d.getTime())) return '-';
                            return `${d.getFullYear()} M${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                          };
                          // Lesson date format: "2026 M06 11"
                          const fmtDate = (val) => {
                            if (!val) return '-';
                            const d = new Date(val);
                            if (isNaN(d.getTime())) return '-';
                            return `${d.getFullYear()} M${String(d.getMonth()+1).padStart(2,'0')} ${String(d.getDate()).padStart(2,'0')}`;
                          };
                          return (
                            <tr
                              key={lesson.id || index}
                              style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background-color 0.2s' }}
                              onClick={() => handleOpenHomeworkModal(lesson)}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <td style={{ padding: '18px 24px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>
                                {lesson.topic || lesson.title || lesson.name || '-'}
                              </td>
                              <td style={{ padding: '18px 24px' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  width: '30px', height: '30px', borderRadius: '50%',
                                  border: '2px solid #3b82f6', color: '#3b82f6',
                                  fontSize: '13px', fontWeight: '600'
                                }}>
                                  {videoCount}
                                </span>
                              </td>
                              <td style={{ padding: '18px 24px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '5px 14px',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: '#fff',
                                  backgroundColor: hs.bg,
                                }}>
                                  {hs.text}
                                </span>
                              </td>
                              <td style={{ padding: '18px 24px', fontSize: '14px', color: '#374151' }}>
                                {fmtDeadline(lesson.deadline || lesson.end_date || lesson.homework?.deadline)}
                              </td>
                              <td style={{ padding: '18px 24px', fontSize: '14px', color: '#374151' }}>
                                {fmtDate(lesson.created_at || lesson.lesson_date)}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {selectedLesson && (
            <div style={{ 
              display: 'flex', 
              gap: '20px', 
              alignItems: 'flex-start',
              flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
              width: '100%',
              maxWidth: window.innerWidth <= 768 ? '100%' : 'none',
              margin: '0 auto'
            }}>

              {/* ===== LEFT PANEL ===== */}
              <div style={{ 
                flex: 1, 
                minWidth: 0,
                width: window.innerWidth <= 768 ? '100%' : 'auto'
              }}>

                {/* Video player */}
                {loadingVideos ? (
                  <div style={{ background: '#ffffff', borderRadius: '12px', height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e5e7eb' }}>
                    <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTopColor: '#d1a877', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : videos.length > 0 ? (
                  <div>
                    <div style={{ background: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                      <video
                        key={videos[activeVideoIndex]?.formattedUrl || videos[0]?.formattedUrl}
                        controls
                        style={{ width: '100%', display: 'block', maxHeight: '420px' }}
                        src={videos[activeVideoIndex]?.formattedUrl || videos[0]?.formattedUrl}
                      >
                        Brauzeringiz video formatini qo'llab-quvvatlamaydi.
                      </video>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#ffffff', borderRadius: '12px', padding: '80px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', border: '1px solid #e5e7eb' }}>
                    <img src={NajotLogo} alt="Najot" style={{ width: '180px', height: 'auto', opacity: 0.9 }} />
                    <h3 style={{ color: '#374151', fontSize: '22px', fontWeight: '700', margin: 0 }}>Video mavjud emas</h3>
                  </div>
                )}

                {/* Lesson Title Box */}
                <div style={{ marginTop: '16px', background: '#ffffff', borderRadius: '12px', padding: '20px 24px', border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: 0, fontSize: '15px', color: '#4b5563', fontWeight: '500' }}>
                    {selectedLesson?.topic || selectedLesson?.title || '1-oy 2-dars. Hardware & Software. HTML basics'}
                  </p>
                </div>

                {/* Vazifalar section */}
                <div style={{ marginTop: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                  {/* Tab header */}
                  <div style={{ borderBottom: '1px solid #e5e7eb', padding: '0 24px', display: 'flex' }}>
                    <button style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '16px 0', fontSize: '15px', fontWeight: '500',
                      color: '#d1a877', borderBottom: '3px solid #d1a877',
                      marginBottom: '-1px'
                    }}>
                      Vazifalar
                    </button>
                  </div>

                  <div style={{ padding: '0' }}>
                    {loadingHomework ? (
                      <div style={{ textAlign: 'center', padding: '48px', color: '#6b7280' }}>
                        <div style={{ width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#d1a877', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                        Yuklanmoqda...
                      </div>
                    ) : homeworkData ? (
                      <div style={{ padding: '24px' }}>
                        
                        {/* Main Homework Info Block */}
                        <div style={{ background: '#f8f4ef', padding: '24px 32px 32px 32px', borderRadius: '12px' }}>
                          {/* Top row */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '400', color: '#1f2937' }}>
                                {homeworkData?.homework?.title || homeworkData?.title || homeworkData?.homework?.topic || homeworkData?.topic || 'Uyga vazifa'}
                              </h4>
                            </div>
                            
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                              {(homeworkData?.homework?.deadline || homeworkData?.deadline) && (
                                <div style={{ 
                                  background: '#f03a17', color: '#fff', padding: '8px 16px', borderRadius: '4px',
                                  display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '500'
                                }}>
                                  <FiAlertCircle size={16} />
                                  <span>Uyga vazifa muddati: {
                                    (() => {
                                      const d = new Date(homeworkData?.homework?.deadline || homeworkData?.deadline);
                                      const m = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek'];
                                      return `${d.getDate()} ${m[d.getMonth()]?.substring(0,3)}, ${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                                    })()
                                  }</span>
                                </div>
                              )}
                            </div>

                            <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '40px' }}>
                              <span style={{ fontSize: '13px', color: '#4b5563' }}>Fayllar soni: {(homeworkData?.homework?.file || homeworkData?.file || (studentSubmissions.length > 0 && studentSubmissions[0].file)) ? 1 : 0}</span>
                            </div>
                          </div>

                          {/* Middle row: description */}
                          <div style={{ marginBottom: '8px', marginTop: '-15px' }}>
                            <p style={{ margin: 0, fontSize: '14px', color: '#4b5563' }}>
                              {homeworkData?.homework?.description || homeworkData?.description || homeworkData?.homework?.title || homeworkData?.title || 'Uy vazifa'}
                            </p>
                          </div>
                        </div>

                        {/* Submitted State Blocks */}
                        {(() => {
                          // ✅ FAQAT backend'dan kelgan ma'lumotga qarab tekshirish
                          const hasAnswer = homeworkData?.answer || homeworkData?.homework_answer || studentSubmissions.length > 0;
                          
                          if (!hasAnswer) return null;

                          const finalData = studentSubmissions[0] || homeworkData?.homework_answer || homeworkData?.answer || {};
                          
                          // Status tekshirish - faqat finalData dan
                          const statusRaw = String(finalData?.status || '').toUpperCase();
                          const isRejected = statusRaw === 'REJECTED' || statusRaw.includes('BEKOR');
                          const isAccepted = statusRaw === 'ACCEPTED' || statusRaw.includes('QABUL');
                          const isPending = statusRaw === 'PENDING' || statusRaw.includes('KUTILMOQDA');
                          
                          const githubLink = finalData.github_link || finalData.githubLink || finalData.comment || 'Havola kiritilmagan';
                          const netlifyLink = finalData.netlify_link || finalData.vercel_link || finalData.live_link || '';
                          const fileCount = finalData.file || finalData.answer_file || finalData.student_file ? 1 : 0;
                          
                          const teacherComment = finalData.teacher_comment || (isRejected ? 'Vazifada xatoliklar mavjud' : 'Izoh qoldirilmagan');
                          const checkerName = finalData.checker_name || finalData.teacher_name || 'O\'qituvchi';
                          const penaltyText = finalData.penalty_text || "Topshiriq mezonlarga javob bermadi yoki kechikib topshirildi.";

                          return (
                            <>
                              {/* Mening jo'natmalarim */}
                              <div style={{ background: '#f8f4ef', padding: '24px 32px', borderRadius: '12px', marginTop: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '400', color: '#1f2937' }}>Mening jo'natmalarim</h4>
                                  <span style={{ fontSize: '14px', color: '#4b5563' }}>Fayllar soni: {fileCount}</span>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                                  {githubLink !== 'Havola kiritilmagan' && (
                                    <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                                      Matn/Link -&gt; <span style={{ color: '#4b5563' }}>{githubLink}</span>
                                    </p>
                                  )}
                                  {netlifyLink && (
                                    <p style={{ margin: 0, fontSize: '14px', color: '#374151' }}>
                                      Sayt -&gt; <a href={netlifyLink} target="_blank" rel="noopener noreferrer" style={{ color: '#4b5563', textDecoration: 'none' }}>{netlifyLink}</a>
                                    </p>
                                  )}
                                </div>
                                
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: '14px', color: '#374151' }}>
                                    {(() => {
                                      const dt = finalData.created_at || finalData.submitted_at || new Date();
                                      const d = new Date(dt);
                                      if (isNaN(d.getTime())) return '';
                                      const m = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek'];
                                      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${d.getDate()} ${m[d.getMonth()]?.substring(0,3)}, ${d.getFullYear()}`;
                                    })()}
                                  </span>
                                </div>
                              </div>

                              {/* O'qituvchi izohi - FAQAT ACCEPTED yoki REJECTED bo'lsa */}
                              {(isAccepted || isRejected) && (
                                <div style={{ background: '#f8f4ef', padding: '24px 32px', borderRadius: '12px', marginTop: '16px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '400', color: '#374151' }}>O'qituvchi izohi</h4>
                                    <span style={{ fontSize: '15px', color: isRejected ? '#ef4444' : '#16a34a', fontWeight: '500' }}>
                                      {isRejected ? 'Vazifa bekor qilindi' : 'Vazifa qabul qilindi'}
                                    </span>
                                  </div>
                                  
                                  {isRejected && (
                                    <div style={{ background: '#fef9c3', padding: '16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <span style={{ color: '#eab308', fontSize: '16px' }}>⚠️</span>
                                      <span style={{ color: '#854d0e', fontSize: '14px' }}>{penaltyText}</span>
                                    </div>
                                  )}

                                  <div style={{ marginBottom: '32px' }}>
                                    <p style={{ margin: 0, fontSize: '15px', color: '#4b5563' }}>
                                      {teacherComment}
                                    </p>
                                  </div>
                                  
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <span style={{ fontSize: '14px', color: '#4b5563' }}>
                                      Tekshiruvchi: {checkerName}
                                    </span>
                                    <span style={{ fontSize: '14px', color: '#374151' }}>
                                      {(() => {
                                        const dt = finalData.checked_at || finalData.updated_at || selectedLesson?.updated_at || new Date(Date.now() - 3600000);
                                        const d = new Date(dt);
                                        if (isNaN(d.getTime())) return '';
                                        const m = ['Yan','Fev','Mar','Apr','May','Iyun','Iyul','Avg','Sen','Okt','Noy','Dek'];
                                        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} ${d.getDate()} ${m[d.getMonth()]?.substring(0,3)}, ${d.getFullYear()}`;
                                      })()}
                                    </span>
                                  </div>
                                </div>
                              )}

                              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                                <span style={{ fontSize: '15px', color: '#374151' }}>Qayta topshirish imkoniyati berilmagan</span>
                              </div>
                            </>
                          );
                        })()}

                        {(() => {
                          const statusRaw = String(selectedLesson?.status || 'Berilmagan').toLowerCase();
                          const isSubmittedStatus = statusRaw !== 'berilmagan' && statusRaw !== 'bajarilmagan';
                          const isSubmitted = studentSubmissions.length > 0 || isSubmittedStatus;
                          
                          if (isSubmitted) return null;

                          return (
                            <>
                              {/* Upload form ONLY if not submitted */}
                            <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                                <h5 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: '600', color: '#1f2937' }}>Vazifani yuklash</h5>
                                
                                {/* Comment/Link input - textarea for multiline */}
                                <div style={{ marginBottom: '16px' }}>
                                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                                    Izoh, GitHub link yoki matn <span style={{ color: '#9ca3af', fontWeight: '400' }}>(ixtiyoriy)</span>
                                  </label>
                                  <textarea
                                    placeholder="GitHub link, Netlify link yoki uyga vazifa haqida izoh yozing..."
                                    value={githubLink}
                                    onChange={(e) => setGithubLink(e.target.value)}
                                    rows={3}
                                    style={{
                                      width: '100%', boxSizing: 'border-box',
                                      padding: '12px 16px', borderRadius: '8px',
                                      border: '1px solid #d1d5db', fontSize: '14px',
                                      outline: 'none', color: '#1f2937', background: '#f9fafb',
                                      resize: 'vertical', fontFamily: 'inherit'
                                    }}
                                  />
                                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                                    Kamida bitta (fayl yoki matn) yuborilishi shart
                                  </p>
                                </div>
                                
                                {/* File upload */}
                                <div style={{ marginBottom: '20px' }}>
                                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                                    Fayl yuklash <span style={{ color: '#9ca3af', fontWeight: '400' }}>(ixtiyoriy)</span>
                                  </label>
                                  <label style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '12px 16px', borderRadius: '8px',
                                    border: '1.5px dashed #d1d5db', cursor: 'pointer',
                                    color: '#6b7280', fontSize: '14px',
                                    background: selectedFile ? '#f0fdf4' : '#f9fafb'
                                  }}>
                                    <span style={{ fontSize: '20px' }}>📎</span>
                                    {selectedFile ? selectedFile.name : 'Fayl tanlash...'}
                                    <input type="file" style={{ display: 'none' }} onChange={handleFileSelect} />
                                  </label>
                                </div>
                                {/* Submit button */}
                                <button
                                  onClick={handleSubmitHomework}
                                  disabled={uploading || (!selectedFile && !githubLink.trim())}
                                  style={{
                                    width: '100%', padding: '14px',
                                    background: uploading || (!selectedFile && !githubLink.trim())
                                      ? '#e5e7eb' : '#d1a877',
                                    color: uploading || (!selectedFile && !githubLink.trim()) ? '#9ca3af' : '#fff',
                                    border: 'none', borderRadius: '8px',
                                    fontSize: '15px', fontWeight: '600', cursor:
                                    uploading || (!selectedFile && !githubLink.trim()) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  {uploading ? 'Yuklanmoqda...' : 'Topshirish'}
                                </button>
                            </div>
                          </>
                        );
                        })()}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: '15px' }}>
                        Uyga vazifa berilmagan
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ===== RIGHT PANEL — Accordion Lessons ===== */}
              <div style={{ 
                width: window.innerWidth <= 768 ? '100%' : '320px', 
                flexShrink: 0 
              }}>
                <style>
                  {`
                    .lessons-scrollbar::-webkit-scrollbar {
                      width: 6px;
                    }
                    .lessons-scrollbar::-webkit-scrollbar-track {
                      background: #f1f1f1; 
                      border-radius: 4px;
                    }
                    .lessons-scrollbar::-webkit-scrollbar-thumb {
                      background: #d1a877; 
                      border-radius: 4px;
                    }
                    .lessons-scrollbar::-webkit-scrollbar-thumb:hover {
                      background: #b58556; 
                    }
                  `}
                </style>
                <div 
                  className="lessons-scrollbar"
                  style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px',
                    maxHeight: 'calc(100vh - 180px)',
                    overflowY: 'auto',
                    paddingRight: '8px'
                  }}
                >
                  {lessons.map((lesson, index) => {
                    const isActive = selectedLesson?.id === lesson?.id;
                    const groupId = selectedGroupForLessons?.id || selectedGroupForLessons?.group_id;
                    
                    const fmtD = (v) => {
                      if (!v) return '';
                      const d = new Date(v);
                      if (isNaN(d.getTime())) return '';
                      const months = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
                      return `${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]}, ${d.getFullYear()}`;
                    };

                    return (
                      <div 
                        key={lesson.id || index} 
                        style={{ 
                          background: isActive ? '#e8c7a1' : '#f6f3ed', 
                          borderRadius: '12px', 
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          position: 'relative'
                        }}
                      >
                        {/* Lesson header */}
                        <div
                          onClick={() => {
                            if (lesson.id !== selectedLesson?.id) {
                              setSelectedLesson(lesson);
                              setActiveVideoIndex(0);
                              setVideos([]);
                              setHomeworkData(null);
                              if (groupId && lesson.id) {
                                fetchLessonVideos(groupId, lesson.id);
                                fetchHomeworkData(groupId, lesson.id);
                              }
                            }
                          }}
                          style={{
                            padding: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#111827', lineHeight: 1.3 }}>
                              {lesson.topic || lesson.title || '-'}
                            </p>
                            <p style={{ margin: 0, fontSize: '13px', color: '#4b5563' }}>
                              Dars sanasi: {fmtD(lesson.created_at || lesson.lesson_date)}
                            </p>
                          </div>
                          
                          <span style={{ color: '#4b5563', fontSize: '20px', marginLeft: '8px', display: 'flex', alignItems: 'center' }}>
                            {isActive ? (videos.length > 0 ? <FiChevronUp /> : null) : <FiChevronDown />}
                          </span>
                        </div>
                        
                        {/* Expanded: show videos */}
                        {isActive && videos.length > 0 && (
                          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {videos.map((v, vi) => (
                              <div 
                                key={vi} 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveVideoIndex(vi);
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '12px',
                                  padding: '12px 16px',
                                  fontSize: '15px', color: activeVideoIndex === vi ? '#111827' : '#374151',
                                  background: activeVideoIndex === vi ? '#d1a877' : '#dfb78e',
                                  borderRadius: '8px',
                                  fontWeight: '500',
                                  cursor: 'pointer',
                                  transition: 'background 0.2s'
                              }}>
                                <span style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  border: '2px solid #fff',
                                  color: '#fff',
                                  background: 'transparent'
                                }}>
                                  <FiPlay size={10} style={{ fill: '#fff', marginLeft: '2px' }} />
                                </span>
                                <span>{vi + 1}-video: {v.name || v.filename || v.original_name || `${lesson.topic || 'Video'}.mov`}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
      <TeachersModal
        isOpen={isTeachersModalOpen}
        onClose={handleCloseTeachersModal}
        group={selectedGroup}
      />
      {isReelsOpen && (
        <ReelsViewer 
          onClose={() => setIsReelsOpen(false)}
          onUploadClick={() => {
            setIsReelsOpen(false);
            setIsReelsUploadOpen(true);
          }}
        />
      )}

      {/* 🎬 Reels Video Upload Modal */}
      <Dialog 
        open={isReelsUploadOpen} 
        onClose={handleCancelReelsUpload}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiFilm size={24} style={{ color: '#7c3aed' }} />
              <span>Video yuklash</span>
            </div>
            <IconButton onClick={handleCancelReelsUpload} size="small">
              <FiX />
            </IconButton>
          </div>
        </DialogTitle>
        
        <DialogContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '8px' }}>
            
            {/* Video tanlash */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                Video fayl *
              </label>
              <input
                type="file"
                accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo"
                onChange={handleReelsVideoChange}
                disabled={reelsUploading}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px dashed #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              />
              {reelsVideoFile && (
                <div style={{ marginTop: '8px', padding: '8px 12px', background: '#f0fdf4', borderRadius: '6px', fontSize: '13px', color: '#16a34a' }}>
                  ✓ {reelsVideoFile.name} ({(reelsVideoFile.size / (1024 * 1024)).toFixed(2)} MB)
                </div>
              )}
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#6b7280' }}>
                MP4, WebM, MOV, AVI (max 100MB)
              </p>
            </div>

            {/* Sarlavha */}
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600, color: '#374151' }}>
                Sarlavha (ixtiyoriy)
              </label>
              <TextField
                fullWidth
                placeholder="Video haqida qisqacha..."
                value={reelsTitle}
                onChange={(e) => setReelsTitle(e.target.value)}
                disabled={reelsUploading}
                variant="outlined"
                size="small"
              />
            </div>

            {/* Progress bar */}
            {reelsUploading && (
              <div>
                <LinearProgress 
                  variant="determinate" 
                  value={reelsUploadProgress} 
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <p style={{ margin: '8px 0 0', fontSize: '13px', textAlign: 'center', color: '#6b7280' }}>
                  Yuklanmoqda... {reelsUploadProgress}%
                </p>
              </div>
            )}
          </div>
        </DialogContent>

        <DialogActions>
          <Button 
            onClick={handleCancelReelsUpload} 
            disabled={reelsUploading}
            color="inherit"
          >
            Bekor qilish
          </Button>
          <Button 
            onClick={handleReelsUpload}
            disabled={reelsUploading || !reelsVideoFile}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5568d3 0%, #65408b 100%)',
              }
            }}
            startIcon={reelsUploading ? <CircularProgress size={16} color="inherit" /> : <FiUpload />}
          >
            {reelsUploading ? 'Yuklanmoqda...' : 'Yuklash'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 💳 AI Tekshiruv Loading Overlay */}
      {(receiptUploading || creatingPayment) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '20px',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '40px 48px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
            maxWidth: '320px',
            textAlign: 'center',
          }}>
            {/* Spinner */}
            <div style={{
              width: '60px',
              height: '60px',
              border: '5px solid #e5e7eb',
              borderTop: '5px solid #7c3aed',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }} />
            <div style={{ fontSize: '36px' }}>{receiptUploading ? '🤖' : '💳'}</div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1f2937' }}>
              {receiptUploading ? 'AI tekshirmoqda...' : "To'lov yaratilmoqda..."}
            </h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280', lineHeight: '1.5' }}>
              {receiptUploading
                ? "Chekingiz AI tizimi tomonidan\ntalil qilinmoqda. Kuting..."
                : "Iltimos, kuting..."}
            </p>
          </div>
        </div>
      )}

      {/* CSS animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
