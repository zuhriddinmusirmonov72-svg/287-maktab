# Uyga Vazifa Baholash - Backend Muammo

## Muammo

SUPER ADMIN student uyga vazifasini baholamoqchi bo'lganida quyidagi xato chiqmoqda:

```
400 Bad Request
"homework_answer_id must be a number conforming to the specified constraints"
```

## Backend API

**Endpoint:** `POST /group/{groupId}/homework/{homeworkId}/check`

**Hozirgi holat:**
- Backend `homework_answer_id` ni **majburiy** field qilib belgilagan
- Lekin `GET /group/{groupId}/homework/{homeworkId}/results?status=PENDING` endpoint'i `homework_answer_id: null` qaytarmoqda

## Backend'dan Kelgan Ma'lumot

```json
{
  "id": 196,
  "student_id": 196,
  "homework_answer_id": null,  ← ❌ NULL!
  "full_name": "Don",
  "status": "PENDING",
  "submitted_at": "2026-07-06T13:30:35.187Z",  ← ✅ Topshirgan!
  "student": {
    "id": 196,
    "created_at": "2026-07-06T13:30:35.187Z",
    "full_name": "Don"
  }
}
```

**Demak:**
- Student uyga vazifa topshirgan (`submitted_at` bor, `status: PENDING`)
- Lekin backend `homework_answer_id: null` qaytarmoqda
- SUPER ADMIN baholashga urin ganda, backend `homework_answer_id must be a number` deb xato bermoqda

## Yechim Variantlari

### Variant 1: Backend - homework_answer_id ni ixtiyoriy qilish (TAVSIYA ETILADI)

Backend DTO'da `homework_answer_id` ni **ixtiyoriy** qiling va `student_id` yetarli bo'lsin:

```typescript
// NestJS DTO
export class CheckHomeworkDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  grade: number;

  @IsString()
  title: string;

  @IsNumber()
  student_id: number;

  @IsNumber()
  @IsOptional()  // ← QOSHING
  homework_answer_id?: number;
}
```

**Controller:**

```typescript
@Post('/group/:groupId/homework/:homeworkId/check')
async checkHomework(
  @Param('groupId') groupId: number,
  @Param('homeworkId') homeworkId: number,
  @Body() dto: CheckHomeworkDto
) {
  // homework_answer_id ni topish
  let homeworkAnswerId = dto.homework_answer_id;
  
  if (!homeworkAnswerId) {
    // student_id va homeworkId orqali topamiz
    const submission = await this.homeworkService.findSubmission(
      groupId,
      homeworkId,
      dto.student_id
    );
    
    if (!submission) {
      throw new NotFoundException('Student uyga vazifasini topshirmagan');
    }
    
    homeworkAnswerId = submission.id;
  }
  
  return this.homeworkService.gradeSubmission(
    homeworkAnswerId,
    dto.grade,
    dto.title
  );
}
```

### Variant 2: Backend - homework_answer_id ni results endpoint'ida qaytarish

`GET /group/{groupId}/homework/{homeworkId}/results` endpoint'i to'liq ma'lumot qaytarishi kerak:

```typescript
@Get('/group/:groupId/homework/:homeworkId/results')
async getResults(
  @Param('groupId') groupId: number,
  @Param('homeworkId') homeworkId: number,
  @Query('status') status?: string
) {
  const submissions = await this.homeworkService.getSubmissions(
    groupId,
    homeworkId,
    status
  );
  
  return submissions.map(sub => ({
    id: sub.student_id,  // ← student ID
    student_id: sub.student_id,
    homework_answer_id: sub.id,  // ← ❌ HOZIR NULL, ✅ KERAK!
    full_name: sub.student.full_name,
    status: sub.status,
    submitted_at: sub.created_at,
    file: sub.file,
    comment: sub.comment,
    grade: sub.grade,
    teacher_comment: sub.teacher_comment
  }));
}
```

### Variant 3: Frontend - Submission ID ni to'g'ri olish (VAQTINCHA)

Agar backend o'zgarmasa, frontend quyidagi endpoint'dan submission ID ni olsin:

```javascript
// GET /students/homeworkAnswer/{homeworkId} yoki
// GET /group/{groupId}/homework/{homeworkId}/student/{studentId}
```

## Test Qilish

### 1. Backend Logs

```bash
pm2 logs backend --lines 50
# yoki
journalctl -u backend -f
```

Quyidagi log'larni toping:
```
POST /group/87/homework/245/check
Body: { grade: 100, title: "...", student_id: 196, homework_answer_id: null }
```

### 2. Database Query

```sql
-- PostgreSQL
SELECT 
  ha.id as homework_answer_id,
  ha.student_id,
  ha.homework_id,
  ha.created_at as submitted_at,
  ha.status,
  ha.file,
  ha.comment,
  ha.grade,
  ha.teacher_comment,
  s.full_name
FROM homework_answers ha
LEFT JOIN students s ON ha.student_id = s.id
WHERE ha.homework_id = 245
  AND ha.student_id = 196;
```

**Kutilgan natija:**
```
homework_answer_id | student_id | homework_id | submitted_at | status
------------------+------------+-------------+--------------+---------
     XYZ          |    196     |     245     | 2026-07-06   | PENDING
```

`XYZ` - bu `homework_answer_id` bo'lishi kerak va frontend'ga qaytarilishi kerak!

### 3. API Testi (Postman/cURL)

```bash
# 1. Submissions ro'yxatini olish
curl -X GET \
  "https://najot-edu.softwareengineer.uz/api/v1/group/87/homework/245/results?status=PENDING" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Kutilgan: homework_answer_id: 123 (number), emas null

# 2. Baholash (agar homework_answer_id: 123 bo'lsa)
curl -X POST \
  "https://najot-edu.softwareengineer.uz/api/v1/group/87/homework/245/check" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "grade": 100,
    "title": "Baholandi",
    "student_id": 196,
    "homework_answer_id": 123
  }'

# Kutilgan: 200 OK
```

## Xulosa

**Muammo:** Backend `homework_answer_id: null` qaytarmoqda, lekin keyinchalik `check` endpoint'ida `homework_answer_id` ni majburiy qilib belgilagan.

**Yechim:** Backend admin quyidagilardan birini qilishi kerak:

1. ✅ **TAVSIYA ETILADI**: `homework_answer_id` ni ixtiyoriy qilish va `student_id` + `homework_id` orqali topish
2. ✅ `results` endpoint'ida `homework_answer_id` ni to'g'ri qaytarish
3. ❌ **TAVSIYA ETILMAYDI**: Frontend'da murakkabroq logic yozish

**Frontend hozirgi holat:** ✅ Barcha mumkin bo'lgan joylardan `homework_answer_id` ni qidiryapti, lekin backend `null` qaytarmoqda.

**Keyingi qadam:** Backend admin bilan gaplashing va yuqoridagi yechimlardan birini qo'llashlarini so'rang.
