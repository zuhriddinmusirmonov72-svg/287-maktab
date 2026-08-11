import { useState, useEffect, useRef } from 'react';
import { reelsAPI } from '../api/api';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiHeart, FiMessageCircle, FiShare2, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function ReelsViewer({ onClose }) {
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    fetchReels();
  }, []);

  // Current video ko'rilganda mark as viewed
  useEffect(() => {
    if (reels.length > 0 && reels[currentIndex]) {
      const timer = setTimeout(() => {
        reelsAPI.markAsViewed(reels[currentIndex]._id).catch(() => {});
      }, 1000); // 1 soniya ko'rgandan keyin
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, reels]);

  const fetchReels = async () => {
    try {
      const res = await reelsAPI.getAll();
      const data = res?.data?.data || [];
      setReels(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Reels yuklashda xato:', err);
      toast.error('Videolarni yuklashda xato');
    } finally {
      setLoading(false);
    }
  };

  const extractInstagramEmbedUrl = (url) => {
    // Instagram URL'dan embed URL yaratish va autoplay qo'shish
    // https://www.instagram.com/reel/ABC123/ → https://www.instagram.com/reel/ABC123/embed?autoplay=1
    let embedUrl = url;
    
    if (!embedUrl.includes('/embed')) {
      embedUrl = embedUrl.endsWith('/') ? embedUrl + 'embed' : embedUrl + '/embed';
    }
    
    // Autoplay parametrini qo'shish (Instagram Reels uchun)
    if (!embedUrl.includes('autoplay')) {
      embedUrl += embedUrl.includes('?') ? '&autoplay=1' : '?autoplay=1';
    }
    
    return embedUrl;
  };

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') handlePrevious();
    if (e.key === 'ArrowDown') handleNext();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  if (loading) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, color: '#fff'
      }}>
        Yuklanmoqda...
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, color: '#fff', gap: '20px'
      }}>
        <p style={{ fontSize: '18px' }}>Hozircha videolar yo'q</p>
        <button
          onClick={onClose}
          style={{
            padding: '12px 24px', background: '#7c3aed', border: 'none',
            borderRadius: '8px', color: '#fff', cursor: 'pointer', fontSize: '16px'
          }}>
          Orqaga
        </button>
      </div>
    );
  }

  const currentReel = reels[currentIndex];

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: '#000',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
      
      {/* Header */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>
          Reels
        </div>
        <button
          onClick={onClose}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
          ×
        </button>
      </div>

      {/* Video Container */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {/* Instagram Embed */}
        <iframe
          key={currentReel._id}
          src={extractInstagramEmbedUrl(currentReel.instagram_url)}
          style={{
            width: '100%',
            maxWidth: '500px',
            height: '100%',
            border: 'none',
            borderRadius: 0
          }}
          loading="eager"
          allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation"
        />

        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrevious}
            style={{
              position: 'absolute',
              top: '50%',
              left: '20px',
              transform: 'translateY(-50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.3)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
            <FiChevronUp />
          </button>
        )}

        {currentIndex < reels.length - 1 && (
          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              top: '50%',
              right: '20px',
              transform: 'translateY(-50%)',
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.3)',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
            <FiChevronDown />
          </button>
        )}
      </div>

      {/* Bottom Info */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
        padding: '20px',
        color: '#fff'
      }}>
        <div style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 600 }}>
          {currentReel.title}
        </div>
        {currentReel.description && (
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {currentReel.description}
          </div>
        )}
        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
          {currentIndex + 1} / {reels.length}
        </div>
      </div>

      {/* Mobile Swipe Instructions */}
      <div style={{
        position: 'absolute',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '12px',
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        ↑ ↓ tugmalari bilan o'ting
      </div>
    </div>
  );
}
