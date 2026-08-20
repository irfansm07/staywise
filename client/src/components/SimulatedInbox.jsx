import React, { useState, useEffect } from 'react';
import { Mail, X, Inbox, ChevronRight, Clock, ExternalLink } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function SimulatedInbox() {
  const [emails, setEmails] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastViewedCount, setLastViewedCount] = useState(0);

  const fetchEmails = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/simulated-emails`);
      if (res.ok) {
        const data = await res.json();
        const sorted = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setEmails(sorted);
        
        if (!isOpen) {
          const newCount = sorted.length - lastViewedCount;
          setUnreadCount(newCount > 0 ? newCount : 0);
        }
      }
    } catch (err) {
      // Silently catch connection errors during hot restarts
    }
  };

  useEffect(() => {
    fetchEmails();
    const interval = setInterval(fetchEmails, 3000);
    return () => clearInterval(interval);
  }, [isOpen, lastViewedCount, emails.length]);

  const handleOpenToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
      setLastViewedCount(emails.length);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button 
        onClick={handleOpenToggle}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#6366f1',
          border: 'none',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4), 0 0 10px rgba(99, 102, 241, 0.2)',
          color: 'white',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.2s',
        }}
        className="hover-pop"
        title="Simulated Email Inbox"
      >
        <Mail size={24} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '22px',
            height: '22px',
            fontSize: '11px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)',
            animation: 'pulse 1.5s infinite'
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Inbox Panel */}
      {isOpen && (
        <div 
          className="glass"
          style={{
            position: 'fixed',
            bottom: '96px',
            right: '24px',
            width: '380px',
            height: '500px',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
            borderRadius: '16px',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 15, 30, 0.6)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail size={18} style={{ color: '#6366f1' }} />
              <h3 style={{ fontSize: '15px', fontWeight: '600', margin: 0 }}>Simulated Email Server</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                padding: '4px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              className="btn-secondary-hover"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {selectedEmail ? (
              /* Email Details View */
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Back button */}
                <div style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.02)'
                }}>
                  <button 
                    onClick={() => setSelectedEmail(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#6366f1',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    &larr; Back to inbox
                  </button>
                </div>
                
                {/* Details */}
                <div style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                      {new Date(selectedEmail.timestamp).toLocaleString()}
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0', color: '#fff' }}>
                      {selectedEmail.subject}
                    </h4>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                      <strong>To:</strong> {selectedEmail.to}
                    </div>
                  </div>

                  {/* HTML Content Render */}
                  <div 
                    style={{
                      background: 'white',
                      color: '#1e293b',
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      lineHeight: '1.5',
                      boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.06)'
                    }}
                    dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                  />

                  {/* Preview Ethereal Link */}
                  {selectedEmail.previewUrl && (
                    <a 
                      href={selectedEmail.previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn"
                      style={{
                        marginTop: '16px',
                        width: '100%',
                        backgroundColor: '#10b981',
                        color: 'white',
                        fontSize: '12px',
                        padding: '8px 12px',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <ExternalLink size={14} /> Open Real Web Sandbox Preview
                    </a>
                  )}
                </div>
              </div>
            ) : (
              /* Email List View */
              emails.length === 0 ? (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px',
                  color: '#64748b',
                  textAlign: 'center'
                }}>
                  <Inbox size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p style={{ fontSize: '14px', margin: 0 }}>No emails received yet.</p>
                  <p style={{ fontSize: '12px', marginTop: '4px' }}>Actions like posting notices or updating complaints will trigger emails.</p>
                </div>
              ) : (
                emails.map((email) => (
                  <div 
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                    className="email-item-hover"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: '#6366f1' }}>
                        To: {email.to.split('@')[0]}
                      </span>
                      <span style={{ fontSize: '10px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={10} /> {new Date(email.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '13px',
                      fontWeight: '500',
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {email.subject}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#94a3b8',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      Click to read notification body...
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </div>
      )}

      {/* Mini Style tag for Animations */}
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .hover-pop:hover {
          transform: scale(1.08);
          background-color: #4f46e5 !important;
        }
        .email-item-hover:hover {
          background-color: rgba(255, 255, 255, 0.03);
        }
        .btn-secondary-hover:hover {
          background-color: rgba(255, 255, 255, 0.06);
          color: white !important;
        }
      `}</style>
    </>
  );
}
