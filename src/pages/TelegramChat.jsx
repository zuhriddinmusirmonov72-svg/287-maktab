import { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaPaperclip, FaSmile, FaArrowLeft, FaEllipsisV, FaPhone, FaVideo } from 'react-icons/fa';

const TelegramChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id || 1;
  const role = localStorage.getItem('role')?.toUpperCase() || 'STUDENT';

  useEffect(() => {
    // Mock messages - haqiqiy ma'lumotlar (PostgreSQL ishlaganda backend'dan keladi)
    const mockMessages = [
      {
        id: 1,
        user_id: 2,
        user_name: 'O\'qituvchi',
        user_role: 'TEACHER',
        message: 'Assalomu alaykum! Bugun soat 16:00 da dars bor',
        created_at: new Date(Date.now() - 7200000).toISOString(),
        is_read: true
      },
      {
        id: 2,
        user_id: 3,
        user_name: 'Ali',
        user_role: 'STUDENT',
        message: 'Vazifani qachongacha topshirish kerak?',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        is_read: true
      },
      {
        id: 3,
        user_id: 2,
        user_name: 'O\'qituvchi',
        user_role: 'TEACHER',
        message: 'Juma kuni soat 18:00 gacha',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        is_read: true
      },
      {
        id: 4,
        user_id: currentUserId,
        user_name: currentUser.full_name || 'Siz',
        user_role: role,
        message: 'Tushundim, rahmat!',
        created_at: new Date(Date.now() - 900000).toISOString(),
        is_read: true
      }
    ];
    
    setMessages(mockMessages);
  }, [currentUserId, role, currentUser.full_name]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const newMsg = {
      id: messages.length + 1,
      user_id: currentUserId,
      user_name: currentUser.full_name || 'Siz',
      user_role: role,
      message: newMessage,
      created_at: new Date().toISOString(),
      is_read: false
    };

    setMessages([...messages, newMsg]);
    setNewMessage('');

    // Backend integratsiya (PostgreSQL ishlaganda)
    // await api.post('/chat-messages', { message: newMessage, group_id: 1 });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // File yuklash logikasi (backend'ga yuborish)
    console.log('File yuklanyapti:', file.name);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleColor = (userRole) => {
    switch(userRole) {
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
              287-Maktab Chat
            </div>
            <div style={{ fontSize: '13px', color: '#8FA3B8' }}>
              124 a'zo, 8 onlayn
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px' }}>
          <button style={{
            background: 'transparent',
            border: 'none',
            color: '#8FA3B8',
            cursor: 'pointer',
            fontSize: '18px'
          }}>
            <FaPhone />
          </button>
          <button style={{
            background: 'transparent',
            border: 'none',
            color: '#8FA3B8',
            cursor: 'pointer',
            fontSize: '18px'
          }}>
            <FaVideo />
          </button>
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
        {messages.map((msg) => {
          const isMyMessage = msg.user_id === currentUserId;
          
          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: isMyMessage ? 'row-reverse' : 'row',
                gap: '8px',
                alignItems: 'flex-end'
              }}
            >
              {/* Avatar */}
              {!isMyMessage && (
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `linear-gradient(135deg, ${getRoleColor(msg.user_role)} 0%, ${getRoleColor(msg.user_role)}99 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '600',
                  flexShrink: 0
                }}>
                  {getInitials(msg.user_name)}
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
                    color: getRoleColor(msg.user_role),
                    fontWeight: '500',
                    paddingLeft: '12px'
                  }}>
                    {msg.user_name}
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
                  <div style={{ fontSize: '15px', lineHeight: '1.4' }}>
                    {msg.message}
                  </div>
                  <div style={{
                    fontSize: '11px',
                    color: isMyMessage ? 'rgba(255,255,255,0.7)' : '#8FA3B8',
                    marginTop: '4px',
                    textAlign: 'right'
                  }}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-end'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4ECDC4 0%, #4ECDC499 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              O
            </div>
            <div style={{
              background: '#182533',
              padding: '12px 16px',
              borderRadius: '18px 18px 18px 4px',
              display: 'flex',
              gap: '4px'
            }}>
              <div className="typing-dot" style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#8FA3B8',
                animation: 'typing 1.4s infinite'
              }}></div>
              <div className="typing-dot" style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#8FA3B8',
                animation: 'typing 1.4s infinite 0.2s'
              }}></div>
              <div className="typing-dot" style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#8FA3B8',
                animation: 'typing 1.4s infinite 0.4s'
              }}></div>
            </div>
          </div>
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
            accept="image/*,video/*,.pdf,.doc,.docx"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
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
              cursor: 'pointer',
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
            <button style={{
              background: 'transparent',
              border: 'none',
              color: '#8FA3B8',
              cursor: 'pointer',
              fontSize: '18px',
              flexShrink: 0
            }}>
              <FaSmile />
            </button>
          </div>
          
          {/* Send Button */}
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: newMessage.trim() ? '#3390EC' : '#2C3E50',
              border: 'none',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
          >
            <FaPaperPlane />
          </button>
        </div>
      </div>

      {/* Typing Animation CSS */}
      <style>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default TelegramChat;
