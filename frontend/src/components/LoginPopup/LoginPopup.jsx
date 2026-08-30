import React, { useState } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets';
import { useAuth } from '../../context/AuthContext';

const LoginPopup = ({ setShowLogin }) => {
  const [currState, setCurrState] = useState("Login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (currState === "Login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      setShowLogin(false);
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='login-popup'>
      <form onSubmit={handleSubmit} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="" />
        </div>
        <div className="login-popup-inputs">
          {currState === "Login" ? <></> :
            <input type="text" placeholder='Your Name' required value={name} onChange={(e) => setName(e.target.value)} />}
          <input type="email" placeholder='Your Email' required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder='Password' required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p style={{ color: "red", fontSize: "13px" }}>{error}</p>}
        <button type="submit" disabled={submitting}>
          {submitting ? "Please wait..." : currState === "Sign Up" ? "Create Account" : "Login"}
        </button>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing I agree to the terms of use & privacy policy.</p>
        </div>
        {currState === "Login"
          ? <p>Create a new Account? <span onClick={() => { setCurrState("Sign Up"); setError(""); }}>Click here</span></p>
          : <p>Already have an Account? <span onClick={() => { setCurrState("Login"); setError(""); }}>Login here</span></p>}
      </form>
    </div>
  )
}

export default LoginPopup
