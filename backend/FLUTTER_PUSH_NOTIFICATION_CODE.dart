// ============================================
// 📱 FLUTTER - PUSH NOTIFICATION TO'LIQ CODE
// ============================================

// 1️⃣ PUBSPEC.YAML GA QO'SHISH:
/*
dependencies:
  firebase_core: ^2.24.0
  firebase_messaging: ^14.7.0
  flutter_local_notifications: ^16.3.0
  http: ^1.1.0
*/

// ============================================
// 2️⃣ lib/services/notification_service.dart
// ============================================

import 'dart:convert';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;

// Background message handler (top level function)
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('📬 Background message: ${message.notification?.title}');
}

class NotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  
  static String? _fcmToken;
  static String? _jwtToken; // Login'dan keyin saqlash kerak

  // Backend URL
  static const String BACKEND_URL = 'http://localhost:3002/api/v1';
  // Production: 'https://two87-maktab-backend.onrender.com/api/v1'

  // ============================================
  // INITIALIZE
  // ============================================
  static Future<void> initialize() async {
    // Firebase initialize
    await Firebase.initializeApp();
    
    // Background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Request permission (iOS)
    NotificationSettings settings = await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ Push notifications authorized');
    } else {
      print('⚠️ Push notifications denied');
      return;
    }

    // Get FCM token
    _fcmToken = await _messaging.getToken();
    print('📱 FCM Token: $_fcmToken');

    // Token yangilanganda
    _messaging.onTokenRefresh.listen((newToken) {
      _fcmToken = newToken;
      print('🔄 FCM Token refreshed: $newToken');
      if (_jwtToken != null) {
        _sendTokenToBackend(newToken, _jwtToken!);
      }
    });

    // Local notifications setup (Android)
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings iosSettings =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Create notification channel (Android)
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'maktab287_notifications',
      'Maktab Notifications',
      description: 'Uyga vazifa va yangiliklar',
      importance: Importance.high,
    );

    await _localNotifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);

    // Foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Background/terminated app - notification tapped
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
    
    // App terminated holatda notification bosilsa
    RemoteMessage? initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleNotificationTap(initialMessage);
    }
  }

  // ============================================
  // LOGIN'DAN KEYIN CHAQIRING
  // ============================================
  static Future<void> registerDeviceToken(String jwtToken) async {
    _jwtToken = jwtToken;
    
    if (_fcmToken != null) {
      await _sendTokenToBackend(_fcmToken!, jwtToken);
    } else {
      print('⚠️ FCM token not ready yet');
    }
  }

  // Backend'ga token yuborish
  static Future<void> _sendTokenToBackend(String fcmToken, String jwtToken) async {
    try {
      print('📤 Sending FCM token to backend...');
      
      final response = await http.post(
        Uri.parse('$BACKEND_URL/notifications/device-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $jwtToken',
        },
        body: jsonEncode({
          'token': fcmToken,
          'device_type': 'mobile',
        }),
      );

      if (response.statusCode == 200) {
        print('✅ Device token registered successfully');
      } else {
        print('❌ Failed to register token: ${response.body}');
      }
    } catch (e) {
      print('❌ Error sending token: $e');
    }
  }

  // ============================================
  // LOGOUT'DA CHAQIRING
  // ============================================
  static Future<void> unregisterDeviceToken() async {
    if (_fcmToken == null || _jwtToken == null) return;

    try {
      await http.delete(
        Uri.parse('$BACKEND_URL/notifications/device-token/$_fcmToken'),
        headers: {
          'Authorization': 'Bearer $_jwtToken',
        },
      );
      print('✅ Device token unregistered');
    } catch (e) {
      print('❌ Error unregistering token: $e');
    }
    
    _jwtToken = null;
  }

  // ============================================
  // FOREGROUND MESSAGE HANDLER
  // ============================================
  static Future<void> _handleForegroundMessage(RemoteMessage message) async {
    print('📬 Foreground message: ${message.notification?.title}');

    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'maktab287_notifications',
      'Maktab Notifications',
      channelDescription: 'Uyga vazifa va yangiliklar',
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      color: Color(0xFFFF6B35),
      playSound: true,
      enableVibration: true,
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      message.hashCode,
      message.notification?.title ?? 'Yangi xabar',
      message.notification?.body ?? '',
      details,
      payload: jsonEncode(message.data),
    );
  }

  // ============================================
  // NOTIFICATION TAPPED (Background/Terminated)
  // ============================================
  static void _handleNotificationTap(RemoteMessage message) {
    print('📱 Notification tapped (background): ${message.data}');
    _navigateToScreen(message.data);
  }

  // ============================================
  // NOTIFICATION TAPPED (Foreground)
  // ============================================
  static void _onNotificationTapped(NotificationResponse response) {
    print('📱 Notification tapped (foreground): ${response.payload}');
    
    if (response.payload != null) {
      try {
        final data = jsonDecode(response.payload!);
        _navigateToScreen(data);
      } catch (e) {
        print('❌ Error parsing notification payload: $e');
      }
    }
  }

  // ============================================
  // NAVIGATE TO SCREEN (DeepLink)
  // ============================================
  static void _navigateToScreen(Map<String, dynamic> data) {
    final String? type = data['type'];
    final String? screen = data['screen'];
    final String? homeworkId = data['homeworkId'];

    print('🧭 Navigating to: type=$type, screen=$screen, homeworkId=$homeworkId');

    // Navigator key kerak bo'ladi (main.dart da global key yaratish)
    // final context = navigatorKey.currentContext;
    // if (context == null) return;

    if (type == 'homework_submission' && homeworkId != null) {
      // Uyga vazifa sahifasiga o'tish
      // Navigator.pushNamed(context, '/homework/$homeworkId/review');
      print('➡️ Navigate to homework review: $homeworkId');
      
      // GetX yoki Go_Router ishlatayotgan bo'lsangiz:
      // Get.toNamed('/homework/$homeworkId/review');
      // context.go('/homework/$homeworkId/review');
    }
  }
}

