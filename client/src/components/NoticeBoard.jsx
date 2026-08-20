import React, { useState, useEffect, useRef } from 'react';
import { Pin, Calendar, AlertCircle, Plus, Send, Megaphone } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function NoticeBoard({ user, token }) {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Notice Form State (Admin Only)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [posting, setPosting] = useState(false);
  const [success, setSuccess] = useState(false);

  const carouselRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -310 : 310;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };


  const fetchNotices = async () => {
    setLoading(true);
    try {
      // 1 & 2. Fetch admin notices & public complaints concurrently in parallel!
      const [noticesRes, complaintsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/notices/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/complaints/public/list`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      let noticesData = noticesRes.ok ? await noticesRes.json() : [];
      let complaintsData = complaintsRes.ok ? await complaintsRes.json() : [];

      // 3. Map notices
      const mappedNotices = (Array.isArray(noticesData) ? noticesData : []).map(item => ({
        id: `notice-${item.id}`,
        title: item.title,
        content: item.content,
        isImportant: item.isImportant,
        type: 'NOTICE',
        author: item.isImportant ? 'Secretary' : 'Admin',
        createdAt: item.createdAt,
        badgeText: item.isImportant ? 'Urgent' : 'General',
        badgeType: item.isImportant ? 'urgent' : 'general'
      }));

      // 4. Map complaints with actual resident submitter info
      const mappedComplaints = (Array.isArray(complaintsData) ? complaintsData : []).map(item => {
        const residentName = item.resident?.name;
        const flat = item.resident?.flatNumber;
        const authorText = residentName 
          ? `${residentName}${flat ? ` (Apt ${flat})` : ''}` 
          : 'Resident';

        return {
          id: `complaint-${item.id}`,
          title: item.title,
          content: item.description,
          isImportant: item.priority === 'HIGH',
          type: 'COMPLAINT',
          author: authorText,
          createdAt: item.createdAt,
          badgeText: `${item.category} • ${item.status}`,
          badgeType: item.status.toLowerCase()
        };
      });

      // 5. Merge and sort by latest date
      const combined = [...mappedNotices, ...mappedComplaints];
      combined.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setNotices(combined);
    } catch (err) {
      console.error(err);
      setError('Connection error, could not load notice board items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotices();
    }
  }, [token]);

  const handlePostNotice = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setPosting(true);
    setError('');
    setSuccess(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/notices/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, content, isImportant })
      });

      if (res.ok) {
        setSuccess(true);
        setTitle('');
        setContent('');
        setIsImportant(false);
        fetchNotices(); // reload board
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to post notice.');
      }
    } catch (err) {
      setError('Server connection error. Failed to post.');
    } finally {
      setPosting(false);
    }
  };

  const isAdmin = user && user.role === 'ADMIN';

  return (
    <div className={isAdmin ? "dashboard-layout" : ""} style={isAdmin ? {} : { display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
      {/* Notice Feed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && !isAdmin && (
          <div style={{ padding: '12px', background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--danger)', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading ? (
          /* Loading Placeholder */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '30px', padding: '20px' }}>
            {[1, 2].map(n => (
              <div key={n} className="glass shimmer" style={{ height: '300px', borderRadius: '14px' }}></div>
            ))}
          </div>
        ) : (
          <div className="corkboard-frame" style={{ width: '100%', position: 'relative' }}>
            {/* Arrow indicator pointing to more pinned notices */}
            {notices.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'absolute', top: '12px', right: '16px', zIndex: 30 }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'none', mediaMinWidth: '480px' }}>
                  {notices.length} Notices Pinned
                </span>
                <button 
                  onClick={() => scrollCarousel('right')}
                  style={{
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    backgroundColor: '#E76F51',
                    color: '#FFFFFF',
                    borderRadius: '20px',
                    border: '1px solid rgba(255,255,255,0.3)',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.4)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="View next notice"
                >
                  More Notices &rarr;
                </button>
              </div>
            )}

            {/* Scroll navigation arrows (visible on desktop) */}
            {notices.length > 0 && (
              <>
                <button className="carousel-btn carousel-btn-left" onClick={() => scrollCarousel('left')}>
                  &larr;
                </button>
                <button className="carousel-btn carousel-btn-right" onClick={() => scrollCarousel('right')}>
                  &rarr;
                </button>
              </>
            )}

            <div className="corkboard-header-msg">
              Latest Notices & Announcements Pinned Below
            </div>
            
            <div className="corkboard-inner" style={{ overflow: 'hidden' }}>
              {notices.length === 0 ? (
                <div className="polaroid-carousel" style={{ justifyContent: 'center', padding: '30px 0 40px 0', position: 'relative' }}>
                  <div className="polaroid-card" style={{ marginTop: '20px', transform: 'rotate(-1deg)' }}>
                    {/* Red pushpin */}
                    <div className="polaroid-red-pushpin"></div>
                    
                    {/* Frame contents */}
                    <div className="polaroid-photo-frame">
                      <div>
                        <span className="polaroid-badge polaroid-badge-general" style={{ backgroundColor: '#475569' }}>
                          System
                        </span>
                        <h3 className="polaroid-title">Board Empty</h3>
                      </div>
                      
                      <div className="polaroid-body">
                        The board is currently empty. You'll see important updates, announcements, and alerts here.
                      </div>
                    </div>

                    {/* Caption */}
                    <div className="polaroid-caption">
                      👤 Admin &nbsp;•&nbsp; 📅 Today
                    </div>
                  </div>
                </div>
              ) : (
                <div className="polaroid-carousel" ref={carouselRef} style={{ position: 'relative' }}>
                  {notices.map((notice) => {
                    const isImportant = notice.isImportant;
                    return (
                      <div 
                        key={notice.id} 
                        className="polaroid-card"
                        style={{ marginTop: '20px' }}
                      >
                        {/* Red pushpin */}
                        <div className="polaroid-red-pushpin"></div>
                        
                        {/* Frame contents */}
                        <div className="polaroid-photo-frame">
                          <div>
                            <span 
                              className={`polaroid-badge polaroid-badge-${notice.badgeType}`}
                              style={notice.type === 'COMPLAINT' ? { 
                                backgroundColor: notice.badgeType === 'resolved' ? 'var(--success)' : notice.badgeType === 'in_progress' ? 'var(--warning)' : 'var(--danger)',
                                fontSize: '8px'
                              } : {}}
                            >
                              {notice.badgeText}
                            </span>
                            <h3 className="polaroid-title">
                              {notice.title}
                            </h3>
                          </div>
                          
                          <div className="polaroid-body">
                            {notice.content}
                          </div>
                        </div>

                        {/* Caption below frame */}
                        <div className="polaroid-caption">
                          👤 {notice.author} &nbsp;•&nbsp; 📅 {new Date(notice.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin Post Notice Side panel */}
      {isAdmin && (
        <div className="glass" style={{ padding: '20px', position: 'sticky', top: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} style={{ color: 'var(--primary)' }} />
            Post New Announcement
          </h3>

          <form onSubmit={handlePostNotice} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Notice Title
              </label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Scheduled Water Shutoff"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                maxLength={100}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Notice Details
              </label>
              <textarea 
                className="input-field" 
                placeholder="Enter important announcement details here..."
                rows={5}
                style={{ resize: 'none', lineHeight: '1.5' }}
                value={content}
                onChange={e => setContent(e.target.value)}
                required
              ></textarea>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px 0', fontSize: '13px' }}>
              <input 
                type="checkbox"
                checked={isImportant}
                onChange={e => setIsImportant(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--danger)' }}
              />
              <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                Mark as Important (Pins & Emails residents)
              </span>
            </label>

            {error && (
              <div style={{ padding: '8px 12px', background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: '12px' }}>
                {error}
              </div>
            )}

            {success && (
              <div style={{ padding: '8px 12px', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', fontSize: '12px' }}>
                Notice broadcast successfully!
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={posting}
              style={{ width: '100%', marginTop: '4px' }}
            >
              <Send size={14} />
              {posting ? 'Broadcasting...' : 'Post Notice'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
