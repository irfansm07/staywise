import React, { useState, useEffect } from 'react';
import { LogOut, Filter, ShieldAlert, Clock, CheckCircle2, ChevronRight, AlertTriangle, Settings, Save, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function AdminDashboard({ user, token, onLogout }) {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Filter state
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterOverdue, setFilterOverdue] = useState(false);

  // System Settings state
  const [overdueDays, setOverdueDays] = useState('5');
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [settingSuccess, setSettingSuccess] = useState(false);

  // Ticket action state
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actionStatus, setActionStatus] = useState('');
  const [actionPriority, setActionPriority] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [updatingTicket, setUpdatingTicket] = useState(false);
  const [ticketError, setTicketError] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/stats/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setOverdueDays(String(data.overdueThresholdDays));
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchComplaints = async () => {
    setLoading(true);
    setError('');
    
    // Build query params
    const params = new URLSearchParams();
    if (filterCategory) params.append('category', filterCategory);
    if (filterStatus) params.append('status', filterStatus);
    if (filterDate) params.append('date', filterDate);
    if (filterOverdue) params.append('showOverdueOnly', 'true');

    try {
      const res = await fetch(`${API_BASE_URL}/api/complaints/admin/list?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      } else {
        setError('Failed to fetch complaints list.');
      }
    } catch (err) {
      setError('Connection error. Failed to connect to API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [filterCategory, filterStatus, filterDate, filterOverdue]);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    setUpdatingSettings(true);
    setSettingSuccess(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/complaints/settings/overdue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ days: parseInt(overdueDays, 10) })
      });

      if (res.ok) {
        setSettingSuccess(true);
        fetchStats();      // Refresh threshold & overdue calculations
        fetchComplaints(); // Refresh overdue flags on list
        setTimeout(() => setSettingSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Settings update error:', err);
    } finally {
      setUpdatingSettings(false);
    }
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setActionStatus(ticket.status);
    setActionPriority(ticket.priority);
    setActionNote('');
    setTicketError('');
    setTicketSuccess(false);
  };

  const handleTicketUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setUpdatingTicket(true);
    setTicketError('');
    setTicketSuccess(false);

    try {
      // 1. Update priority if changed
      if (actionPriority !== selectedTicket.priority) {
        const pRes = await fetch(`${API_BASE_URL}/api/complaints/update-priority/${selectedTicket.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ priority: actionPriority })
        });
        if (!pRes.ok) {
          const err = await pRes.json();
          throw new Error(err.error || 'Failed to update priority');
        }
      }

      // 2. Update status if changed (and optionally note)
      if (actionStatus !== selectedTicket.status) {
        const sRes = await fetch(`${API_BASE_URL}/api/complaints/update-status/${selectedTicket.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: actionStatus, note: actionNote })
        });
        if (!sRes.ok) {
          const err = await sRes.json();
          throw new Error(err.error || 'Failed to update status');
        }
      }

      setTicketSuccess(true);
      fetchStats();
      fetchComplaints();
      
      // Update local detailed ticket view
      const refreshedRes = await fetch(`${API_BASE_URL}/api/complaints/admin/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (refreshedRes.ok) {
        const allList = await refreshedRes.json();
        const updatedObj = allList.find(t => t.id === selectedTicket.id);
        if (updatedObj) {
          setSelectedTicket(updatedObj);
          setActionStatus(updatedObj.status);
          setActionPriority(updatedObj.priority);
          setActionNote('');
        }
      }

      setTimeout(() => setTicketSuccess(false), 3000);
    } catch (err) {
      setTicketError(err.message || 'Failed to save changes.');
    } finally {
      setUpdatingTicket(false);
    }
  };

  // Helper to draw category percentage bars
  const renderCategoryStats = () => {
    if (!stats || !stats.byCategory) return null;
    const categories = Object.keys(stats.byCategory);
    const maxVal = Math.max(...Object.values(stats.byCategory), 1);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
        {categories.map(cat => {
          const count = stats.byCategory[cat];
          const pct = Math.round((count / (stats.totalComplaints || 1)) * 100);
          return (
            <div key={cat}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-primary)' }}>{cat}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{count} ({pct}%)</span>
              </div>
              <div style={{ height: '6px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${(count/maxVal)*100}%`, height: '100%', backgroundColor: 'var(--text-secondary)', borderRadius: '3px', transition: 'width 0.4s' }}></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="dashboard-layout">
      
      {/* Left Column: Management Hub */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Statistics Banner */}
        {stats && (
          <div className="stats-grid">
            <div className="glass" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#249D8F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>All Tickets</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#249D8F', marginTop: '4px' }}>{stats.totalComplaints}</div>
            </div>
            
            <div className="glass" style={{ padding: '16px', borderColor: 'rgba(231, 111, 81, 0.2)', backgroundColor: stats.overdueCount > 0 ? 'rgba(231, 111, 81, 0.06)' : 'var(--card-bg)' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#E76F51', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertTriangle size={12} /> Overdue
              </div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#E76F51', marginTop: '4px' }}>{stats.overdueCount}</div>
            </div>
            
            <div className="glass" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#C49B20', textTransform: 'uppercase', letterSpacing: '0.05em' }}>In Progress</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#E9C46A', marginTop: '4px' }}>{stats.byStatus.IN_PROGRESS}</div>
            </div>

            <div className="glass" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#249D8F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resolved</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#249D8F', marginTop: '4px' }}>{stats.byStatus.RESOLVED}</div>
            </div>
          </div>
        )}

        {/* Filter Toolbar */}
        <div className="glass" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <Filter size={16} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>Filter Complaints</h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Category</label>
              <select className="input-field" style={{ padding: '8px 12px' }} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Security">Security</option>
                <option value="Cleanliness">Cleanliness</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Status</label>
              <select className="input-field" style={{ padding: '8px 12px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved (Closed)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Filed On/After</label>
              <input 
                type="date" 
                className="input-field" 
                style={{ padding: '7px 12px' }} 
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input 
                type="checkbox"
                checked={filterOverdue}
                onChange={e => setFilterOverdue(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: 'var(--danger)' }}
              />
              <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>Show Overdue Tickets Only</span>
            </label>

            <button 
              onClick={() => {
                setFilterCategory('');
                setFilterStatus('');
                setFilterDate('');
                setFilterOverdue(false);
              }}
              style={{
                background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer'
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Complaints Manager Queue */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Complaints Processing Queue
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-muted)' }}>({complaints.length} found)</span>
          </h2>

          {loading ? (
            [1, 2].map(n => <div key={n} className="glass shimmer" style={{ height: '90px', borderRadius: '12px' }}></div>)
          ) : complaints.length === 0 ? (
            <div className="glass" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={32} style={{ margin: '0 auto 8px auto', color: 'var(--success)', opacity: 0.8 }} />
              <p style={{ margin: 0, fontSize: '14px' }}>No matching complaints found.</p>
            </div>
          ) : (
            complaints.map(t => (
              <div 
                key={t.id} 
                onClick={() => handleSelectTicket(t)}
                className={`glass-interactive ${t.isOverdue ? 'overdue-glow' : ''} ${selectedTicket?.id === t.id ? 'active-ticket-glow' : ''}`}
                style={{ 
                  padding: '16px 20px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  borderLeft: selectedTicket?.id === t.id ? '4px solid var(--primary)' : t.isOverdue ? '4px solid var(--danger)' : '1px solid var(--border-color)',
                  position: 'relative'
                }}
              >
                <div style={{ flex: 1, marginRight: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                    <span className={`badge badge-${t.status.toLowerCase()}`}>{t.status}</span>
                    <span className={`badge badge-${t.priority.toLowerCase()}`}>{t.priority}</span>
                    {t.isOverdue && (
                      <span className="badge" style={{ backgroundColor: 'var(--danger-bg)', color: 'var(--danger)', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        <AlertTriangle size={8} /> Overdue
                      </span>
                    )}
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {new Date(t.createdAt).toLocaleDateString()} by {t.resident?.name}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{t.title}</h3>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '450px', marginTop: '2px' }}>
                    {t.description}
                  </div>
                </div>
                <div>
                  <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Right Column: Settings & Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '24px' }}>
        
        {/* Ticket Details/Action Panel */}
        {selectedTicket ? (
          <div className="glass" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)', margin: 0 }}>Ticket Details</h3>
              <button 
                onClick={() => setSelectedTicket(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}
              >
                Close Panel
              </button>
            </div>

            <div style={{ backgroundColor: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>Resident Submitter</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedTicket.resident?.name}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedTicket.resident?.email}</div>
              {(selectedTicket.resident?.societyName || selectedTicket.resident?.apartmentName || selectedTicket.resident?.flatNumber || selectedTicket.resident?.phoneNumber) && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border-color)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                  {selectedTicket.resident?.societyName && (
                    <div><span style={{ color: 'var(--text-muted)' }}>Society:</span> <strong>{selectedTicket.resident.societyName}</strong></div>
                  )}
                  {(selectedTicket.resident?.apartmentName || selectedTicket.resident?.flatNumber) && (
                    <div><span style={{ color: 'var(--text-muted)' }}>Flat:</span> <strong>{selectedTicket.resident.apartmentName || ''} #{selectedTicket.resident.flatNumber || ''}</strong></div>
                  )}
                  {selectedTicket.resident?.phoneNumber && (
                    <div><span style={{ color: 'var(--text-muted)' }}>Phone:</span> <strong>{selectedTicket.resident.phoneNumber}</strong></div>
                  )}
                  {selectedTicket.resident?.occupancyType && (
                    <div><span style={{ color: 'var(--text-muted)' }}>Type:</span> <strong>{selectedTicket.resident.occupancyType === 'TENANT' ? 'Tenant' : 'Owner'}</strong></div>
                  )}
                </div>
              )}
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Subject</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>{selectedTicket.title}</div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Description</div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4', maxHeight: '100px', overflowY: 'auto' }}>
                {selectedTicket.description}
              </p>
            </div>

            {selectedTicket.photoUrl && (
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Attachment</div>
                <a href={`${API_BASE_URL}${selectedTicket.photoUrl}`} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={`${API_BASE_URL}${selectedTicket.photoUrl}`} 
                    alt="attachment" 
                    style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-color)' }}
                  />
                </a>
              </div>
            )}

            {/* Action Form */}
            {selectedTicket.status === 'RESOLVED' ? (
              <div style={{ backgroundColor: 'var(--success-bg)', border: '1px solid rgba(16,185,129,0.2)', padding: '12px', borderRadius: '8px', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <CheckCircle2 size={16} />
                Complaint has been resolved and closed.
              </div>
            ) : (
              <form onSubmit={handleTicketUpdateSubmit} style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>Process Ticket Action</h4>

                {ticketSuccess && (
                  <div style={{ padding: '8px 12px', background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '6px', fontSize: '12px' }}>
                    Changes saved successfully!
                  </div>
                )}

                {ticketError && (
                  <div style={{ padding: '8px 12px', background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '6px', fontSize: '12px' }}>
                    {ticketError}
                  </div>
                )}

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Set Priority</label>
                  <select className="input-field" style={{ padding: '8px 12px', fontSize: '13px' }} value={actionPriority} onChange={e => setActionPriority(e.target.value)}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Set Status</label>
                  <select className="input-field" style={{ padding: '8px 12px', fontSize: '13px' }} value={actionStatus} onChange={e => setActionStatus(e.target.value)}>
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved (Closes Ticket)</option>
                  </select>
                </div>

                {actionStatus !== selectedTicket.status && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Status Update Note</label>
                    <textarea 
                      className="input-field" 
                      placeholder="e.g. Assigned technician John. Expected completion Friday."
                      rows={3}
                      style={{ resize: 'none', fontSize: '13px' }}
                      value={actionNote}
                      onChange={e => setActionNote(e.target.value)}
                    ></textarea>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }} disabled={updatingTicket}>
                  {updatingTicket ? 'Saving changes...' : 'Apply Update'}
                </button>
              </form>
            )}

            {/* Logs/Timeline preview */}
            <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: '12px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '10px' }}>Audit Log & Note History</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '130px', overflowY: 'auto', paddingLeft: '8px' }}>
                {selectedTicket.history.map((h, i) => (
                  <div key={h.id} style={{ fontSize: '11px', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{h.status}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(h.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>by {h.actorName}</div>
                    {h.note && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '2px' }}>"{h.note}"</div>}
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* Empty details state */
          <div className="glass" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <ShieldAlert size={28} style={{ margin: '0 auto 8px auto', opacity: 0.3 }} />
            <p style={{ margin: 0, fontSize: '13px' }}>Select a ticket from the queue to process updates, change priorities, or view histories.</p>
          </div>
        )}

        {/* Categories visual chart widget */}
        {stats && (
          <div className="glass" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '14px' }}>Complaints By Category</h3>
            {renderCategoryStats()}
          </div>
        )}

        {/* Configuration Panel */}
        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Settings size={16} style={{ color: 'var(--primary)' }} />
            Threshold Escalation
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
            Define the number of open days before a ticket is flagged as Overdue and pinned to the top.
          </p>

          <form onSubmit={handleUpdateSettings} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Trigger Days</label>
              <input 
                type="number" 
                className="input-field" 
                min={0}
                style={{ padding: '8px 12px' }}
                value={overdueDays}
                onChange={e => setOverdueDays(e.target.value)}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-secondary" 
              style={{ height: '40px', padding: '0 16px', display: 'flex', gap: '4px' }}
              disabled={updatingSettings}
            >
              <Save size={14} />
              {updatingSettings ? 'Saving...' : 'Save'}
            </button>
          </form>

          {settingSuccess && (
            <div style={{ marginTop: '10px', color: 'var(--success)', fontSize: '11px', fontWeight: '600' }}>
              ✔ Overdue limit updated successfully!
            </div>
          )}
        </div>

      </div>

      {/* Mini Helper style */}
      <style>{`
        .active-ticket-glow {
          border-color: var(--primary) !important;
          background-color: rgba(36, 177, 177, 0.06) !important;
        }
      `}</style>
    </div>
  );
}
