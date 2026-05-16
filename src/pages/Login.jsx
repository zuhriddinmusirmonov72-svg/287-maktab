import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiCheckCircle } from 'react-icons/fi';

const Login = () => {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      if (login.trim() && password.trim()) {
        toast.custom((t) => (
          <div style={{ backgroundColor: '#2e7d32', color: 'white', padding: '16px 24px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '500', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', marginTop: '16px', marginRight: '16px' }}>
            <FiCheckCircle size={20} />
            Muvaffaqiyatli tizimga kirdingiz!
          </div>
        ), { duration: 3000 });
        navigate('/dashboard');
      } else {
        toast.error('Login va parolni kiriting!');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div style={{ position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '1/1' }}>
          <div style={{ position: 'absolute', inset: '0', backgroundColor: 'rgba(59, 130, 246, 0.2)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
          <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <div style={{ width: '300px', height: '300px', backgroundColor: '#e5e7eb', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', position: 'relative' }}>
                <div style={{ position: 'absolute', bottom: '0', width: '400px', height: '150px', backgroundColor: '#3b4b6b', left: '-50px', display: 'flex', justifyContent: 'center' }}>
                   <div style={{ width: '100px', height: '200px', backgroundColor: '#2a3855', position: 'absolute', bottom: '100px', borderTopLeftRadius: '9999px', borderTopRightRadius: '9999px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px' }}>Illustration</div>
                </div>
             </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-box">
          <div>
            <p className="login-tuit-title">
              MUHAMMAD AL-XORAZMIY NOMIDAGI<br />
              TOSHKENT AXBOROT TEXNOLOGIYALARI<br />
              UNIVERSITETI
            </p>
            <div className="login-logo">
              <img src="https://lms.tuit.uz/assets/images/logo-md.png" alt="TUIT Logo" style={{ width: '100%', height: 'auto' }} />
            </div>
            <h2 className="login-main-title">
              LEARNING MANAGEMENT SYSTEM
            </h2>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '12px', color: '#4b5563', fontWeight: '600' }}>
                Login
              </label>
              <input
                type="text"
                placeholder="Loginni kiriting"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="form-input"
                style={{ padding: '12px 16px' }}
              />
            </div>

            <div>
              <label className="form-label" style={{ textTransform: 'uppercase', fontSize: '12px', color: '#4b5563', fontWeight: '600' }}>
                Parol
              </label>
              <input
                type="password"
                placeholder="Parolni kiriting"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{ padding: '12px 16px' }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="login-submit-btn"
              style={{
                backgroundColor: login && password ? '#556ee6' : '#e9ecef',
                color: login && password ? 'white' : '#a6b0cf'
              }}
            >
              {isLoading ? (
                <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
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
