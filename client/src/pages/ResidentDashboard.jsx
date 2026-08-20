import React, { useState, useEffect } from 'react';
import { LogOut, FileText, Upload, Clock, CheckCircle2, AlertTriangle, Image as ImageIcon, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ResidentDashboard({ user, token, onLogout }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Create complaint form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Plumbing');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // UI state
  const [expandedComplaint, setExpandedComplaint] = useState(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/complaints/resident/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      } else {
        setError('Failed to fetch your complaints.');
      }
    } catch (err) {
      setError('Connection error. Could not retrieve complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setSubmitting(true);
    setError('');
    setSubmitSuccess(false);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('description', description);
    if (photo) {
      formData.append('photo', photo);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/complaints/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setTitle('');
        setCategory('Plumbing');
        setDescription('');
        setPhoto(null);
        setPhotoPreview('');
        fetchComplaints(); // reload complaints
        setTimeout(() => setSubmitSuccess(false), 4000);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to file your complaint.');
      }
    } catch (err) {
      setError('Server connection error. Failed to file complaint.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedComplaint(expandedComplaint === id ? null : id);
  };

  // Stats aggregation
  const stats = {
    total: complaints.length,
    open: complaints.filter(c => c.status === 'OPEN').length,
    inProgress: complaints.filter(c => c.status === 'IN_PROGRESS').length,
    resolved: complaints.filter(c => c.status === 'RESOLVED').length
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(36, 157, 143, 0.12)', padding: '12px', borderRadius: '12px', color: '#249D8F' }}>
            <FileText size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Total Complaints</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#249D8F' }}>{stats.total}</div>
          </div>
        </div>
        
        <div className="glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(231, 111, 81, 0.12)', padding: '12px', borderRadius: '12px', color: '#E76F51' }}>
            <Clock size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Pending / Open</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#E76F51' }}>{stats.open}</div>
          </div>
        </div>
        
        <div className="glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(233, 196, 106, 0.18)', padding: '12px', borderRadius: '12px', color: '#C49B20' }}>
            <RefreshCw size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>In Progress</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#E9C46A' }}>{stats.inProgress}</div>
          </div>
        </div>
        
        <div className="glass" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ backgroundColor: 'rgba(36, 157, 143, 0.12)', padding: '12px', borderRadius: '12px', color: '#249D8F' }}>
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500' }}>Resolved / Closed</div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: '#249D8F' }}>{stats.resolved}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        
        {/* Left column: Complaint List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>Your Complaint History</h2>
            <button 
              onClick={fetchComplaints} 
              className="btn btn-secondary" 
              style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? 'spin-anim' : ''} /> Refresh
            </button>
          </div>

          {loading && complaints.length === 0 ? (
            [1, 2].map(n => <div key={n} className="glass shimmer" style={{ height: '80px', borderRadius: '12px' }}></div>)
          ) : complaints.length === 0 ? (
            <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <FileText size={40} style={{ margin: '0 auto 12px auto', opacity: 0.3 }} />
              <h3 style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '4px' }}>No complaints filed yet</h3>
              <p style={{ fontSize: '13px', margin: 0 }}>Use the form on the right to file a new maintenance request.</p>
            </div>
          ) : (
            complaints.map((c) => {
              const isOpen = expandedComplaint === c.id;
              return (
                <div 
                  key={c.id} 
                  className={`glass ${c.isOverdue ? 'overdue-glow' : ''}`} 
                  style={{ padding: '16px 20px', transition: 'all 0.2s' }}
                >
                  <div 
                    onClick={() => toggleExpand(c.id)} 
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, marginRight: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                        <span className={`badge badge-${c.priority.toLowerCase()}`}>{c.priority} Priority</span>
                        {c.isOverdue && (
                          <span className="badge" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertTriangle size={10} /> Overdue
                          </span>
                        )}
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          Filed on {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '4px' }}>{c.title}</h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>Category: {c.category}</div>
                    </div>
                    <div>
                      {isOpen ? <ChevronUp size={20} style={{ color: 'var(--text-secondary)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-secondary)' }} />}
                    </div>
                  </div>

                  {/* Expanded Timeline and details */}
                  {isOpen && (
                    <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px', animation: 'slideIn 0.2s' }}>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: c.photoUrl ? '1fr 150px' : '1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                          <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Description</h4>
                          <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{c.description}</p>
                        </div>
                        {c.photoUrl && (
                          <div>
                            <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>Attachment</h4>
                            <a href={`${API_BASE_URL}${c.photoUrl}`} target="_blank" rel="noopener noreferrer">
                              <img 
                                src={`${API_BASE_URL}${c.photoUrl}`} 
                                alt={c.title}
                                style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'block' }}
                              />
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Timeline */}
                      <div style={{ borderTop: '1px solid rgba(0,0,0,0.04)', paddingTop: '16px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>Timeline & Updates</h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '16px', borderLeft: '2px solid var(--border-color)', position: 'relative' }}>
                          {c.history.map((h, i) => (
                            <div key={h.id} style={{ position: 'relative' }}>
                              {/* Dot */}
                              <div style={{
                                position: 'absolute',
                                left: '-23px',
                                top: '4px',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: h.status === 'RESOLVED' ? 'var(--success)' : h.status === 'IN_PROGRESS' ? 'var(--warning)' : 'var(--danger)',
                                border: '3px solid var(--bg-color)'
                              }} />
                              
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                  {h.status}
                                </span>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                  {new Date(h.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                                </span>
                              </div>
                              
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: h.note ? '6px' : '0' }}>
                                Action by: <strong>{h.actorName}</strong>
                              </div>

                              {h.note && (
                                <div style={{ 
                                  fontSize: '12px', 
                                  color: 'var(--text-secondary)', 
                                  background: 'rgba(0,0,0,0.02)', 
                                  padding: '8px 12px', 
                                  borderRadius: '6px', 
                                  border: '1px solid var(--border-color)',
                                  fontStyle: 'italic'
                                }}>
                                  "{h.note}"
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Right column: Submit Complaint Form */}
        <div className="glass" style={{ padding: '24px', position: 'sticky', top: '24px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={20} style={{ color: 'var(--primary)' }} />
            File Maintenance Request
          </h2>

          {submitSuccess && (
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--success-bg)',
              color: 'var(--success)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle2 size={16} />
              Complaint submitted successfully!
            </div>
          )}

          {error && !submitSuccess && (
            <div style={{
              padding: '12px',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '16px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleCreateComplaint} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Complaint Subject
              </label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Broken elevator in Block B" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                maxLength={80}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Category
              </label>
              <select 
                className="input-field"
                value={category}
                onChange={e => setCategory(e.target.value)}
                style={{ appearance: 'none', cursor: 'pointer', background: 'transparent' }}
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Security">Security</option>
                <option value="Cleanliness">Cleanliness</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Issue Details
              </label>
              <textarea 
                className="input-field" 
                placeholder="Describe the complaint in detail..." 
                rows={4}
                style={{ resize: 'none' }}
                value={description}
                onChange={e => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Supporting Photo (Optional)
              </label>
              <div 
                style={{
                  border: '1px dashed var(--border-color)',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  backgroundColor: 'rgba(0,0,0,0.01)',
                  position: 'relative',
                  cursor: 'pointer'
                }}
              >
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    width: '100%', height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                
                {photoPreview ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={photoPreview} 
                      alt="Preview" 
                      style={{ height: '70px', objectFit: 'contain', borderRadius: '4px', border: '1px solid var(--border-color)' }} 
                    />
                    <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{photo.name}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                    <ImageIcon size={28} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '12px' }}>Click to select/drag image photo</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Supports JPG, PNG, WEBP up to 5MB</span>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? 'Submitting...' : 'File Request'}
            </button>
          </form>
        </div>

      </div>

      <style>{`
        .spin-anim {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
