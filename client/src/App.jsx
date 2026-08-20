import React, { useState, useEffect } from 'react';
import { LogOut, ShieldAlert, FileText, Megaphone, User as UserIcon, Loader, Moon, Sun } from 'lucide-react';
import Login from './pages/Login';
import ResidentDashboard from './pages/ResidentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NoticeBoard from './components/NoticeBoard';
import WelcomeModal from './components/WelcomeModal';
import { API_BASE_URL } from './config';

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

const safeRemoveItem = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (e) {}
};

export default function App() {
  const [token, setToken] = useState(() => safeGetItem('token', ''));
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState('complaints'); // complaints or notices
  const [theme, setTheme] = useState(() => safeGetItem('staywise-theme', 'light'));
  
  // Welcome Modal states
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Profile dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    safeSetItem('staywise-theme', theme);
  }, [theme]);

  const verifySession = async (authToken) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        // Clear expired token
        handleLogout();
      }
    } catch (err) {
      console.error('Session verify error:', err);
    } finally {
      setInitializing(false);
    }
  };

  useEffect(() => {
    if (token) {
      verifySession(token);
    } else {
      setInitializing(false);
    }
  }, [token]);

  const handleLoginSuccess = (authToken, userObj, isNew = false) => {
    safeSetItem('token', authToken);
    setToken(authToken);
    setUser(userObj);
    setIsNewUser(isNew);
    setShowWelcomeModal(true);
    setActiveTab('complaints');
  };

  const handleLogout = () => {
    safeRemoveItem('token');
    setToken('');
    setUser(null);
    setShowWelcomeModal(false);
  };

  if (initializing) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: 'var(--text-secondary)',
        backgroundColor: 'var(--bg-color)'
      }}>
        <Loader size={36} className="spin-anim" style={{ color: 'var(--primary)' }} />
        <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>Starting Aura Society Platform...</span>
      </div>
    );
  }

  // Render Login if no authenticated session
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Frosted Navigation Header */}
      <header className="header-layout" style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'stretch' }}>
        {/* Row 1: Logo & Profile */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', position: 'relative', minHeight: '36px' }}>
          {/* Left spacer for optical alignment balance */}
          <div style={{ width: '76px' }} />

          {/* Brand - Centered in middle of Top Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
              <svg width="22" height="26" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20,30 L60,30 L60,10 L25,10 C18,10 12,16 12,24 L12,48 L22,48 L22,34 L80,34 L80,104 L50,92 L20,104 L20,70 L10,70 L10,102 C10,111 18,118 26,118 L74,118 C82,118 90,111 90,102 L90,44 C90,36 84,30 76,30 L20,30 Z" fill="currentColor" />
                <path d="M32,46 L68,54 L68,96 L32,88 Z" fill="currentColor" />
                <circle cx="50" cy="70" r="4" fill="var(--bg-color)" />
                <path d="M47.5,73 L52.5,73 L54,82 L46,82 Z" fill="var(--bg-color)" />
              </svg>
            </div>
            <span className="brand-text" style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
              Staywise
            </span>
          </div>

        {/* Profile / Actions - Right Corner */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          {/* Theme Toggler */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="btn btn-secondary"
            style={{
              width: '32px',
              height: '32px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              boxShadow: '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)'
            }}
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {/* Profile Click Trigger */}
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-color)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              boxShadow: showProfileDropdown
                ? 'inset 2px 2px 4px var(--shadow-dark), inset -2px -2px 4px var(--shadow-light)'
                : '3px 3px 6px var(--shadow-dark), -3px -3px 6px var(--shadow-light)',
              transition: 'all 0.2s'
            }}
            title="View Profile Details"
          >
            <UserIcon size={14} style={{ color: 'var(--primary)' }} />
          </button>

          {/* Interactive details dropdown popup */}
          {showProfileDropdown && (
            <>
              {/* Tap backdrop mask to close popover */}
              <div 
                onClick={() => setShowProfileDropdown(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 995,
                  background: 'transparent'
                }}
              />
              <div 
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '40px',
                  zIndex: 996,
                  width: '260px',
                  backgroundColor: 'var(--bg-color)',
                  borderRadius: '16px',
                  padding: '20px',
                  boxShadow: '8px 8px 24px var(--shadow-dark), -8px -8px 24px var(--shadow-light)',
                  border: '1px solid var(--border-color)',
                  animation: 'dropdownFadeIn 0.2s ease forwards',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  textAlign: 'left'
                }}
              >
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px', marginBottom: '4px' }}>
                  <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.05em' }}>User Details</span>
                  <span style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>{user.name}</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user.email}</span>
                    <span style={{ fontSize: '10px', color: '#249D8F', fontWeight: '700', backgroundColor: 'rgba(36, 157, 143, 0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                      ✔ Verified
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Role:</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      {user.role === 'ADMIN' ? 'Society Admin' : 'Resident'}
                    </span>
                  </div>
                  {user.societyName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Society:</span>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)', textAlign: 'right', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user.societyName}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Apartment / Flat:</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      {user.apartmentName || user.flatNumber 
                        ? `${user.apartmentName || ''} ${user.flatNumber ? `#${user.flatNumber}` : ''}`.trim()
                        : 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Phone:</span>
                    <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      {user.phoneNumber || 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Occupancy:</span>
                    <span style={{ fontWeight: '700', color: 'var(--primary)' }}>
                      {user.occupancyType === 'TENANT' ? 'Tenant' : user.occupancyType === 'OWNER' ? 'Owner' : 'N/A'}
                    </span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setShowProfileDropdown(false);
                    handleLogout();
                  }}
                  className="btn btn-secondary" 
                  style={{ 
                    padding: '8px 16px', 
                    fontSize: '12px', 
                    marginTop: '8px', 
                    display: 'flex', 
                    gap: '6px', 
                    justifyContent: 'center',
                    boxShadow: '2px 2px 5px var(--shadow-dark), -2px -2px 5px var(--shadow-light)'
                  }}
                >
                  <LogOut size={12} />
                  Exit Portal
                </button>
              </div>
            </>
          )}
        </div> {/* Closes Profile/Actions */}
      </div> {/* Closes Row 1 wrapper */}

      {/* Row 2: Tab Switcher (Broad/Centered) */}
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%', borderTop: '2px solid #249D8F', paddingTop: '10px', marginTop: '4px' }}>
          <div className="neumorphic-tab-container" style={{ width: '100%', maxWidth: '600px', display: 'flex', padding: '6px', gap: '6px' }}>
            <button 
              onClick={() => setActiveTab('complaints')}
              className={`neumorphic-tab-btn ${activeTab === 'complaints' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}
            >
              <FileText size={16} style={{ marginRight: '6px' }} />
              <span style={{ fontSize: '13px', fontWeight: '700' }}>Complaints Hub</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('notices')}
              className={`neumorphic-tab-btn ${activeTab === 'notices' ? 'active' : ''}`}
              style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}
            >
              <Megaphone size={16} style={{ marginRight: '6px' }} />
              <span style={{ fontSize: '13px', fontWeight: '700' }}>Notice Board</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main style={{ flex: 1, padding: '24px 16px', maxWidth: '1280px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Render Tab Contents */}
        {activeTab === 'complaints' ? (
          user.role === 'ADMIN' ? (
            <AdminDashboard user={user} token={token} onLogout={handleLogout} />
          ) : (
            <ResidentDashboard user={user} token={token} onLogout={handleLogout} />
          )
        ) : (
          <NoticeBoard user={user} token={token} />
        )}
      </main>

      {/* Welcome Modal on Auth */}
      <WelcomeModal 
        isOpen={showWelcomeModal} 
        isNewUser={isNewUser} 
        onClose={() => setShowWelcomeModal(false)} 
      />

      <footer style={{
        textAlign: 'center',
        padding: '24px 0',
        fontSize: '11px',
        color: 'var(--text-muted)',
        borderTop: '2px solid #249D8F',
        marginTop: 'auto'
      }}>
        <span style={{ color: '#249D8F', fontWeight: '700' }}>©</span> 2026 <span style={{ color: '#E9C46A', fontWeight: '600' }}>Staywise</span> Management System • All Rights Reserved.
      </footer>
    </div>
  );
}
