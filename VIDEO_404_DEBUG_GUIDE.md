# Video 404 Xatosini Bartaraf Etish Qo'llanmasi

## Muammo
Video ijro etishda 404 (Not Found) xatosi chiqmoqda. Bu video fayllar serverda topilmayotganligini anglatadi.

## Xatoni Aniqlash

### 1. Konsolni Tekshiring
Browser Developer Console (F12) ni oching va quyidagi log'larni ko'ring:

```
[Video] ❌❌❌ 404 XATO - VIDEO FAYL TOPILMADI ❌❌❌
[Video] SINAB KO'RILGAN BARCHA URL LAR:
   1. https://najot-edu.softwareengineer.uz/files/files/video.mp4
   2. https://najot-edu.softwareengineer.uz/api/v1/files/group/123/456
   3. https://najot-edu.softwareengineer.uz/api/v1/files/stream/video.mp4
```

Bu sizga qaysi URL lar sinab ko'rilganini ko'rsatadi.

### 2. Fayl Obyektini Tekshiring
Konsolda `Fayl obyekti:` deb yozilgan qismni toping. Bu sizga backend qaysi ma'lumotlarni yuborayotganini ko'rsatadi:

```json
{
  "id": 456,
  "name": "video.mp4",
  "url": "/files/videos/video.mp4",
  "path": "uploads/videos/video.mp4",
  "lesson_id": 789
}
```

## Backend Adminlari Uchun Tekshirish Ro'yxati

### 1. ✅ Fayl Mavjudligini Tekshiring

Video fayllar qayerda saqlanadi:
```bash
# Odatiy joylar:
ls -la /var/www/app/uploads/videos/
ls -la /var/www/app/files/files/
ls -la /opt/app/uploads/videos/
```

Agar fayllar boshqa joyda bo'lsa, to'g'ri yo'lni toping:
```bash
find / -name "*.mp4" -type f 2>/dev/null
```

### 2. ✅ Fayl Ruxsatlarini Tekshiring

Fayllar va papkalar to'g'ri ruxsatlarga ega bo'lishi kerak:
```bash
# Papkalar uchun: 755 (rwxr-xr-x)
chmod 755 /var/www/app/uploads/
chmod 755 /var/www/app/uploads/videos/

# Fayllar uchun: 644 (rw-r--r--)
chmod 644 /var/www/app/uploads/videos/*.mp4

# Owner'ni tekshiring (nginx yoki www-data bo'lishi kerak):
chown -R www-data:www-data /var/www/app/uploads/
```

### 3. ✅ Nginx Konfiguratsiyasini Tekshiring

`/etc/nginx/sites-available/` yoki `/etc/nginx/conf.d/` papkasida backend konfiguratsiyasini oching:

```nginx
server {
    listen 80;
    server_name najot-edu.softwareengineer.uz;

    # API requests
    location /api/v1/ {
        proxy_pass http://localhost:3000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static video files
    location /files/ {
        alias /var/www/app/uploads/;
        autoindex off;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Alternative location
    location /uploads/ {
        alias /var/www/app/uploads/;
        autoindex off;
    }
}
```

**Muhim:**
- `alias` yo'li to'g'ri bo'lishi kerak
- Yo'l oxirida `/` bo'lishi kerak: `alias /var/www/app/uploads/;`
- Nginx restart qiling: `sudo systemctl restart nginx`

### 4. ✅ Backend Logs'ni Tekshiring

Backend serverdagi xatolarni ko'ring:

```bash
# PM2 ishlatilsa:
pm2 logs backend

# Systemd ishlatilsa:
journalctl -u backend -f

# Fayldan:
tail -f /var/www/app/logs/backend.log
```

### 5. ✅ Backend API Endpoint'ini Tekshiring

Backend kodda quyidagi endpoint'lar mavjudligini tekshiring:

```typescript
// NestJS controller misoli:

@Controller('files')
export class FilesController {
  
  // GET /api/v1/files/{groupId} - ro'yxat
  @Get(':groupId')
  async getFilesByGroup(@Param('groupId') groupId: number) {
    const files = await this.filesService.findByGroup(groupId);
    return files; // [{id, name, url, path, ...}]
  }

  // GET /api/v1/files/group/{groupId}/{fileId} - alohida fayl
  @Get('group/:groupId/:fileId')
  async getFile(@Param('groupId') groupId: number, @Param('fileId') fileId: number) {
    const file = await this.filesService.findOne(fileId);
    // Fayl yo'lini to'g'ri qaytarish:
    return {
      ...file,
      url: `/files/videos/${file.filename}`, // ✅ To'g'ri format
      path: `uploads/videos/${file.filename}` // ✅ To'g'ri yo'l
    };
  }

  // GET /api/v1/files/stream/{filename} - streaming
  @Get('stream/:filename')
  async streamVideo(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = `/var/www/app/uploads/videos/${filename}`;
    
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Video fayl topilmadi');
    }
    
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'video/mp4',
      'Content-Length': stat.size
    });
    
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  }
}
```

### 6. ✅ Database'dagi URL Formatini Tekshiring

Database'da saqlangan URL lar to'g'ri formatda bo'lishi kerak:

```sql
-- PostgreSQL misoli:
SELECT id, name, url, path FROM files LIMIT 10;

-- To'g'ri formatlar:
-- url: /files/videos/video.mp4
-- url: /uploads/videos/video.mp4
-- url: https://najot-edu.softwareengineer.uz/files/videos/video.mp4

-- NOTO'G'RI formatlar:
-- url: video.mp4 (absolute yo'l yo'q)
-- url: C:\uploads\video.mp4 (Windows yo'li)
-- url: /var/www/app/uploads/video.mp4 (server ichki yo'li, web uchun emas)
```

