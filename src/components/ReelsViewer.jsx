import { useState, useEffect, useRef } from 'react';
import { reelsAPI } from '../api/api';
import { 
  FiX, 
  FiHeart, 
  FiEye, 
  FiPlay, 
  FiPause, 
  FiVolume2, 
  FiVolumeX,
  FiChevronUp,
  FiChevronDown,
  FiUpload
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import './ReelsViewer.css';

export default function ReelsViewer({ onClose, onUploadClick }) {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // Avtomatik o'ynashi uchun muted bo'lishi kerak
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const videoRefs = useRef([]);
  const containerRef = useRef(null);
  const touchStartY = useRef(0);

  useEffect(() => {
    fetchReels();
  }, []);

  // Birinchi video yuklanganda avtomatik play
  useEffect(() => {
    if (reels.length > 0) {
      const timer = setTimeout(() => {
        playCurrentVideo();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [reels]);

  useEffect(() => {
    // Auto-play current video
    playCurrentVideo();
    
    // Scroll to current video
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: currentIndex * window.innerHeight,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  const fetchReels = async (pageNum = 1) => {
    try {
      setLoading(true);
      const res = await reelsAPI.getAll(pageNum, 10);
      const data = res?.data?.data || [];
      
      if (pageNum === 1) {
        setReels(data);
      } else {
        setReels(prev => [...prev, ...data]);
      }
      
      setHasMore(res?.data?.pagination?.hasNext || false);
      setPage(pageNum);
    } catch (err) {
      console.error('Reels yuklashda xato:', err);
      toast.error('Videolarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const playCurrentVideo = () => {
    // Pause all videos
    videoRefs.current.forEach((video, idx) => {
      if (video && idx !== currentIndex) {
        video.pause();
      }
    });

    // Play current video
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.muted = isMuted; // Ensure muted state
      if (isPlaying) {
        // Force play with promise handling
        const playPromise = currentVideo.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Video playing successfully');
            })
            .catch(err => {
              console.log('Autoplay prevented, trying muted:', err);
              // If autoplay fails, try with muted
              currentVideo.muted = true;
              setIsMuted(true);
              currentVideo.play().catch(e => console.error('Play failed:', e));
            });
        }
      }
    }
  };

  const handleLike = async (reelId, index) => {
    try {
      const res = await reelsAPI.like(reelId);
      
      setReels(prevReels => 
        prevReels.map((reel, idx) => 
          idx === index 
            ? { 
                ...reel, 
                is_liked: res.data.liked,
                likes: res.data.likes
              }
            : reel
        )
      );
    } catch (err) {
      console.error('Like xato:', err);
      toast.error('Like qo\'yishda xatolik');
    }
  };

  const handleView = async (reelId) => {
    try {
      await reelsAPI.view(reelId);
    } catch (err) {
      console.error('View xato:', err);
    }
  };

  const handlePlayPause = () => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      if (isPlaying) {
        currentVideo.pause();
      } else {
        currentVideo.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMute = () => {
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < reels.length - 1) {
      setCurrentIndex(currentIndex + 1);
      
      // Load more if near end
      if (currentIndex >= reels.length - 3 && hasMore && !loading) {
        fetchReels(page + 1);
      }
    }
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY;

    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentIndex < reels.length - 1) {
        handleNext();
      } else if (diff < 0 && currentIndex > 0) {
        handlePrevious();
      }
    }
  };

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    const newIndex = Math.round(scrollTop / window.innerHeight);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleVideoClick = (e) => {
    // Don't toggle play/pause if clicking on buttons
    if (e.target.closest('.reels-actions') || e.target.closest('.reels-info')) {
      return;
    }
    handlePlayPause();
  };

  useEffect(() => {
    // Register view when video becomes visible
    const currentReel = reels[currentIndex];
    if (currentReel) {
      handleView(currentReel._id);
    }
  }, [currentIndex, reels]);

  if (loading && reels.length === 0) {
    return (
      <div className="reels-viewer">
        <button className="reels-close" onClick={onClose}>
          <FiX size={28} />
        </button>

        {/* Upload button - loading state uchun ham */}
        {onUploadClick && (
          <button 
            className="reels-upload-btn" 
            onClick={onUploadClick}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: '3px solid white',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10001,
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.6)',
              fontSize: '32px',
              fontWeight: '300',
              lineHeight: '1'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(124, 58, 237, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(124, 58, 237, 0.6)';
            }}
          >
            +
          </button>
        )}

        <div className="reels-loading">
          <div className="spinner"></div>
          <p>Videolar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="reels-viewer">
        <button className="reels-close" onClick={onClose}>
          <FiX size={28} />
        </button>

        {/* Upload button - empty state uchun ham */}
        {onUploadClick && (
          <button 
            className="reels-upload-btn" 
            onClick={onUploadClick}
            style={{
              position: 'fixed',
              top: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              border: '3px solid white',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10001,
              transition: 'all 0.2s',
              boxShadow: '0 4px 20px rgba(124, 58, 237, 0.6)',
              fontSize: '32px',
              fontWeight: '300',
              lineHeight: '1'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(124, 58, 237, 0.8)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(124, 58, 237, 0.6)';
            }}
          >
            +
          </button>
        )}

        <div className="reels-empty">
          <FiEye size={64} />
          <h3>Hozircha videolar yo'q</h3>
          <p>Birinchi bo'lib video yuklang!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reels-viewer">
      <button className="reels-close" onClick={onClose}>
        <FiX size={28} />
      </button>

      {/* Upload button - tepada markazda + belgisi */}
      {onUploadClick && (
        <button 
          className="reels-upload-btn" 
          onClick={onUploadClick}
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: '3px solid white',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10001,
            transition: 'all 0.2s',
            boxShadow: '0 4px 20px rgba(124, 58, 237, 0.6)',
            fontSize: '32px',
            fontWeight: '300',
            lineHeight: '1'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 24px rgba(124, 58, 237, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateX(-50%) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(124, 58, 237, 0.6)';
          }}
        >
          +
        </button>
      )}

      <div 
        className="reels-container"
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onScroll={handleScroll}
      >
        {reels.map((reel, index) => (
          <div 
            key={reel._id} 
            className={`reel-item ${index === currentIndex ? 'active' : ''}`}
            onClick={handleVideoClick}
          >
            <video
              ref={el => videoRefs.current[index] = el}
              src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3002'}${reel.video_url}`}
              loop
              playsInline
              autoPlay={index === currentIndex}
              muted={isMuted}
              className="reel-video"
              preload="metadata"
              onLoadedData={(e) => {
                // Video yuklanganda avtomatik play
                if (index === currentIndex && isPlaying) {
                  e.target.play().catch(err => {
                    console.log('Autoplay failed, trying muted:', err);
                    e.target.muted = true;
                    setIsMuted(true);
                    e.target.play().catch(e => console.error('Play failed:', e));
                  });
                }
              }}
              onEnded={() => {
                if (index < reels.length - 1) {
                  handleNext();
                }
              }}
            />

            {/* Info overlay */}
            <div className="reels-info">
              <div className="uploader-info">
                <div className="uploader-avatar">
                  {(reel.uploader_name || 'U').charAt(0).toUpperCase()}
                </div>
                <span className="uploader-name">{reel.uploader_name}</span>
              </div>
              
              {reel.title && reel.title !== 'Video' && (
                <p className="reel-title">{reel.title}</p>
              )}
            </div>

            {/* Actions sidebar */}
            <div className="reels-actions">
              <button 
                className={`action-btn like-btn ${reel.is_liked ? 'liked' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(reel._id, index);
                }}
              >
                <FiHeart size={28} fill={reel.is_liked ? 'currentColor' : 'none'} />
                <span>{reel.likes || 0}</span>
              </button>

              <div className="action-btn view-count">
                <FiEye size={28} />
                <span>{reel.views || 0}</span>
              </div>

              <button 
                className="action-btn mute-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleMute();
                }}
              >
                {isMuted ? <FiVolumeX size={28} /> : <FiVolume2 size={28} />}
              </button>
            </div>

            {/* Navigation arrows */}
            {currentIndex > 0 && (
              <button 
                className="nav-arrow nav-up"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
              >
                <FiChevronUp size={32} />
              </button>
            )}
            
            {currentIndex < reels.length - 1 && (
              <button 
                className="nav-arrow nav-down"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
              >
                <FiChevronDown size={32} />
              </button>
            )}

            {/* Play/Pause indicator */}
            {!isPlaying && (
              <div className="play-overlay">
                <FiPlay size={64} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="reels-progress">
        {reels.map((_, idx) => (
          <div 
            key={idx}
            className={`progress-dot ${idx === currentIndex ? 'active' : ''} ${idx < currentIndex ? 'watched' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
