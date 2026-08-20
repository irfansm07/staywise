import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function WelcomeModal({ isOpen, isNewUser, onClose }) {
  const [isExiting, setIsExiting] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsExiting(false);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleExplore = () => {
    // 3 seconds side-cannon confetti using custom brand teal colors
    const end = Date.now() + 2.5 * 1000;
    const colors = ['#249D8F', '#E9C46A', '#E76F51', '#FDF0D5'];

    const frame = () => {
      if (Date.now() > end) return;
      
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 50,
        origin: { x: 0, y: 0.75 },
        colors: colors,
      });

      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 50,
        origin: { x: 1, y: 0.75 },
        colors: colors,
      });

      requestAnimationFrame(frame);
    };

    frame();

    // Start exit transition
    setIsExiting(true);
    setTimeout(() => {
      setShouldRender(false);
      onClose();
    }, 450);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(8px)',
        opacity: isExiting ? 0 : 1,
        transition: 'opacity 0.4s ease',
        animation: !isExiting ? 'fadeIn 0.3s ease forwards' : 'none'
      }}
    >
      <div 
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-color)',
          borderRadius: '24px',
          padding: '36px 32px',
          textAlign: 'center',
          boxShadow: '10px 10px 30px var(--shadow-dark), -10px -10px 30px var(--shadow-light)',
          border: '1px solid var(--border-color)',
          transform: isExiting ? 'scale(0.9) translateY(20px)' : 'scale(1) translateY(0)',
          opacity: isExiting ? 0 : 1,
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease',
          animation: !isExiting ? 'modalPopUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'none'
        }}
      >
        {/* Animated Badge Icon */}
        <div 
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-color)',
            boxShadow: 'inset 4px 4px 8px var(--shadow-dark), inset -4px -4px 8px var(--shadow-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px auto',
            position: 'relative'
          }}
        >
          <ShieldCheck size={38} style={{ color: 'var(--primary)' }} />
          <Sparkles 
            size={18} 
            style={{ 
              color: 'var(--text-secondary)', 
              position: 'absolute',
              top: '8px',
              right: '8px',
              animation: 'spin 4s linear infinite'
            }} 
          />
        </div>

        {/* Title */}
        <h2 
          style={{
            fontSize: '24px',
            fontWeight: '800',
            color: 'var(--text-primary)',
            marginBottom: '16px',
            letterSpacing: '-0.5px'
          }}
        >
          {isNewUser ? 'Welcome to Staywise!' : 'Welcome Back!'}
        </h2>

        {/* Message */}
        <p 
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: 'var(--text-muted)',
            marginBottom: '32px',
            padding: '0 8px'
          }}
        >
          {isNewUser 
            ? 'We are thrilled to have you! Your registration is complete. Welcome to your new smart apartment portal. Easily raise maintenance requests, add photos, track progress updates, and browse notice board posts.'
            : 'It’s fantastic to see you again! Your dashboard is loaded. Explore active notices, track status history updates, and manage your current complaints.'
          }
        </p>

        {/* Trigger/Explore button */}
        <button
          onClick={handleExplore}
          className="btn btn-primary"
          style={{
            width: '100%',
            padding: '14px 28px',
            borderRadius: '16px',
            fontSize: '15px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '4px 4px 10px var(--shadow-dark), -4px -4px 10px var(--shadow-light)',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
        >
          Explore Dashboard
          <ArrowRight size={16} />
        </button>
      </div>

      {/* Embedded modal styling */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPopUp {
          from {
            opacity: 0;
            transform: scale(0.85) translateY(30px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
