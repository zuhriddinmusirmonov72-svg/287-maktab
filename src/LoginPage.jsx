import { useState } from 'react';
import './index.css'
import Registe from "./assets/login.svg"

const LoginPage = ({ onLogin }) => {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(login, password);
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <img src={Registe} alt="Illustration" />
      </div>
      <div className="login-right">
        <div className="login-form-container">
          <p className="uni-name">
            MUHAMMAD AL-XORAZMIY NOMIDAGI <br /> TOSHKENT AXBOROT TEXNOLOGIYALARI <br /> UNIVERSITETI
          </p>
          <img className="tuit-logo" src="https://lms.tuit.uz/assets/images/logo-md.png" alt="Logo" />
          <h2 className="lms-title">LEARNING MANAGEMENT SYSTEM</h2>

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Login</label>
              <input type="text" placeholder="Loginni kiriting" value={login} onChange={(e) => setLogin(e.target.value)} />
            </div>

            <div className="input-group">
              <label>Parol</label>
              <input type="password" placeholder="Parolni kiriting" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button type="submit" className="login-button">Kirish</button>
          </form>

          <p className="copyright">Copyright © 2021 of Tashkent University of Information Technologies</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;