Agar formatlar noto'g'ri bo'lsa, migration yozing:

```sql
-- Misol: /files/ prefiksini qo'shish
UPDATE files 
SET url = CONCAT('/files/videos/', filename)
WHERE url NOT LIKE 'http%' AND url NOT LIKE '/%';
```

## Frontend Sozlamalari

Frontend quyidagi URL formatlarini sinab ko'radi (automatik):

1. **Direct URL**: Agar `file.url` yoki `file.path` mavjud bo'lsa:
   - `https://najot-edu.softwareengineer.uz/files/videos/video.mp4`

2. **Bare filename**: Agar faqat fayl nomi bo'lsa:
   - `https://najot-edu.softwareengineer.uz/files/files/video.mp4`

3. **Group + File ID**:
   - `https://najot-edu.softwareengineer.uz/api/v1/files/group/123/456`

4. **Stream endpoint**:
   - `https://najot-edu.softwareengineer.uz/api/v1/files/stream/video.mp4`

Agar bu formatlarning hech biri ishlamasa, backend'da muammo bor.

## URL Formatini O'zgartirish (Agar Kerak Bo'lsa)

Agar backend boshqa URL formatini ishlatsa, `src/api/api.js` faylidagi `buildVideoUrlCandidates` funksiyasini o'zgartiring:

```javascript
export const buildVideoUrlCandidates = (file, groupId) => {
  const out = [];
  
  // Backend'ingizning formatini qo'shing:
  if (bareName) {
    // Misol: /api/v1/media/video/{filename}
    push(`${BACKEND_API_URL}/media/video/${encodeURIComponent(bareName)}`);
  }
  
  return out;
};
```

## Testlash

### 1. Qo'lda URL'ni Tekshiring

Browser'da to'g'ridan-to'g'ri video URL'ni oching:
```
https://najot-edu.softwareengineer.uz/files/videos/video.mp4
```

Agar video ko'rinmasa yoki 404 chiqsa - backend yoki Nginx muammosi.

### 2. cURL bilan Tekshiring

```bash
# HEAD request - fayl mavjudligini tekshirish
curl -I https://najot-edu.softwareengineer.uz/files/videos/video.mp4

# To'liq yuklab olish
curl -v https://najot-edu.softwareengineer.uz/files/videos/video.mp4 -o test.mp4

# Token bilan (agar kerak bo'lsa)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://najot-edu.softwareengineer.uz/api/v1/files/stream/video.mp4
```

Kutilgan javob:
```
HTTP/1.1 200 OK
Content-Type: video/mp4
Content-Length: 12345678
```

### 3. Network Tab'ni Tekshiring

Browser Developer Tools > Network tab'da:
- Video so'rov'ni toping
- Status kodini ko'ring (404, 403, 500, etc.)
- Response headers'ni tekshiring
- Preview tab'da video ko'rinishini sinab ko'ring

## Eng Ko'p Uchraydigan Muammolar va Yechimlar

### Muammo: 404 Not Found
**Sabab:**
- Fayl serverda yo'q
- Noto'g'ri yo'l yoki URL
- Nginx location noto'g'ri sozlangan

**Yechim:**
1. Fayl mavjudligini tekshiring
2. Nginx konfiguratsiyasini to'g'rilang
3. Backend URL formatini database'da tekshiring

### Muammo: 403 Forbidden
**Sabab:**
- Fayl ruxsatlari noto'g'ri
- Nginx user'i faylni o'qiy olmayapti

**Yechim:**
```bash
chmod 644 /var/www/app/uploads/videos/*.mp4
chown www-data:www-data /var/www/app/uploads/videos/*.mp4
```

### Muammo: 500 Internal Server Error
**Sabab:**
- Backend kodda xatolik
- Database connection muammosi
- Fayl o'qishda xatolik

**Yechim:**
- Backend logs'ni tekshiring
- Try-catch block'larni qo'shing
- Error handling'ni yaxshilang

### Muammo: Video ro'yxat chiqadi lekin ijro etib bo'lmaydi
**Sabab:**
- Backend fayllar ro'yxatini to'g'ri qaytarmoqda
- Lekin URL format noto'g'ri

**Yechim:**
- Database'dagi `url` va `path` maydonlarini tekshiring
- Backend'da fayl URL'ni to'g'ri generatsiya qilish
- Frontend konsolda "SINAB KO'RILGAN URL LAR" ni tekshiring

## Qo'shimcha Yordam

Agar muammo hal bo'lmasa, quyidagilarni yuboring:

1. **Browser Console logs** (F12 > Console):
   - "SINAB KO'RILGAN BARCHA URL LAR"
   - "Fayl obyekti" JSON

2. **Backend logs** (oxirgi 50 qator):
   ```bash
   pm2 logs backend --lines 50
   ```

3. **Nginx access log** (video so'rovlar):
   ```bash
   tail -f /var/log/nginx/access.log | grep -i "\.mp4"
   ```

4. **Database query natijasi**:
   ```sql
   SELECT * FROM files WHERE id = YOUR_FILE_ID;
   ```

5. **Nginx konfiguratsiya fayli**:
   ```bash
   cat /etc/nginx/sites-available/backend
   ```

Bu ma'lumotlar bilan aniq muammoni topish va hal qilish osonroq bo'ladi.
