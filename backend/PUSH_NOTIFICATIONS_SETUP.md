# 📱 Push Notifications - To'liq Qo'llanma

## 1️⃣ Firebase Console Sozlash

### Firebase Loyiha Yaratish
1. **Firebase Console**-ga kiring: https://console.firebase.google.com
2. **"Add project"** tugmasini bosing
3. Loyiha nomini kiriting: `maktab287` (yoki o'z nomingiz)
4. Google Analytics'ni yoqing (ixtiyoriy)
5. **"Create project"** tugmasini bosing

### Service Account Key Olish
1. Firebase Console'da loyihangizni oching
2. **⚙️ Project Settings** (chap yuqori burchakdagi tishli belgi)
3. **"Service Accounts"** tab'ini tanlang
4. **"Generate new private key"** tugmasini bosing
5. JSON fayl yuklab olinadi (masalan: `maktab287-firebase-adminsdk-xxxxx.json`)

### Backend .env Faylga Qo'shish
JSON faylni oching va quyidagi qiymatlarni `backend/.env` fayliga ko'chiring:

```env
FIREBASE_PROJECT_ID=maktab287-xxxxx
FIREBASE_PRIVATE_KEY_ID=abc123def456...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@maktab287-xxxxx.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40maktab287-xxxxx.iam.gserviceaccount.com
```

⚠️ **DIQQAT**: 
- `FIREBASE_PRIVATE_KEY` qo'shtirnoq (" ") ichida bo'lishi kerak
- Private key ichidagi `\n` (yangi qator belgilari)ni o'zgartirmang
- `.env` faylni git'ga commit qilmang!

---

## 2️⃣ Mobile App Sozlash (Flutter yoki React Native)

### Flutter (Android/iOS)

#### A) Firebase Flutter Package O'rnatish
```yaml
# pubspec.yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
  flutter_local_notifications: ^16.3.0
```

```bash
flutter pub get
```

#### B) Android Sozlash
1. Firebase Console > Project Settings > General
2. **"Add app"** > Android
3. Android package name kiriting (masalan: `com.maktab287.app`)
4. `google-services.json` faylini yuklab oling
5. Faylni `android/app/` papkasiga joylashtiring

`android/app/build.gradle` fayliga qo'shing:
```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
}
```

`android/build.gradle`:
```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

`android/app/src/main/AndroidManifest.xml`:
```xml
<manifest>
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    
    <application>
        <!-- FCM Notification Channel -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="maktab287_notifications" />
    </application>
</manifest>
```

#### C) iOS Sozlash
1. Firebase Console > Project Settings > General
2. **"Add app"** > iOS
3. iOS bundle ID kiriting
4. `GoogleService-Info.plist` faylini yuklab oling
5. Xcode'da faylni `Runner` papkasiga qo'shing

#### D) Flutter Code - Push Notification Qabul Qilish

**lib/services/notification_service.dart**
```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  // Initialize
  static Future<void> initialize() async {
    // Firebase initialize
    await Firebase.initializeApp();

    // Request permission (iOS)
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ Push notifications authorized');
    }

    // Get FCM token
    String? token = await _messaging.getToken();
    print('📱 FCM Token: $token');
    
    // Token'ni backend'ga yuborish
    if (token != null) {
      await _sendTokenToBackend(token);
    }

    // Token yangilanganda
    _messaging.onTokenRefresh.listen((newToken) {
      _sendTokenToBackend(newToken);
    });

    // Local notifications setup
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const InitializationSettings settings = InitializationSettings(
      android: androidSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Background messages
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }

  // Backend'ga token yuborish
  static Future<void> _sendTokenToBackend(String token) async {
    try {
      final response = await http.post(
        Uri.parse('YOUR_BACKEND_URL/api/v1/notifications/device-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer YOUR_JWT_TOKEN', // Login'dan keyin olingan token
        },
        body: jsonEncode({
          'token': token,
          'device_type': 'mobile',
        }),
      );
      
      if (response.statusCode == 200) {
        print('✅ Device token registered');
      }
    } catch (e) {
      print('❌ Error sending token: $e');
    }
  }

  // Foreground message
  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    print('📬 Foreground message: ${message.notification?.title}');
    
    // Show local notification
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'maktab287_notifications',
      'Maktab Notifications',
      channelDescription: 'Uyga vazifa va yangiliklar',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
    );

    await _localNotifications.show(
      message.hashCode,
      message.notification?.title,
      message.notification?.body,
      details,
      payload: jsonEncode(message.data),
    );
  }

  // Notification tap (background)
  static void _handleNotificationTap(RemoteMessage message) {
    print('📱 Notification tapped: ${message.data}');
    _navigateToScreen(message.data);
  }

  // Notification tap (foreground)
  static void _onNotificationTapped(NotificationResponse response) {
    if (response.payload != null) {
      final data = jsonDecode(response.payload!);
      _navigateToScreen(data);
    }
  }

  // Navigate to specific screen
  static void _navigateToScreen(Map<String, dynamic> data) {
    final String? screen = data['screen'];
    final String? homeworkId = data['homeworkId'];

    if (screen == 'HomeworkReview' && homeworkId != null) {
      // Navigate to homework review screen
      // Example: Get.toNamed('/homework/$homeworkId/review');
      print('Navigate to homework review: $homeworkId');
    }
  }
}
```

**lib/main.dart**
```dart
import 'package:flutter/material.dart';
import 'services/notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize push notifications
  await NotificationService.initialize();
  
  runApp(MyApp());
}
```

---

## 3️⃣ Test Qilish

### A) Backend Test
Backend'ni ishga tushiring:
```bash
cd backend
npm start
```

O'quvchi sifatida uyga vazifa yuklang. Backend console'da ko'rasiz:
```
✅ Database notifications created for 2 users
📱 Found 0 active device(s)
⚠️ No active device tokens found for users: [1, 2]
```

### B) Mobile App Test
1. Mobil ilovani ishga tushiring
2. Login qiling (SUPER ADMIN yoki TEACHER)
3. Console'da FCM token chiqishi kerak:
   ```
   📱 FCM Token: eXXXXXXXXXXXXXXXXXXXXXX...
   ✅ Device token registered
   ```

4. Yana bir qurilmada (yoki browserda) STUDENT sifatida uyga vazifa yuklang

5. SUPER ADMIN telefoniga push notification kelishi kerak! 📲

### C) Notification Bosilganda
Notification bosilganda ilovada tegishli sahifaga o'tish kerak:
```dart
// Homework review screen
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => HomeworkReviewScreen(homeworkId: homeworkId),
  ),
);
```

---

## 4️⃣ Backend API Endpoints

### POST /api/v1/notifications/device-token
**Device token'ni saqlash (login'dan keyin)**
```json
{
  "token": "eXXXXXXXXXXXXXXXXXXX...",
  "device_type": "mobile"
}
```

### GET /api/v1/notifications/my
**Barcha bildirishnomalarni olish**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "title": "📝 Yangi uyga vazifa topshirildi",
        "message": "Test Student \"JavaScript Basics\" uyga vazifasini topshirdi",
        "notification_type": "homework_submission",
        "notification_data": {
          "homeworkId": 5,
          "deepLink": "/homework/5/review",
          "screen": "HomeworkReview"
        },
        "is_read": false,
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "unreadCount": 1
  }
}
```

### PATCH /api/v1/notifications/:id/read
**Bildirishnomani o'qilgan deb belgilash**

### DELETE /api/v1/notifications/device-token/:token
**Device token'ni o'chirish (logout'da)**

---

## 5️⃣ Production (Render.com) Sozlash

Render.com dashboard'da:
1. Backend service'ni oching
2. **Environment** > **Add Environment Variable**
3. Firebase sozlamalarini qo'shing:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`
   - `FIREBASE_CLIENT_ID`
   - `FIREBASE_CLIENT_CERT_URL`

4. **Manual Deploy** yoki Git push qiling

---

## 🎉 Tayyor!

Endi sizning mobil ilovangiz push notification qabul qiladi:
- ✅ O'quvchi uyga vazifa yuklasa, admin'ga notification keladi
- ✅ Internet o'chiq bo'lsa ham notification keladi (FCM server through)
- ✅ Ilovadan chiqib ketsangiz ham notification keladi
- ✅ Notification bosilsa, to'g'ri sahifaga yo'naltiradi

**Savol bo'lsa yozing!** 🚀
