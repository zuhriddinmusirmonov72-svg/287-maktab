import { useState } from 'react';
import './index.css';
import Registe from "./assets/logo.svg"; 

const LoginPage = ({ onLogin }) => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(login, password);
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img
          src={Registe}
          alt="Illustration"
          className="login-illustration"
        />
      </div>
      <div className="login-right">
        <div className="login-form-box">
          <p className="login-tuit-title">
            MUHAMMAD AL-XORAZMIY NOMIDAGI <br /> TOSHKENT AXBOROT TEXNOLOGIYALARI <br /> UNIVERSITETI
          </p>
          <div className="login-logo">
            <img 
              src="https://lms.tuit.uz/assets/images/logo-md.png" 
              alt="Logo" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          </div>
          <h2 className="login-main-title">LEARNING MANAGEMENT SYSTEM</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Login</label>
              <input 
                className="form-input" 
                type="text" 
                placeholder="Loginni kiriting" 
                value={login} 
                onChange={(e) => setLogin(e.target.value)} 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Parol</label>
              <input 
                className="form-input" 
                type="password" 
                placeholder="Parolni kiriting" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>

            <button type="submit" className="login-submit-btn btn-primary">Kirish</button>
          </form>
        </div>
        <p className="login-copyright">Copyright © 2021 of Tashkent University of Information Technologies</p>
      </div>
    </div>
  );
};

export default LoginPage;