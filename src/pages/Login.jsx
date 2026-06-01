import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCheckCircle, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { authAPI } from '../api/api';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 🔥 Token bo'lsa dashboardga yuboradi
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!phone.trim() || !password.trim()) {
      toast.error('Telefon raqam va parolni kiriting!');
      return;
    }

    setIsLoading(true);

    try {
      // 📡 BACKEND GA SO'ROV — phone as-is yuboriladi (998 yoki 9756...)
      const res = await authAPI.login(phone.trim(), password.trim());

      console.log('Login response:', res.data); // debug uchun

      // 🔥 TOKEN OLISH — backend qanday qaytarsa shuni olamiz
      const token =
        res.data?.token ||
        res.data?.data?.token ||
        res.data?.access_token ||
        res.data?.accessToken ||
        res.data?.data?.access_token;

      if (!token) {
        console.error('Token topilmadi. Response:', res.data);
        throw new Error('Token topilmadi');
      }

      // 🔐 TOKEN SAQLASH
      localStorage.setItem('token', token);

      // ✅ MUVAFFAQIYAT XABARI
      toast.custom(
        () => (
          <div
            style={{
              backgroundColor: '#2e7d32',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: '500',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            }}
          >
            <FiCheckCircle size={20} />
            Muvaffaqiyatli tizimga kirdingiz!
          </div>
        ),
        { duration: 3000 }
      );

      navigate('/dashboard');
    } catch (err) {
      console.error('Login xato:', err.response?.data || err.message);

      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Login yoki parol xato!';

      toast.custom(
        () => (
          <div
            style={{
              backgroundColor: '#c62828',
              color: 'white',
              padding: '16px 24px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontWeight: '500',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)',
            }}
          >
            <FiAlertCircle size={20} />
            {Array.isArray(message) ? message[0] : message}
          </div>
        ),
        { duration: 4000 }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* CHAP TOMON — Illustration */}
      <div className="login-left">
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '400px',
            aspectRatio: '1/1',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: '0',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderRadius: '50%',
              filter: 'blur(40px)',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 10,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '300px',
                height: '300px',
                backgroundColor: '#e5e7eb',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  bottom: '0',
                  width: '400px',
                  height: '150px',
                  backgroundColor: '#3b4b6b',
                  left: '-50px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: '100px',
                    height: '200px',
                    backgroundColor: '#2a3855',
                    position: 'absolute',
                    bottom: '100px',
                    borderTopLeftRadius: '9999px',
                    borderTopRightRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '12px',
                  }}
                >
                  Illustration
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* O'NG TOMON — Form */}
      <div className="login-right">
        <div className="login-form-box">
          <div>
            <p className="login-tuit-title">
              MUHAMMAD AL-XORAZMIY NOMIDAGI
              <br />
              TOSHKENT AXBOROT TEXNOLOGIYALARI
              <br />
              UNIVERSITETI
            </p>

            <div className="login-logo">
              <img
                src="https://lms.tuit.uz/assets/images/logo-md.png"
                alt="TUIT Logo"
                style={{ width: '100%', height: 'auto' }}
              />
            </div>

            <h2 className="login-main-title">LEARNING MANAGEMENT SYSTEM</h2>
          </div>

          <form
            onSubmit={handleLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
          >
            {/* 📱 TELEFON RAQAM */}
            <div>
              <label
                className="form-label"
                style={{
                  textTransform: 'uppercase',
                  fontSize: '12px',
                  color: '#4b5563',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Telefon raqam
              </label>
              <input
                type="text"
                placeholder="975661099"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="form-input"
                style={{ padding: '12px 16px' }}
                autoComplete="username"
                required
              />
              <small
                style={{
                  color: '#9ca3af',
                  fontSize: '11px',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                Misol: 975661099 yoki 998975661099
              </small>
            </div>

            {/* 🔑 PAROL */}
            <div>
              <label
                className="form-label"
                style={{
                  textTransform: 'uppercase',
                  fontSize: '12px',
                  color: '#4b5563',
                  fontWeight: '600',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Parol
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Parolni kiriting"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  style={{ padding: '12px 44px 12px 16px', width: '100%' }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0',
                  }}
                >
                  {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>

            {/* ✅ KIRISH TUGMASI */}
            <button
              type="submit"
              disabled={isLoading}
              className="login-submit-btn"
              style={{
                backgroundColor: phone && password ? '#556ee6' : '#e9ecef',
                color: phone && password ? 'white' : '#a6b0cf',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px',
                fontSize: '15px',
                fontWeight: '600',
                borderRadius: '8px',
                border: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {isLoading ? (
                <>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                    }}
                  />
                  Kirmoqda...
                </>
              ) : (
                'Kirish'
              )}
            </button>
          </form>
        </div>

        <p className="login-copyright">
          Copyright © 2021 of Tashkent University of Information Technologies
        </p>
      </div>
    </div>
  );
};

export default Login;