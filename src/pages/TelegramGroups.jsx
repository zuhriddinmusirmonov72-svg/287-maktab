import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaPlus, FaCircle } from 'react-icons/fa';
import axios from 'axios';

const TelegramGroups = () => {
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // all, personal, groups, channels
  const navigate = useNavigate();
  const role = localStorage.getItem('role')?.toUpperCase() || 'STUDENT';

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      // Mock data for now (backend needs PostgreSQL)
      const mockGroups = [
        {
          id: 1,
          name: 'Frontend ReactJS',
          avatar: null,
          last_message: 'Bugungi dars soat 16:00 da',
          last_message_time: new Date().toISOString(),
          unread_count: 5,
          member_count: 124,
          online_count: 8
        },
        {
          id: 2,
          name: 'JavaScript Basics',
          avatar: null,
          last_message: 'Vazifa yuborildi',
          last_message_time: new Date(Date.now() - 3600000).toISOString(),
          unread_count: 0,
          member_count: 98,
          online_count: 3
        }
      ];
      
      setGroups(mockGroups);
      setLoading(false);
    } catch (err) {
      console.error('Fetch groups error:', err);
      setLoading(false);
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    // Less than 1 minute
    if (diff < 60000) return 'hozir';
    
    // Less than 1 hour
    if (diff < 3600000) {
      const mins = Math.floor(diff / 60000);
      return `${mins} daqiqa oldin`;
    }
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
    }
    
    // Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Kecha';
    }
    
    // This week
    if (diff < 604800000) {
      return date.toLocaleDateString('uz-UZ', { weekday: 'long' });
    }
    
    // Older
    return date.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' });
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleGroupClick = (groupId) => {
    navigate(`/telegram/${groupId}`);
  };

  return (
    <div style={{
      background: '#17212B',
      minHeight: '100vh',
      color: '#FFFFFF',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      
      {/* ═══ HEADER ═══ */}
      <div style={{
        background: '#202B36',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        {/* Top Bar */}
        <div style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          {/* Hamburger - Hidden on desktop */}
          <button style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'transparent',
            border: 'none',
            color: '#8FA3B8',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}>
            ☰
          </button>
          
          {/* Search Bar */}
          <div style={{
            flex: 1,
            position: 'relative'
          }}>
            <FaSearch style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#8FA3B8',
              fontSize: '14px'
            }} />
            <input
              type="text"
              placeholder="Qidirish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                background: '#17212B',
                border: 'none',
                borderRadius: '20px',
                color: '#FFFFFF',
                fontSize: '15px',
                outline: 'none'
              }}
            />
          </div>
          
          {/* User Avatar */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}>
            {localStorage.getItem('user') ? 
              JSON.parse(localStorage.getItem('user')).full_name?.charAt(0).toUpperCase() || 'U'
              : 'U'
            }
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          overflowX: 'auto',
          padding: '0 16px',
          gap: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          {[
            { id: 'all', label: 'Barchasi' },
            { id: 'personal', label: 'Shaxsiy' },
            { id: 'groups', label: 'Guruhlar' },
            { id: 'channels', label: 'Kanallar' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 0',
                background: 'transparent',
                border: 'none',
                color: activeTab === tab.id ? '#3390EC' : '#8FA3B8',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid #3390EC' : '2px solid transparent',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ GROUPS LIST ═══ */}
      <div style={{ padding: '0' }}>
        {loading ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#8FA3B8'
          }}>
            Yuklanmoqda...
          </div>
        ) : filteredGroups.length === 0 ? (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#8FA3B8'
          }}>
            Guruhlar topilmadi
          </div>
        ) : (
          filteredGroups.map(group => (
            <div
              key={group.id}
              onClick={() => handleGroupClick(group.id)}
              style={{
                padding: '12px 16px',
                background: '#202B36',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer',
                transition: 'background 0.15s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#1F3040'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#202B36'}
            >
              {/* Avatar */}
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: '600',
                flexShrink: 0
              }}>
                {group.avatar ? (
                  <img src={group.avatar} alt={group.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  getInitials(group.name)
                )}
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name and Time */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    color: '#FFFFFF',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {group.name}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: group.unread_count > 0 ? '#3390EC' : '#8FA3B8',
                    marginLeft: '8px',
                    flexShrink: 0
                  }}>
                    {formatTime(group.last_message_time)}
                  </div>
                </div>

                {/* Last Message and Unread */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{
                    fontSize: '14px',
                    color: '#8FA3B8',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '80%'
                  }}>
                    {group.last_message || 'Xabar yo\'q'}
                  </div>
                  
                  {group.unread_count > 0 && (
                    <div style={{
                      minWidth: '20px',
                      height: '20px',
                      borderRadius: '10px',
                      background: '#3390EC',
                      color: '#FFFFFF',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 6px'
                    }}>
                      {group.unread_count}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ═══ FAB (Create Group) - Admin/Teacher only ═══ */}
      {(['SUPER ADMIN', 'ADMIN', 'TEACHER'].includes(role)) && (
        <button
          onClick={() => navigate('/telegram/create')}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <FaPlus />
        </button>
      )}
    </div>
  );
};

export default TelegramGroups;
