import React, { useState, useEffect } from 'react';
import { Mail, Lock, User as UserIcon, LogIn, UserPlus, Info, Eye, EyeOff, ShieldCheck, Headphones, Moon, Sun, Building, Home, Hash, Phone, KeyRound, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../config';

const safeGetItem = (key, fallback = '') => {
  try {
    return localStorage.getItem(key) || fallback;
  } catch (e) {
    return fallback;
  }
};

const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
};

export default function Login({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('RESIDENT'); // RESIDENT or ADMIN

  // Additional profile state for signup
  const [societyName, setSocietyName] = useState('');
  const [apartmentName, setApartmentName] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [occupancyType, setOccupancyType] = useState('OWNER'); // OWNER or TENANT

  // Verification state
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [activeOTP, setActiveOTP] = useState('');
  const [otp, setOtp] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [buttonPressed, setButtonPressed] = useState(false);

  const [theme, setTheme] = useState(() => safeGetItem('staywise-theme', 'light'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');
    setLoading(true);

    const url = isRegister 
      ? `${API_BASE_URL}/api/auth/register` 
      : `${API_BASE_URL}/api/auth/login`;
      
    const payload = isRegister 
      ? { name, email, password, role, societyName, apartmentName, flatNumber, phoneNumber, occupancyType } 
      : { email, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        if (data.requiresVerification) {
          setRequiresVerification(true);
          setVerificationEmail(data.email || email);
          if (data.devOTP) setActiveOTP(data.devOTP);
          setInfoMsg(data.message || 'Verification code sent to your email.');
        } else {
          onLoginSuccess(data.token, data.user, isRegister);
        }
      } else {
        if (data.requiresVerification) {
          setRequiresVerification(true);
          setVerificationEmail(data.email || email);
          if (data.devOTP) setActiveOTP(data.devOTP);
          setError(data.error || 'Please verify your email address to continue.');
        } else {
          setError(data.error || 'Authentication failed. Please check inputs.');
        }
      }
    } catch (err) {
      setError('Connection failed. Please verify the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setInfoMsg('');
    setVerifying(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail, otp: otp.trim() })
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data.token, data.user, isRegister);
      } else {
        setError(data.error || 'Invalid or expired verification code.');
      }
    } catch (err) {
      setError('Connection error. Failed to verify code.');
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setInfoMsg('');
    setResending(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: verificationEmail })
      });

      const data = await res.json();
      if (res.ok) {
        if (data.devOTP) setActiveOTP(data.devOTP);
        setInfoMsg(data.message || 'A new verification code has been sent to your email address.');
      } else {
        setError(data.error || 'Failed to resend verification code.');
      }
    } catch (err) {
      setError('Connection error. Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '40px 24px 24px 24px',
      backgroundColor: 'var(--bg-color)',
      position: 'relative',
      overflowX: 'hidden',
      color: '#313b4d'
    }}>
      
      {/* Theme Toggle in top-right */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 100 }}>
        <button
          type="button"
          onClick={() => {
            const nextTheme = theme === 'light' ? 'dark' : 'light';
            setTheme(nextTheme);
            document.documentElement.setAttribute('data-theme', nextTheme);
            safeSetItem('staywise-theme', nextTheme);
          }}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-color)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)',
            color: 'var(--text-primary)',
            transition: 'all 0.2s'
          }}
          title="Toggle Dark Mode"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>
      
      {/* Background soft masking image */}
      <div 
        className="login-bg-image"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '55%',
          height: '100%',
          backgroundImage: "url('/apartment.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center right',
          opacity: 0.08,
          pointerEvents: 'none',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%)',
          zIndex: 1
        }}
      ></div>

      {/* Main container */}
      <div style={{ width: '100%', maxWidth: requiresVerification ? '440px' : isRegister ? '480px' : '420px', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'max-width 0.3s ease' }}>
        
        {/* Soft UI Neumorphic Card */}
        <div style={{
          width: '100%',
          backgroundColor: 'var(--bg-color)',
          borderRadius: '32px',
          padding: '40px 32px 32px 32px',
          boxShadow: 'inset 12px 12px 24px var(--shadow-dark), inset -12px -12px 24px var(--shadow-light)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '20px'
        }}>

          {requiresVerification ? (
            /* OTP Verification Screen */
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-color)',
                boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                color: '#249D8F'
              }}>
                <KeyRound size={34} />
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                Verify Your Email
              </h2>
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', margin: '0 0 24px 0', lineHeight: '1.5', fontWeight: '500' }}>
                Enter the 6-digit verification code sent to<br />
                <strong style={{ color: '#249D8F' }}>{verificationEmail}</strong>
              </p>

              {infoMsg && (
                <div style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(36, 157, 143, 0.12)',
                  color: '#249D8F',
                  borderRadius: '12px',
                  fontSize: '13px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  lineHeight: '1.4',
                  boxShadow: 'inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)'
                }}>
                  <CheckCircle2 size={16} />
                  {infoMsg}
                </div>
              )}

              {error && (
                <div style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  lineHeight: '1.4',
                  boxShadow: 'inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)'
                }}>
                  <Info size={16} />
                  {error}
                </div>
              )}

              <form onSubmit={handleVerifyOTP} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={18} style={{ position: 'absolute', left: '18px', top: '16px', color: 'var(--text-secondary)', zIndex: 5 }} />
                  <input 
                    type="text" 
                    placeholder="6-digit OTP"
                    maxLength={6}
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      backgroundColor: 'var(--bg-color)',
                      border: 'none',
                      borderRadius: '14px',
                      fontSize: '20px',
                      fontWeight: '800',
                      letterSpacing: '8px',
                      textAlign: 'center',
                      outline: 'none',
                      color: 'var(--text-primary)',
                      boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
                      transition: 'all 0.15s ease'
                    }}
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={verifying}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: '#249D8F',
                    color: '#FDF0D5',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '15px',
                    fontWeight: '800',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light)'
                  }}
                >
                  <ShieldCheck size={18} />
                  {verifying ? 'Verifying Code...' : 'Verify & Activate Account'}
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: '24px', fontSize: '13px' }}>
                <button
                  type="button"
                  onClick={() => { setRequiresVerification(false); setError(''); setInfoMsg(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>

                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resending}
                  style={{ background: 'none', border: 'none', color: '#249D8F', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <RefreshCw size={14} className={resending ? 'spin-anim' : ''} /> Resend Code
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Circular Neumorphic Avatar Container */}
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-color)',
                boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                color: '#249D8F'
              }}>
                {/* Staywise house-speechbubble-leaf checkmark logo */}
                <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="70" y="16" width="8" height="18" rx="1.5" fill="currentColor" />
                  <path d="M50 6 L90 40 H82 V82 C82 85.3 79.3 88 76 88 H24 C20.7 88 18 85.3 18 82 V40 H10 L50 6 Z" fill="currentColor" />
                  <rect x="43" y="22" width="5" height="5" rx="1" fill="var(--bg-color)" />
                  <rect x="52" y="22" width="5" height="5" rx="1" fill="var(--bg-color)" />
                  <rect x="43" y="30" width="5" height="5" rx="1" fill="var(--bg-color)" />
                  <rect x="52" y="30" width="5" height="5" rx="1" fill="var(--bg-color)" />
                  <path d="M32 44 H68 C72.4 44 76 47.6 76 52 V64 C76 68.4 72.4 72 68 72 H48 L38 80 V72 H32 C27.6 72 24 68.4 24 64 V52 C24 47.6 27.6 44 32 44 Z" fill="var(--bg-color)" />
                  <circle cx="42" cy="58" r="3" fill="currentColor" />
                  <circle cx="50" cy="58" r="3" fill="currentColor" />
                  <circle cx="58" cy="58" r="3" fill="currentColor" />
                  <path d="M8 66 C4 76 12 88 22 86 C18 76 13 70 8 66 Z" fill="currentColor" />
                  <path d="M16 73 C13 81 19 89 26 87 C23 80 20 76 16 73 Z" fill="currentColor" />
                  <path d="M12 60 C22 60 34 74 56 92 C70 68 88 46 100 36 C80 52 55 78 44 94 C30 80 18 66 12 60 Z" fill="currentColor" />
                </svg>
              </div>

              {/* Heading */}
              <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
                {isRegister ? 'Create Account' : <><span>Welcome to </span><span style={{ color: '#E9C46A' }}>Staywise</span></>}
              </h2>
              
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 28px 0', fontWeight: '500' }}>
                {isRegister ? 'Please register to continue' : 'Please sign in to continue'}
              </p>

              {error && (
                <div style={{
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'var(--danger-bg)',
                  color: 'var(--danger)',
                  borderRadius: '12px',
                  fontSize: '13px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  lineHeight: '1.4',
                  boxShadow: 'inset 2px 2px 5px var(--shadow-dark), inset -2px -2px 5px var(--shadow-light)'
                }}>
                  <Info size={16} />
                  {error}
                </div>
              )}

          <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {isRegister && (
              <div>
                <div style={{ position: 'relative' }}>
                  <UserIcon size={18} style={{ position: 'absolute', left: '18px', top: '15px', color: 'var(--text-secondary)', zIndex: 5 }} />
                  <input 
                    type="text" 
                    placeholder="Full name *" 
                    style={{
                      width: '100%',
                      padding: '14px 16px 14px 48px',
                      backgroundColor: 'var(--bg-color)',
                      border: 'none',
                      borderRadius: '14px',
                      fontSize: '14px',
                      outline: 'none',
                      color: 'var(--text-primary)',
                      boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
                      transition: 'all 0.15s ease'
                    }}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '18px', top: '15px', color: 'var(--text-secondary)', zIndex: 5 }} />
                <input 
                  type="email" 
                  placeholder="Email address *" 
                  style={{
                    width: '100%',
                    padding: '14px 16px 14px 48px',
                    backgroundColor: 'var(--bg-color)',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '14px',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
                    transition: 'all 0.15s ease'
                  }}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '18px', top: '15px', color: 'var(--text-secondary)', zIndex: 5 }} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password *" 
                  style={{
                    width: '100%',
                    padding: '14px 48px 14px 48px',
                    backgroundColor: 'var(--bg-color)',
                    border: 'none',
                    borderRadius: '14px',
                    fontSize: '14px',
                    outline: 'none',
                    color: 'var(--text-primary)',
                    boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
                    transition: 'all 0.15s ease'
                  }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '18px',
                    top: '15px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 5
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {isRegister && (
              <>
                {/* Society Name */}
                <div>
                  <div style={{ position: 'relative' }}>
                    <Building size={18} style={{ position: 'absolute', left: '18px', top: '15px', color: 'var(--text-secondary)', zIndex: 5 }} />
                    <input 
                      type="text" 
                      placeholder="Society / Community name" 
                      style={{
                        width: '100%',
                        padding: '14px 16px 14px 48px',
                        backgroundColor: 'var(--bg-color)',
                        border: 'none',
                        borderRadius: '14px',
                        fontSize: '14px',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
                        transition: 'all 0.15s ease'
                      }}
                      value={societyName}
                      onChange={e => setSocietyName(e.target.value)}
                    />
                  </div>
                </div>

                {/* Grid for Apartment/Building & Flat/Unit No */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <div style={{ position: 'relative' }}>
                      <Home size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-secondary)', zIndex: 5 }} />
                      <input 
                        type="text" 
                        placeholder="Apartment / Block" 
                        style={{
                          width: '100%',
                          padding: '14px 12px 14px 40px',
                          backgroundColor: 'var(--bg-color)',
                          border: 'none',
                          borderRadius: '14px',
                          fontSize: '13px',
                          outline: 'none',
                          color: 'var(--text-primary)',
                          boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
                          transition: 'all 0.15s ease'
                        }}
                        value={apartmentName}
                        onChange={e => setApartmentName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <div style={{ position: 'relative' }}>
                      <Hash size={18} style={{ position: 'absolute', left: '14px', top: '15px', color: 'var(--text-secondary)', zIndex: 5 }} />
                      <input 
                        type="text" 
                        placeholder="Flat / Unit No" 
                        style={{
                          width: '100%',
                          padding: '14px 12px 14px 40px',
                          backgroundColor: 'var(--bg-color)',
                          border: 'none',
                          borderRadius: '14px',
                          fontSize: '13px',
                          outline: 'none',
                          color: 'var(--text-primary)',
                          boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
                          transition: 'all 0.15s ease'
                        }}
                        value={flatNumber}
                        onChange={e => setFlatNumber(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', left: '18px', top: '15px', color: 'var(--text-secondary)', zIndex: 5 }} />
                    <input 
                      type="tel" 
                      placeholder="Phone number" 
                      style={{
                        width: '100%',
                        padding: '14px 16px 14px 48px',
                        backgroundColor: 'var(--bg-color)',
                        border: 'none',
                        borderRadius: '14px',
                        fontSize: '14px',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
                        transition: 'all 0.15s ease'
                      }}
                      value={phoneNumber}
                      onChange={e => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>

                {/* Occupancy Status: Owner or Tenant */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', paddingLeft: '4px' }}>
                    Occupancy Status
                  </label>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    padding: '6px',
                    backgroundColor: 'var(--bg-color)',
                    borderRadius: '16px',
                    boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)'
                  }}>
                    <button
                      type="button"
                      onClick={() => setOccupancyType('OWNER')}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: occupancyType === 'OWNER' ? '#249D8F' : 'var(--bg-color)',
                        color: occupancyType === 'OWNER' ? '#FDF0D5' : 'var(--text-muted)',
                        boxShadow: occupancyType === 'OWNER' 
                          ? '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)' 
                          : 'none',
                        transition: 'all 0.25s'
                      }}
                    >
                      Owner
                    </button>
                    <button
                      type="button"
                      onClick={() => setOccupancyType('TENANT')}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        border: 'none',
                        backgroundColor: occupancyType === 'TENANT' ? '#249D8F' : 'var(--bg-color)',
                        color: occupancyType === 'TENANT' ? '#FDF0D5' : 'var(--text-muted)',
                        boxShadow: occupancyType === 'TENANT' 
                          ? '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)' 
                          : 'none',
                        transition: 'all 0.25s'
                      }}
                    >
                      Tenant
                    </button>
                  </div>
                </div>
              </>
            )}

            {isRegister ? (
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px', paddingLeft: '4px' }}>
                  Register As
                </label>
                {/* Segmented Neumorphic Control */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '12px',
                  padding: '6px',
                  backgroundColor: 'var(--bg-color)',
                  borderRadius: '16px',
                  boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)'
                }}>
                  <button
                    type="button"
                    onClick={() => setRole('RESIDENT')}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: role === 'RESIDENT' ? '#249D8F' : 'var(--bg-color)',
                      color: role === 'RESIDENT' ? '#FDF0D5' : 'var(--text-muted)',
                      boxShadow: role === 'RESIDENT' 
                        ? '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)' 
                        : 'none',
                      transition: 'all 0.25s'
                    }}
                  >
                    Resident
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('ADMIN')}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      border: 'none',
                      backgroundColor: role === 'ADMIN' ? '#E9C46A' : 'var(--bg-color)',
                      color: role === 'ADMIN' ? '#1A332F' : 'var(--text-muted)',
                      boxShadow: role === 'ADMIN' 
                        ? '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)' 
                        : 'none',
                      transition: 'all 0.25s'
                    }}
                  >
                    Admin
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '0 4px' }}>
                
                {/* Custom Neumorphic Checkbox */}
                <div 
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  onClick={() => setRememberMe(!rememberMe)}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    backgroundColor: 'var(--bg-color)',
                    boxShadow: rememberMe 
                      ? 'inset 2px 2px 4px var(--shadow-dark), inset -2px -2px 4px var(--shadow-light)'
                      : '2px 2px 4px var(--shadow-dark), -2px -2px 4px var(--shadow-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}>
                    {rememberMe && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '2px',
                        backgroundColor: 'var(--primary)'
                      }}></div>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Remember me</span>
                </div>

                <a 
                  href="#forgot" 
                  onClick={(e) => { e.preventDefault(); alert('Reset OTP simulation triggered. Please check your inbox.'); }} 
                  style={{ color: '#E76F51', fontWeight: '600' }}
                >
                  Forgot password?
                </a>
              </div>
            )}

            {/* Tactile submit button */}
            <button 
              type="submit" 
              onMouseDown={() => setButtonPressed(true)}
              onMouseUp={() => setButtonPressed(false)}
              onMouseLeave={() => setButtonPressed(false)}
              style={{
                width: '100%',
                padding: '14px',
                backgroundColor: '#249D8F',
                color: '#FDF0D5',
                border: 'none',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: buttonPressed || loading
                  ? 'inset 4px 4px 8px rgba(0,0,0,0.25)'
                  : '5px 5px 10px var(--shadow-dark), -5px -5px 10px var(--shadow-light), 0 0 20px rgba(36, 157, 143, 0.2)',
                transition: 'all 0.15s ease'
              }}
              disabled={loading}
            >
              {isRegister ? (
                <>
                  <UserPlus size={16} /> {loading ? 'Registering...' : 'Sign Up'}
                </>
              ) : (
                <>
                  <LogIn size={16} /> {loading ? 'Signing In...' : 'Sign In'}
                </>
              )}
            </button>
          </form>

          {/* Divider line */}
          <div style={{ width: '100%', display: 'flex', alignItems: 'center', margin: '28px 0 20px 0', color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, rgba(0,0,0,0), var(--shadow-dark))' }}></div>
            <span style={{ padding: '0 12px' }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--shadow-dark), rgba(0,0,0,0))' }}></div>
          </div>

          {/* Social Logins */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            <button 
              type="button"
              onClick={() => alert('Google authentication simulated.')}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                backgroundColor: 'var(--bg-color)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                fontWeight: '700',
                transition: 'all 0.2s'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Form Switch Link */}
          <div style={{ textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600' }}>
            {isRegister ? (
              <>
                Already have an account?{' '}
                <button 
                  onClick={() => { setIsRegister(false); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#249D8F', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don’t have an account?{' '}
                <button 
                  onClick={() => { setIsRegister(true); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#249D8F', fontWeight: '800', cursor: 'pointer', fontSize: '13px' }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
            </>
          )}
        </div>

      </div>

      {/* Global Page Footer Elements */}
      <div 
        className="login-footer"
        style={{
          width: '100%',
          maxWidth: '1000px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '30px',
          zIndex: 10
        }}
      >
        {/* Left Side: Secure Lock Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            backgroundColor: 'var(--bg-color)',
            color: '#249D8F',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)'
          }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>Your data is safe with us.</div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Secure. Reliable. Transparent.</div>
          </div>
        </div>

        {/* Right Side: Headset Support Link */}
        <div 
          onClick={() => alert('Support helpline: +1 (800) 555-AURA. Simulated Live Chat.')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
        >
          <div style={{
            backgroundColor: 'var(--bg-color)',
            color: '#E9C46A',
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 3px 3px 6px var(--shadow-dark), inset -3px -3px 6px var(--shadow-light)'
          }}>
            <Headphones size={20} />
          </div>
          <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)' }}>Support</span>
        </div>
      </div>
      
    </div>
  );
}
