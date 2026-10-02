import { useState, useEffect } from 'react';
import { FiX, FiMail, FiLock, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_BASE_URL = import.meta.env.DEV ? '/api/v1' : 'https://maktab287-backend.onrender.com/api/v1';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [testCode, setTestCode] = useState('');

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setEmail('');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setTestCode('');
      setCountdown(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Step 1: Email kiriting
  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Email manzil kiriting');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Noto\'g\'ri email format');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password/send-otp`, {
        email: email.trim()
      });

      if (response.data.success) {
        toast.success('Tasdiqlash kodi email manzilingizga yuborildi');
        
        // Test mode - faqat development da ko'rsatish
        if (response.data.testCode && import.meta.env.DEV) {
          setTestCode(response.data.testCode);
          toast.success(`TEST CODE: ${response.data.testCode}`, { duration: 10000 });
        }
        
        setStep(2);
        setCountdown(60);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: OTP tekshirish
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('6 raqamli kodni kiriting');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password/verify-otp`, {
        email: email.trim(),
        otp: otp.trim()
      });

      if (response.data.success) {
        toast.success('Tasdiqlash kodi to\'g\'ri');
        setStep(3);
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      toast.error(error.response?.data?.message || 'Noto\'g\'ri tasdiqlash kodi');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Yangi parol qo'yish
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      toast.error('Parol kamida 6 ta belgidan iborat bo\'lishi kerak');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Parollar mos kelmadi');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/forgot-password/reset`, {
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword
      });

      if (response.data.success) {
        toast.success('Parol muvaffaqiyatli o\'zgartirildi!');
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    
    setOtp('');
    await handleSendOtp({ preventDefault: () => {} });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '480px',
          maxWidth: '100%',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          padding: '32px',
          position: 'relative',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '16px',
            top: '16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '24px',
            color: '#666',
          }}
        >
          <FiX />
        </button>

        {/* Header */}
        <h2 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700', color: '#1a202c' }}>
          Parolni tiklash
        </h2>
        <p style={{ margin: '0 0 24px', color: '#666', fontSize: '14px' }}>
          {step === 1 && 'Email manzilingizni kiriting'}
          {step === 2 && 'Email manzilingizga yuborilgan kodni kiriting'}
          {step === 3 && 'Yangi parol o\'rnating'}
        </p>

        {/* Progress steps */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                background: s <= step ? '#7c3aed' : '#e5e7eb',
                borderRadius: '4px',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Email manzil
              </label>
              <div style={{ position: 'relative' }}>
                <FiMail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '14px',
                background: isLoading ? '#ccc' : '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Yuborilmoqda...' : 'Tasdiqlash kodi yuborish'}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Tasdiqlash kodi (6 raqam)
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                style={{
                  width: '100%',
                  padding: '14px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '20px',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  fontWeight: '600',
                }}
                disabled={isLoading}
                maxLength={6}
              />
            </div>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={countdown > 0}
              style={{
                width: '100%',
                padding: '12px',
                background: countdown > 0 ? '#f3f4f6' : '#f8fafc',
                color: countdown > 0 ? '#999' : '#7c3aed',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
              }}
            >
              {countdown > 0 ? `Qayta yuborish (${countdown}s)` : 'Kodni qayta yuborish'}
            </button>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              style={{
                width: '100%',
                padding: '14px',
                background: isLoading || otp.length !== 6 ? '#ccc' : '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading || otp.length !== 6 ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Tekshirilmoqda...' : 'Tasdiqlash'}
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Yangi parol
              </label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Kamida 6 ta belgi"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '14px' }}>
                Parolni takrorlang
              </label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Parolni qayta kiriting"
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 40px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                  }}
                  disabled={isLoading}
                />
                {confirmPassword && newPassword === confirmPassword && (
                  <FiCheck style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }} />
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !newPassword || newPassword !== confirmPassword}
              style={{
                width: '100%',
                padding: '14px',
                background: isLoading || !newPassword || newPassword !== confirmPassword ? '#ccc' : '#10b981',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isLoading || !newPassword || newPassword !== confirmPassword ? 'not-allowed' : 'pointer',
              }}
            >
              {isLoading ? 'Saqlanmoqda...' : 'Parolni o\'zgartirish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