// ============================================
// 3️⃣ lib/main.dart DA CHAQIRISH
// ============================================
/*
import 'package:flutter/material.dart';
import 'services/notification_service.dart';

// Global navigator key (deep linking uchun)
final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Push notifications initialize
  await NotificationService.initialize();
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navigatorKey, // Deep linking uchun
      title: '287 Maktab',
      home: LoginScreen(),
      routes: {
        '/homework/:id/review': (context) {
          final homeworkId = ModalRoute.of(context)!.settings.arguments as String;
          return HomeworkReviewScreen(homeworkId: homeworkId);
        },
      },
    );
  }
}
*/

// ============================================
// 4️⃣ LOGIN SCREEN'DA TOKEN YUBORISH
// ============================================
/*
class LoginScreen extends StatelessWidget {
  Future<void> login(String phone, String password) async {
    // 1. Login API call
    final response = await http.post(
      Uri.parse('http://localhost:3002/api/v1/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'phone': phone, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final String jwtToken = data['token'];
      
      // 2. Save token
      // await SharedPreferences.getInstance().then((prefs) {
      //   prefs.setString('jwt_token', jwtToken);
      // });
      
      // 3. Register FCM device token
      await NotificationService.registerDeviceToken(jwtToken);
      
      // 4. Navigate to home
      Navigator.pushReplacement(context, MaterialPageRoute(
        builder: (context) => HomeScreen(),
      ));
    }
  }
}
*/

// ============================================
// 5️⃣ LOGOUT'DA TOKEN O'CHIRISH
// ============================================
/*
Future<void> logout() async {
  // 1. Unregister device token
  await NotificationService.unregisterDeviceToken();
  
  // 2. Clear local data
  final prefs = await SharedPreferences.getInstance();
  await prefs.clear();
  
  // 3. Navigate to login
  Navigator.pushAndRemoveUntil(
    context,
    MaterialPageRoute(builder: (context) => LoginScreen()),
    (route) => false,
  );
}
*/

// ============================================
// ✅ TAYYOR!
// ============================================
// Endi:
// 1. Login qiling
// 2. Boshqa qurilmada student sifatida uyga vazifa yuklang
// 3. Sizning telefoningizga push notification keladi! 📱
// 4. Notification bosinganda homework review sahifasiga o'tadi
// ============================================
