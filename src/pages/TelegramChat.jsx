import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaPaperclip, FaMicrophone, FaStop, FaArrowLeft, FaEllipsisV, FaTrash, FaTimes } from 'react-icons/fa';
import { api } from '../api/api';
import toast from 'react-hot-toast';

const TelegramChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState(null);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id;
  const role = localStorage.getItem('role')?.toUpperCase() || 'STUDENT';

  // Fixed group ID = 1 (287-maktab umumiy chat)
  const GROUP_ID = 1;

  useEffect(() => {
    fetchMessages();
    
    // Auto refresh every 3 seconds
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat-messages/${GROUP_ID}`);
      const data = res?.data?.data || [];
      setMessages(data);
      setLoading(false);
    } catch (err) {
      console.error('Xabarlarni yuklashda xato:', err);
      if (loading) setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      await api.post(`/chat-messages/${GROUP_ID}`, {
        content: newMessage.trim(),
        message_type: 'text'
      });

      setNewMessage('');
      await fetchMessages();
    } catch (err) {
      console.error('Xabar yuborishda xato:', err);
      toast.error('Xabar yuborilmadi: ' + (err.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setSending(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      let messageType = 'file';
      if (file.type.startsWith('image/')) messageType = 'image';
      else if (file.type.startsWith('video/')) messageType = 'video';
      
      formData.append('message_type', messageType);
      formData.append('content', file.name);

      await api.post(`/chat-messages/${GROUP_ID}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Fayl yuborildi! ✅');
      await fetchMessages();
    } catch (err) {
      console.error('Fayl yuklashda xato:', err);
      toast.error('Fayl yuklanmadi: ' + (err.response?.data?.message || err.message));
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 🎤 Ovozli xabar yozib olish
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendVoiceMessage(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);
      
    } catch (err) {
      console.error('Mikrofon xatosi:', err);
      toast.error('Mikrofonni yoqib bo\'lmadi. Ruxsat bering.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = null; // Prevent sending
      mediaRecorderRef.current.stop();
      
      // Clear audio chunks
      audioChunksRef.current = [];
      
      setIsRecording(false);
      setRecordingTime(0);
      
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
      
      toast('Ovozli xabar bekor qilindi');
    }
  };

  const sendVoiceMessage = async (audioBlob) => {
    try {
      setSending(true);
      
      const formData = new FormData();
      formData.append('file', audioBlob, `voice_${Date.now()}.webm`);
      formData.append('message_type', 'audio');
      formData.append('content', 'Ovozli xabar');

      await api.post(`/chat-messages/${GROUP_ID}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.success('Ovozli xabar yuborildi! 🎤');
      await fetchMessages();
    } catch (err) {
      console.error('Ovozli xabar yuborishda xato:', err);
      toast.error('Ovozli xabar yuborilmadi');
    } finally {
      setSending(false);
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 🗑️ Xabarni o'chirish
  const handleDeleteMessage = async (messageId) => {
    if (!confirm('Xabarni o\'chirmoqchimisiz?')) return;
    
    try {
      await api.delete(`/chat-messages/${messageId}`);
      toast.success('Xabar o\'chirildi');
      await fetchMessages();
    } catch (err) {
      console.error('Xabar o\'chirishda xato:', err);
      toast.error('Xabar o\'chirilmadi: ' + (err.response?.data?.message || err.message));
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleColor = (userRole) => {
    const roleUpper = String(userRole || '').toUpperCase();
    switch(roleUpper) {
      case 'SUPER ADMIN':
      case 'ADMIN':
        return '#FF6B6B';
      case 'TEACHER':
        return '#4ECDC4';
      case 'STUDENT':
        return '#95E1D3';
      default:
        return '#8FA3B8';
    }
  };

  const getRoleName = (userRole) => {
    const roleUpper = String(userRole || '').toUpperCase();
    switch(roleUpper) {
      case 'SUPER ADMIN':
      case 'ADMIN':
        return 'Admin';
      case 'TEACHER':
        return 'O\'qituvchi';
      case 'STUDENT':
        return 'O\'quvchi';
      default:
        return '';
    }
  };

  const renderMessageContent = (msg) => {
    const messageType = msg.message_type || 'text';
    
    // Image
    if (messageType === 'image' && msg.file_url) {
      return (
        <div>
          <img 
            src={msg.file_url} 
            alt="Image" 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '300px', 
              borderRadius: '12px',
              cursor: 'pointer'
            }}
            onClick={() => window.open(msg.file_url, '_blank')}
          />
          {msg.content && (
            <div style={{ marginTop: '8px', fontSize: '15px' }}>
              {msg.content}
            </div>
          )}
        </div>
      );
    }
    
    // Video
    if (messageType === 'video' && msg.file_url) {
      return (
        <div>
          <video 
            controls 
            style={{ 
              maxWidth: '100%', 
              maxHeight: '300px', 
              borderRadius: '12px'
            }}
          >
            <source src={msg.file_url} />
          </video>
          {msg.content && (
            <div style={{ marginTop: '8px', fontSize: '15px' }}>
              {msg.content}
            </div>
          )}
        </div>
      );
    }
    
    // Audio (Voice message)
    if (messageType === 'audio' && msg.file_url) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            🎤
          </div>
          <audio 
            controls 
            style={{ 
              height: '32px',
              flex: 1
            }}
          >
            <source src={msg.file_url} type="audio/webm" />
            <source src={msg.file_url} type="audio/mpeg" />
          </audio>
        </div>
      );
    }
    
    // File
    if (messageType === 'file' && msg.file_url) {
      return (
        <div>
          <a 
            href={msg.file_url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'inherit',
              textDecoration: 'none',
              padding: '8px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px'
            }}
          >
            <div style={{ fontSize: '24px' }}>📎</div>
            <div>
              <div style={{ fontWeight: '500' }}>{msg.file_name || 'Fayl'}</div>
              {msg.file_size && (
                <div style={{ fontSize: '12px', opacity: 0.7 }}>
                  {(msg.file_size / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
            </div>
          </a>
        </div>
      );
    }
    
    // Text
    return (
      <div style={{ fontSize: '15px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
        {msg.content || '(Matn yo\'q)'}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0E1621',
        color: '#FFFFFF'
      }}>
        Yuklanmoqda...
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      background: '#0E1621',
      color: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      overflow: 'hidden'
    }}>
      
      {/* ═══ HEADER ═══ */}
      <div style={{
        background: '#17212B',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'transparent',
              border: 'none',
              color: '#8FA3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <FaArrowLeft size={18} />
          </button>
          
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px',
            fontWeight: '600'
          }}>
            287
          </div>
          
          <div>
            <div style={{ fontSize: '16px', fontWeight: '500' }}>
              287-Maktab Umumiy Chat
            </div>
            <div style={{ fontSize: '13px', color: '#8FA3B8' }}>
              Barcha o'quvchi va o'qituvchilar
            </div>
          </div>
        </div>
        
        <button style={{
          background: 'transparent',
          border: 'none',
          color: '#8FA3B8',
          cursor: 'pointer',
          fontSize: '18px'
        }}>
          <FaEllipsisV />
        </button>
      </div>

      {/* ═══ MESSAGES AREA ═══ */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            color: '#8FA3B8',
            padding: '40px',
            fontSize: '15px'
          }}>
            Hali xabar yo'q. Birinchi bo'lib yozing! 💬
          </div>
        ) : (
          messages.map((msg) => {
            const isMyMessage = msg.sender_id === currentUserId;
            const senderRole = getRoleName(msg.sender_role);
            
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isMyMessage ? 'row-reverse' : 'row',
                  gap: '8px',
                  alignItems: 'flex-start',
                  position: 'relative'
                }}
              >
                {/* Avatar */}
                {!isMyMessage && (
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${getRoleColor(msg.sender_role)} 0%, ${getRoleColor(msg.sender_role)}99 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: '600',
                    flexShrink: 0
                  }}>
                    {getInitials(msg.sender_name)}
                  </div>
                )}
                
                {/* Message Bubble */}
                <div style={{
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  {!isMyMessage && (
                    <div style={{
                      fontSize: '13px',
                      color: getRoleColor(msg.sender_role),
                      fontWeight: '500',
                      paddingLeft: '12px',
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center'
                    }}>
                      <span>{msg.sender_name}</span>
                      {senderRole && (
                        <span style={{
                          fontSize: '11px',
                          background: 'rgba(255,255,255,0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}>
                          {senderRole}
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div style={{
                    background: isMyMessage ? '#3390EC' : '#182533',
                    padding: '10px 14px',
                    borderRadius: isMyMessage 
                      ? '18px 18px 4px 18px' 
                      : '18px 18px 18px 4px',
                    wordWrap: 'break-word',
                    position: 'relative'
                  }}>
                    {renderMessageContent(msg)}
                    
                    <div style={{
                      fontSize: '11px',
                      color: isMyMessage ? 'rgba(255,255,255,0.7)' : '#8FA3B8',
                      marginTop: '4px',
                      textAlign: 'right',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {msg.is_edited && <span style={{ fontSize: '10px' }}>(tahrirlangan)</span>}
                      <span>{formatTime(msg.created_at)}</span>
                    </div>
                    
                    {/* Delete button (only for own messages or admin) */}
                    {(isMyMessage || role === 'SUPER ADMIN' || role === 'ADMIN' || role === 'TEACHER') && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          right: isMyMessage ? 'auto' : '-8px',
                          left: isMyMessage ? '-8px' : 'auto',
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: '#ef4444',
                          border: 'none',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          opacity: 0.7,
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                      >
                        <FaTrash size={10} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* ═══ MESSAGE INPUT ═══ */}
      <div style={{
        background: '#17212B',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '12px 16px',
        flexShrink: 0
      }}>
        {isRecording ? (
          // Recording UI
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            background: '#ef4444',
            borderRadius: '22px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#fff',
              animation: 'pulse 1s infinite'
            }} />
            <div style={{ flex: 1, fontSize: '15px', fontWeight: '500' }}>
              Ovoz yozilmoqda... {formatRecordingTime(recordingTime)}
            </div>
            <button
              onClick={cancelRecording}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaTimes />
            </button>
            <button
              onClick={stopRecording}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#fff',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <FaStop />
            </button>
          </div>
        ) : (
          // Normal input UI
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '8px'
          }}>
            {/* File Upload */}
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: '#8FA3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: sending ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                flexShrink: 0
              }}
            >
              <FaPaperclip />
            </button>
            
            {/* Text Input */}
            <div style={{
              flex: 1,
              background: '#0E1621',
              borderRadius: '22px',
              padding: '10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Xabar yozing..."
                disabled={sending}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '15px',
                  outline: 'none',
                  resize: 'none',
                  minHeight: '20px',
                  maxHeight: '100px',
                  fontFamily: 'inherit'
                }}
                rows={1}
              />
            </div>
            
            {/* Send or Voice Button */}
            {newMessage.trim() ? (
              <button
                onClick={handleSendMessage}
                disabled={sending}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: sending ? '#2C3E50' : '#3390EC',
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  flexShrink: 0,
                  transition: 'all 0.2s'
                }}
              >
                <FaPaperPlane />
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={sending}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#3390EC',
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  flexShrink: 0,
                  transition: 'all 0.2s'
                }}
              >
                <FaMicrophone />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pulse animation CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default TelegramChat;
