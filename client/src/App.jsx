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

function StayWiseLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
      <svg 
        width="34" 
        height="34" 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Chimney */}
        <rect x="70" y="16" width="8" height="18" rx="1.5" fill="var(--primary)" />

        {/* House Roof & Body */}
        <path 
          d="M50 6 L90 40 H82 V82 C82 85.3 79.3 88 76 88 H24 C20.7 88 18 85.3 18 82 V40 H10 L50 6 Z" 
          fill="var(--primary)"
        />

        {/* Attic 4-Window Grid (2x2) */}
        <rect x="43" y="22" width="5" height="5" rx="1" fill="var(--header-bg)" />
        <rect x="52" y="22" width="5" height="5" rx="1" fill="var(--header-bg)" />
        <rect x="43" y="30" width="5" height="5" rx="1" fill="var(--header-bg)" />
        <rect x="52" y="30" width="5" height="5" rx="1" fill="var(--header-bg)" />

        {/* White / Header-bg Speech Bubble inside House Body */}
        <path 
          d="M32 44 H68 C72.4 44 76 47.6 76 52 V64 C76 68.4 72.4 72 68 72 H48 L38 80 V72 H32 C27.6 72 24 68.4 24 64 V52 C24 47.6 27.6 44 32 44 Z" 
          fill="var(--header-bg)"
        />

        {/* 3 Dots inside Speech Bubble */}
        <circle cx="42" cy="58" r="3" fill="var(--primary)" />
        <circle cx="50" cy="58" r="3" fill="var(--primary)" />
        <circle cx="58" cy="58" r="3" fill="var(--primary)" />

        {/* Leaf Checkmark at Bottom Left */}
        <path 
          d="M8 66 C4 76 12 88 22 86 C18 76 13 70 8 66 Z" 
          fill="var(--primary)"
        />
        <path 
          d="M16 73 C13 81 19 89 26 87 C23 80 20 76 16 73 Z" 
          fill="var(--primary)"
        />
        <path 
          d="M12 60 C22 60 34 74 56 92 C70 68 88 46 100 36 C80 52 55 78 44 94 C30 80 18 66 12 60 Z" 
          fill="var(--primary)"
        />
      </svg>

      {/* Brand Text */}
      <span style={{ 
        fontFamily: "'Outfit', system-ui, -apple-system, sans-serif", 
        fontSize: '22px', 
        fontWeight: '800', 
        letterSpacing: '-0.02em', 
        color: 'var(--primary)',
        lineHeight: '1'
      }}>
        StayWise
      </span>
    </div>
  );
}

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
        {/* Row 1: Centered Logo & Profile */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', width: '100%' }}>
          {/* Left Column Spacer */}
          <div></div>

          {/* Center Column: StayWise Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <StayWiseLogo />
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
