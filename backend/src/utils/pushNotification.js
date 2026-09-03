import { query } from '../db-postgres.js';
import admin from 'firebase-admin';

// =============================================
// INITIALIZE FIREBASE ADMIN SDK
// =============================================
let firebaseInitialized = false;

function initializeFirebase() {
  if (firebaseInitialized) return;
  
  try {
    // Firebase sozlamalari - .env dan o'qiladi
    const serviceAccount = {
      type: process.env.FIREBASE_TYPE || "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
      token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
    };
    
    // Agar Firebase credentials bor bo'lsa, initialize qilamiz
    if (serviceAccount.project_id && serviceAccount.private_key && serviceAccount.client_email) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized');
    } else {
      console.log('⚠️ Firebase credentials not found in .env - Push notifications will be mocked');
    }
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.log('⚠️ Push notifications will be mocked');
  }
}

// =============================================
// SEND PUSH NOTIFICATION
// =============================================
/**
 * Send push notification to specific users
 * @param {Array<number>} userIds - Array of user IDs to notify
 * @param {Object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.message - Notification body
 * @param {string} notification.type - Notification type (homework, payment, etc.)
 * @param {Object} notification.data - Additional data for deep linking
 */
export async function sendPushNotification(userIds, notification) {
  try {
    const { title, message, type = 'general', data = {} } = notification;
    
    if (!userIds || userIds.length === 0) {
      console.log('⚠️ No user IDs provided for push notification');
      return;
    }
    
    // Initialize Firebase if not already done
    initializeFirebase();
    
    // 1. Save notification to database
    for (const userId of userIds) {
      await query(
        `INSERT INTO notifications (user_id, title, message, notification_type, notification_data, is_read)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, title, message, type, JSON.stringify(data), false]
      );
    }
    
    console.log(`✅ Database notifications created for ${userIds.length} users`);
    
    // 2. Get device tokens for these users
    const tokensResult = await query(
      `SELECT dt.token, dt.device_type, u.id as user_id, u.full_name
       FROM device_tokens dt
       JOIN users u ON dt.user_id = u.id
       WHERE dt.user_id = ANY($1) AND dt.is_active = true`,
      [userIds]
    );
    
    const deviceTokens = tokensResult.rows;
    
    if (deviceTokens.length === 0) {
      console.log('⚠️ No active device tokens found for users:', userIds);
      return {
        success: true,
        databaseNotificationsSaved: true,
        pushNotificationsSent: 0,
        message: 'Notifications saved to database, but no active devices found'
      };
    }
    
    console.log(`📱 Found ${deviceTokens.length} active device(s)`);
    
    // 3. Send push notifications via Firebase Cloud Messaging (FCM)
    const fcmResults = await sendFCMNotifications(deviceTokens, {
      title,
      message,
      type,
      data
    });
    
    return {
      success: true,
      databaseNotificationsSaved: true,
      pushNotificationsSent: fcmResults.successCount,
      errors: fcmResults.errors
    };
    
  } catch (error) {
    console.error('❌ Send push notification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// =============================================
// SEND FCM NOTIFICATIONS
// =============================================
async function sendFCMNotifications(deviceTokens, notification) {
  const { title, message, type, data } = notification;
  
  const results = {
    successCount: 0,
    errors: []
  };
  
  // Agar Firebase initialized bo'lsa, real push notification yuboramiz
  if (firebaseInitialized) {
    console.log('📤 Sending real FCM notifications...');
    
    const messaging = admin.messaging();
    
    // Har bir device uchun push notification yuborish
    for (const device of deviceTokens) {
      try {
        const fcmMessage = {
          token: device.token,
          notification: {
            title: title,
            body: message
          },
          data: {
            type: type,
            homeworkId: data.homeworkId?.toString() || '',
            deepLink: data.deepLink || '/',
            screen: data.screen || 'Home',
            click_action: 'FLUTTER_NOTIFICATION_CLICK' // Flutter uchun
          },
          android: {
            priority: 'high',
            notification: {
              sound: 'default',
              channelId: 'maktab287_notifications',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
              icon: 'ic_notification', // Android app icon
              color: '#FF6B35' // Notification color
            }
          },
          apns: {
            payload: {
              aps: {
                sound: 'default',
                badge: 1,
                contentAvailable: true,
                category: type
              }
            }
          }
        };
        
        const response = await messaging.send(fcmMessage);
        console.log(`✅ FCM sent to ${device.full_name}:`, response);
        results.successCount++;
        
      } catch (error) {
        console.error(`❌ FCM error for ${device.full_name}:`, error.message);
        results.errors.push({
          user: device.full_name,
          token: device.token.substring(0, 20) + '...',
          error: error.message
        });
        
        // Agar token invalid bo'lsa, uni deactivate qilamiz
        if (error.code === 'messaging/invalid-registration-token' || 
            error.code === 'messaging/registration-token-not-registered') {
          try {
            await query(
              'UPDATE device_tokens SET is_active = false WHERE token = $1',
              [device.token]
            );
            console.log(`🗑️ Deactivated invalid token for ${device.full_name}`);
          } catch (dbError) {
            console.error('Error deactivating token:', dbError);
          }
        }
      }
    }
    
  } else {
    // Firebase initialized bo'lmasa, mock notification
    console.log('📤 MOCK: Firebase not configured, simulating notifications...');
    console.log('Title:', title);
    console.log('Message:', message);
    console.log('Type:', type);
    console.log('Data:', data);
    console.log('Devices:', deviceTokens.length);
    
    results.successCount = deviceTokens.length;
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📱 FIREBASE SOZLASH UCHUN QADAMLAR:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('1. Firebase Console-ga kiring: https://console.firebase.google.com');
    console.log('2. Yangi loyiha yarating yoki mavjud loyihangizni oching');
    console.log('3. Project Settings > Service Accounts');
    console.log('4. "Generate new private key" tugmasini bosing');
    console.log('5. JSON file yuklab oling');
    console.log('6. JSON file ichidagi qiymatlarni backend/.env ga qo\'shing:');
    console.log('');
    console.log('   FIREBASE_PROJECT_ID=your-project-id');
    console.log('   FIREBASE_PRIVATE_KEY_ID=your-private-key-id');
    console.log('   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n..."');
    console.log('   FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com');
    console.log('   FIREBASE_CLIENT_ID=your-client-id');
    console.log('   FIREBASE_CLIENT_CERT_URL=your-cert-url');
    console.log('');
    console.log('7. Backend serverni qayta ishga tushiring');
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  }
  
  return results;
}

// =============================================
// NOTIFY ADMINS AND TEACHERS
// =============================================
/**
 * Send notification to all SUPER ADMINs and TEACHERs
 */
export async function notifyAdminsAndTeachers(notification) {
  try {
    // Get all SUPER ADMIN and TEACHER user IDs
    const result = await query(
      `SELECT id FROM users WHERE role IN ('SUPER ADMIN', 'TEACHER')`
    );
    
    const userIds = result.rows.map(row => row.id);
    
    if (userIds.length === 0) {
      console.log('⚠️ No admins or teachers found');
      return;
    }
    
    console.log(`📢 Notifying ${userIds.length} admin(s) and teacher(s)`);
    
    return await sendPushNotification(userIds, notification);
  } catch (error) {
    console.error('❌ Notify admins and teachers error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// =============================================
// NOTIFY HOMEWORK SUBMISSION
// =============================================
/**
 * Send notification when student submits homework
 */
export async function notifyHomeworkSubmission(studentName, homeworkTitle, homeworkId) {
  return await notifyAdminsAndTeachers({
    title: '📝 Yangi uyga vazifa topshirildi',
    message: `${studentName} "${homeworkTitle}" uyga vazifasini topshirdi`,
    type: 'homework_submission',
    data: {
      homeworkId: homeworkId,
      deepLink: `/homework/${homeworkId}/review`, // Deep link for mobile app
      screen: 'HomeworkReview', // Mobile app screen name
      params: JSON.stringify({ homeworkId }) // Additional params
    }
  });
}

export default {
  sendPushNotification,
  notifyAdminsAndTeachers,
  notifyHomeworkSubmission
};
