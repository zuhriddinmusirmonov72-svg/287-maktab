export const swaggerDoc = {
  openapi: '3.0.0',
  info: {
    title: 'Najot Ta\'lim API',
    version: '1.0.0',
    description: 'Najot Ta\'lim o\'quv markazi boshqaruv tizimi API'
  },
  servers: [{ url: '/api/v1', description: 'Local server' }],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { type: 'object', properties: {
            phone: { type: 'string', example: '998901234567' },
            password: { type: 'string', example: 'admin123' }
          }, required: ['phone', 'password'] } } }
        },
        responses: { 200: { description: 'Token qaytaradi' } }
      }
    },
    '/auth/send-otp': {
      post: { tags: ['Auth'], summary: 'OTP yuborish (test: 1234)', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { phone: { type: 'string' } } } } } },
        responses: { 200: { description: 'OTP yuborildi' } }
      }
    },
    '/auth/verify-otp': {
      post: { tags: ['Auth'], summary: 'OTP tasdiqlash (test: 1234)', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { phone: { type: 'string' }, otp: { type: 'string', example: '1234' } } } } } },
        responses: { 200: { description: 'Tasdiqlandi' } }
      }
    },
    '/auth/change-password': {
      post: { tags: ['Auth'], summary: 'Parol o\'zgartirish', security: [],
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { phone: { type: 'string' }, new_password: { type: 'string' } } } } } },
        responses: { 200: { description: 'Parol o\'zgartirildi' } }
      }
    },
    '/students': {
      get: { tags: ['Students'], summary: 'Barcha talabalar', parameters: [{ name: 'page', in: 'query', schema: { type: 'integer' } }, { name: 'limit', in: 'query', schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } },
      post: { tags: ['Students'], summary: 'Yangi talaba (multipart)', requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { full_name: { type: 'string' }, phone: { type: 'string' }, password: { type: 'string' }, photo: { type: 'string', format: 'binary' } }, required: ['full_name', 'phone'] } } } }, responses: { 201: { description: 'Yaratildi' } } }
    },
    '/students/archive': { get: { tags: ['Students'], summary: 'Arxivdagi talabalar', responses: { 200: { description: 'OK' } } } },
    '/students/my/groups': { get: { tags: ['Students'], summary: 'STUDENT: o\'z guruhlari', responses: { 200: { description: 'OK' } } } },
    '/students/one/{id}': {
      get: { tags: ['Students'], summary: 'Bitta talaba', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } }
    },
    '/students/{id}': {
      patch: { tags: ['Students'], summary: 'Talaba tahrirlash (multipart)', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { full_name: { type: 'string' }, phone: { type: 'string' }, photo: { type: 'string', format: 'binary' } } } } } }, responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Students'], summary: 'Talaba o\'chirish', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } }
    },
    '/students/homeworkAnswer/{homeworkId}': {
      post: { tags: ['Students'], summary: 'Uyga vazifa topshirish (STUDENT)', parameters: [{ name: 'homeworkId', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { title: { type: 'string' }, comment: { type: 'string' }, file: { type: 'string', format: 'binary' } }, required: ['title'] } } } }, responses: { 201: { description: 'Topshirildi' } } }
    },
    '/teachers': {
      get: { tags: ['Teachers'], summary: 'Barcha o\'qituvchilar', responses: { 200: { description: 'OK' } } },
      post: { tags: ['Teachers'], summary: 'Yangi o\'qituvchi (multipart)', requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { full_name: { type: 'string' }, phone: { type: 'string' }, subject: { type: 'string' }, password: { type: 'string' }, photo: { type: 'string', format: 'binary' } }, required: ['full_name', 'phone'] } } } }, responses: { 201: { description: 'Yaratildi' } } }
    },
    '/teachers/my/profile': { get: { tags: ['Teachers'], summary: 'TEACHER: o\'z profili', responses: { 200: { description: 'OK' } } } },
    '/teachers/my/groups': { get: { tags: ['Teachers'], summary: 'TEACHER: o\'z guruhlari', responses: { 200: { description: 'OK' } } } },
    '/teachers/{id}': {
      patch: { tags: ['Teachers'], summary: 'O\'qituvchi tahrirlash', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { full_name: { type: 'string' }, phone: { type: 'string' }, subject: { type: 'string' }, photo: { type: 'string', format: 'binary' } } } } } }, responses: { 200: { description: 'OK' } } },
      delete: { tags: ['Teachers'], summary: 'O\'qituvchi o\'chirish', parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } }
    },
    '/groups/all': { get: { tags: ['Groups'], summary: 'Barcha guruhlar', responses: { 200: { description: 'OK' } } } },
    '/groups/{groupId}': { get: { tags: ['Groups'], summary: 'Guruh ma\'lumoti', parameters: [{ name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } } },
    '/groups/{groupId}/lessons/all': { get: { tags: ['Groups'], summary: 'Guruh darslari + status', parameters: [{ name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } } },
    '/groups/{groupId}/lessons/{lessonId}/homeworks': { get: { tags: ['Groups'], summary: 'Dars uyga vazifalari (STUDENT)', parameters: [{ name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } }, { name: 'lessonId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } } },
    '/homework/all': { get: { tags: ['Homework'], summary: 'Barcha uyga vazifalar', responses: { 200: { description: 'OK' } } } },
    '/homework/{groupId}': { get: { tags: ['Homework'], summary: 'Guruh uyga vazifalari', parameters: [{ name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } } },
    '/group/{groupId}/homework/{homeworkId}/results': {
      get: { tags: ['Homework'], summary: 'Topshirganlar ro\'yxati', parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'homeworkId', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'NOT_SENT'] } }
      ], responses: { 200: { description: 'OK' } } }
    },
    '/group/{groupId}/homework/{homeworkId}/check': {
      post: { tags: ['Homework'], summary: 'Uyga vazifani baholash', parameters: [
        { name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'homeworkId', in: 'path', required: true, schema: { type: 'integer' } }
      ], requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: {
        grade: { type: 'integer', minimum: 0, maximum: 100, example: 85 },
        title: { type: 'string', example: 'Yaxshi bajarildi' },
        student_id: { type: 'integer', example: 1 },
        homework_answer_id: { type: 'integer', example: 1 }
      }, required: ['grade', 'student_id'] } } } }, responses: { 200: { description: 'Baholandi' } } }
    },
    '/rooms': {
      get: { tags: ['Rooms'], summary: 'Barcha xonalar', responses: { 200: { description: 'OK' } } },
      post: { tags: ['Rooms'], summary: 'Yangi xona', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, capacity: { type: 'integer' } }, required: ['name'] } } } }, responses: { 201: { description: 'OK' } } }
    },
    '/courses': {
      get: { tags: ['Courses'], summary: 'Barcha kurslar', responses: { 200: { description: 'OK' } } },
      post: { tags: ['Courses'], summary: 'Yangi kurs', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, duration: { type: 'integer' }, price: { type: 'number' } }, required: ['name'] } } } }, responses: { 201: { description: 'OK' } } }
    },
    '/files/{groupId}': { get: { tags: ['Files'], summary: 'Guruh videolari', parameters: [{ name: 'groupId', in: 'path', required: true, schema: { type: 'integer' } }], responses: { 200: { description: 'OK' } } } },
    '/files/group/{grupId}/upload': {
      post: { tags: ['Files'], summary: 'Video yuklash (multipart)', parameters: [
        { name: 'grupId', in: 'path', required: true, schema: { type: 'integer' } },
        { name: 'lessonId', in: 'query', required: true, schema: { type: 'integer' } }
      ], requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } } } }, responses: { 201: { description: 'Yuklandi' } } }
    },
    '/attendance/all': { get: { tags: ['Attendance'], summary: 'Barcha davomat', responses: { 200: { description: 'OK' } } } },
    '/attendance': { post: { tags: ['Attendance'], summary: 'Davomat qo\'shish', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { group_id: { type: 'integer' }, student_id: { type: 'integer' }, lesson_id: { type: 'integer' }, isPresent: { type: 'boolean' } } } } } }, responses: { 201: { description: 'OK' } } } },
    '/student-group': { post: { tags: ['StudentGroup'], summary: 'O\'quvchini guruhga qo\'shish', requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { student_id: { type: 'integer' }, group_id: { type: 'integer' } } } } } }, responses: { 201: { description: 'OK' } } } },
    '/reels': {
      get: { 
        tags: ['Reels'], 
        summary: 'Barcha reelslar (pagination)', 
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
        ],
        responses: { 200: { description: 'OK' } } 
      },
      post: { 
        tags: ['Reels'], 
        summary: 'Yangi video yuklash (multipart, max 100MB)', 
        requestBody: { 
          content: { 
            'multipart/form-data': { 
              schema: { 
                type: 'object', 
                properties: { 
                  video: { type: 'string', format: 'binary', description: 'Video fayl (MP4, WebM, MOV, AVI)' },
                  title: { type: 'string', example: 'Mening videom', description: 'Video sarlavhasi (ixtiyoriy)' },
                  description: { type: 'string', description: 'Video tavsifi (ixtiyoriy)' }
                }, 
                required: ['video'] 
              } 
            } 
          } 
        }, 
        responses: { 201: { description: 'Video yuklandi' } } 
      }
    },
    '/reels/{id}/like': {
      post: { 
        tags: ['Reels'], 
        summary: 'Like / Unlike toggle', 
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Like holatini o\'zgartirdi' } } 
      }
    },
    '/reels/{id}/view': {
      post: { 
        tags: ['Reels'], 
        summary: 'Ko\'rishlar sonini oshirish', 
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'View qo\'shildi' } } 
      }
    },
    '/reels/{id}': {
      delete: { 
        tags: ['Reels'], 
        summary: 'Video o\'chirish (faqat owner yoki admin)', 
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Video o\'chirildi' } } 
      }
    }
  }
};
