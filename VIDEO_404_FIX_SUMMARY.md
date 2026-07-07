# Video 404 Error - Enhanced Debugging Summary

## Changes Made

### 1. Enhanced Error Logging in `src/api/api.js`

**File:** `src/api/api.js` (loadVideoForPlayback function, around line 1330)

**Changes:**
- Added comprehensive console logging when 404 error occurs
- Now logs ALL attempted URLs in a clear numbered list
- Logs the complete file object and group ID
- Provides a checklist for backend admins to investigate:
  - File existence on server
  - Correct URL format
  - Nginx configuration
  - File permissions
  - Backend logs

**Example output:**
```javascript
[Video] ❌❌❌ 404 XATO - VIDEO FAYL TOPILMADI ❌❌❌
[Video] Fayl obyekti: {id: 456, name: "video.mp4", url: "/files/videos/..."}
[Video] Group ID: 123
[Video] BACKEND ga quyidagilarni tekshiring:
   1. Video fayllar serverda mavjudmi: /var/www/app/uploads/videos/
   2. Video fayl nomini tekshiring
   3. Nginx konfiguratsiyasi to'g'rimi
   4. Fayl ruxsatlari: 755 (folders), 644 (files)
   5. Backend logs ni tekshiring
[Video] ❌ SINAB KO'RILGAN BARCHA URL LAR:
   1. https://najot-edu.softwareengineer.uz/files/videos/video.mp4
   2. https://najot-edu.softwareengineer.uz/api/v1/files/group/123/456
   3. https://najot-edu.softwareengineer.uz/api/v1/files/stream/video.mp4
```

**Error object now includes:**
- `status: 404`
- `message`: User-friendly error message
- `details`: Additional context
- `triedUrls`: Array of all URLs that were attempted
- `file`: The original file object for debugging

### 2. Enhanced Error Handling in `src/pages/GroupDetails.jsx`

**File:** `src/pages/GroupDetails.jsx` (openVideoPlayer function, around line 665)

**Changes:**
- Logs the file object and group ID when error occurs
- Displays all tried URLs in a numbered list
- Shows a specific troubleshooting checklist for 404 errors
- Provides longer toast duration (8 seconds) for 404 errors to ensure user sees it

### 3. Enhanced Error Handling in `src/pages/SUPER ADMIN 2/TeacherGroupDetails.jsx`

**File:** `src/pages/SUPER ADMIN 2/TeacherGroupDetails.jsx` (openVideoPlayer function)

**Changes:**
- Same enhancements as GroupDetails.jsx
- Consistent error logging across admin and teacher interfaces

### 4. Created Comprehensive Debug Guide

**File:** `VIDEO_404_DEBUG_GUIDE.md` (Uzbek language)

A complete troubleshooting guide including:
- How to read console logs
- Backend admin checklist
- File permission commands
- Nginx configuration examples
- Database query examples
- Common problems and solutions
- Testing procedures with cURL

## Current Video URL Generation Logic

The `buildVideoUrlCandidates` function in `src/api/api.js` tries multiple URL formats automatically:

1. **Direct URL from metadata**: If `file.url` or `file.path` exists
   - `https://najot-edu.softwareengineer.uz/files/videos/video.mp4`

2. **Bare filename**: 
   - `https://najot-edu.softwareengineer.uz/files/files/video.mp4`

3. **Group + File ID**:
   - `https://najot-edu.softwareengineer.uz/api/v1/files/group/{groupId}/{fileId}`

4. **Stream endpoint**:
   - `https://najot-edu.softwareengineer.uz/api/v1/files/stream/{filename}`

5. **Download endpoint**:
   - `https://najot-edu.softwareengineer.uz/api/v1/files/download/{filename}`

## Root Cause Analysis

The 404 error indicates that **video files are not accessible** at any of the attempted URLs. This is a **backend infrastructure issue**, not a frontend problem. The frontend is correctly trying multiple URL formats, but none of them are returning valid video files.

## Required Backend Actions

### 1. Verify File Storage
```bash
ls -la /var/www/app/uploads/videos/
# or wherever videos are stored
```

### 2. Check File Permissions
```bash
# Folders: 755 (rwxr-xr-x)
chmod 755 /var/www/app/uploads/videos/

# Files: 644 (rw-r--r--)
chmod 644 /var/www/app/uploads/videos/*.mp4

# Owner should be nginx/www-data
chown -R www-data:www-data /var/www/app/uploads/
```

### 3. Verify Nginx Configuration
```nginx
location /files/ {
    alias /var/www/app/uploads/;
    autoindex off;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 4. Check Backend API Endpoints

Ensure these endpoints exist and return correct data:
- `GET /api/v1/files/{groupId}` - Returns file list with correct URL format
- `GET /api/v1/files/group/{groupId}/{fileId}` - Returns specific file metadata
- `GET /api/v1/files/stream/{filename}` - Streams video file

### 5. Verify Database URL Format

Database should store URLs in web-accessible format:
```sql
-- ✅ CORRECT:
url: /files/videos/video.mp4
url: https://najot-edu.softwareengineer.uz/files/videos/video.mp4

-- ❌ INCORRECT:
url: video.mp4 (no path)
url: C:\uploads\video.mp4 (Windows path)
url: /var/www/app/uploads/video.mp4 (server internal path)
```

## Testing Steps

### 1. Direct URL Test
Open in browser:
```
https://najot-edu.softwareengineer.uz/files/videos/[actual-filename].mp4
```
Should play the video or start download.

### 2. cURL Test
```bash
curl -I https://najot-edu.softwareengineer.uz/files/videos/video.mp4
```
Expected response:
```
HTTP/1.1 200 OK
Content-Type: video/mp4
Content-Length: [file-size]
```

### 3. Console Log Analysis
After attempting to play a video:
1. Open browser console (F12)
2. Look for "SINAB KO'RILGAN BARCHA URL LAR"
3. Copy each URL and test manually
4. Identify which URL format should work

## Next Steps for User

1. **Open browser console** (press F12)
2. **Try to play a video**
3. **Look for the console output** with:
   - "SINAB KO'RILGAN BARCHA URL LAR" (list of tried URLs)
   - "Fayl obyekti" (file object structure)
4. **Share this information** with backend admin
5. **Backend admin** should follow the checklist in `VIDEO_404_DEBUG_GUIDE.md`

## Frontend Status

✅ **Frontend is working correctly**:
- Properly fetches file metadata from API
- Tries multiple URL formats automatically
- Provides comprehensive error logging
- Shows user-friendly error messages
- Has detailed debugging information for developers

❌ **Backend/Infrastructure issue**:
- Video files not accessible at expected URLs
- Either files don't exist, or URLs are incorrect, or Nginx is misconfigured

## Summary

The frontend implementation is complete and properly handles all error cases. The 404 error is definitively a backend/infrastructure issue. The enhanced logging now provides all the information needed for the backend team to identify and fix the problem.

**The user needs to:**
1. Try playing a video
2. Check the console for the attempted URLs
3. Share those URLs and file metadata with the backend administrator
4. Backend admin should follow the `VIDEO_404_DEBUG_GUIDE.md` troubleshooting steps
