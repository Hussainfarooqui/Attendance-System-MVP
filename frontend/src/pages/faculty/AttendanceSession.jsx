import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AttendanceSession = () => {
  const { sessionId } = useParams();
  const navigate      = useNavigate();
  const [results, setResults]         = useState([]);
  const [hitStatus, setHitStatus]     = useState({ hit1: false, hit2: false });
  const [overrideModal, setOverrideModal] = useState(null); // { studentId, fullName }
  const [overrideStatus, setOverrideStatus] = useState('Present');
  const [overrideReason, setOverrideReason] = useState('');
  const [loading, setLoading]         = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchResults();
    intervalRef.current = setInterval(fetchResults, 4000); // poll every 4 s
    return () => clearInterval(intervalRef.current);
  }, [sessionId]);

  // Derive hit status from results so it auto-updates
  useEffect(() => {
    const h1 = results.some(r => r.hit_1 !== null && r.hit_1 !== undefined);
    const h2 = results.some(r => r.hit_2 !== null && r.hit_2 !== undefined);
    setHitStatus({ hit1: h1, hit2: h2 });
  }, [results]);

  const fetchResults = async () => {
    try {
      const res = await axios.get(`/api/faculty/sessions/${sessionId}/results`);
      setResults(res.data);
      setLoading(false);
    } catch (err) {
      if (err.response?.status === 401) navigate('/login');
      setLoading(false);
    }
  };

  const handleOverrideSave = async () => {
    if (!overrideReason.trim()) {
      alert('Please enter a reason for the override.');
      return;
    }
    try {
      await axios.post('/api/faculty/attendance/override', {
        session_id: parseInt(sessionId),
        student_id: overrideModal.studentId,
        new_status: overrideStatus,
        reason: overrideReason,
      });
      setOverrideModal(null);
      setOverrideReason('');
      fetchResults();
    } catch (err) {
      alert(err.response?.data?.detail || 'Override failed');
    }
  };

  const presentCount = results.filter(r => r.status === 'Present').length;
  const absentCount  = results.filter(r => r.status === 'Absent').length;

  return (
    <div className="main-content">
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>Live Attendance Session</h1>
          <p style={{ color: 'var(--text-muted)' }}>Session ID: <strong>#{sessionId}</strong> — AI monitoring active</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/faculty/courses')}>
            ← Back to Courses
          </button>
          {hitStatus.hit2 && (
            <button 
              className="btn btn-gold" 
              onClick={() => navigate('/faculty/reports')}
              style={{ fontWeight: 700 }}
            >
              End Session & View Reports
            </button>
          )}
        </div>
      </div>

      {/* ── Completion Banner ── */}
      {hitStatus.hit2 && (
        <div className="glass-card" style={{ 
          marginBottom: '24px', 
          background: '#F0FDF4', 
          border: '1px solid #166534',
          color: '#166534',
          display: 'flex',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <strong>✅ AI Monitoring Complete!</strong> &nbsp; All hits are finished. You can now review the results and end the session.
        </div>
      )}

      {/* ── Hit Status Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
        <HitCard label="AI Hit 1" subtitle="T+30s (Arrival)" done={hitStatus.hit1} color="var(--iqra-blue-light)" />
        <HitCard label="AI Hit 2" subtitle="T+60s (Stability)" done={hitStatus.hit2} color="var(--iqra-red)" />
        <SummaryCard label="Total Present" value={presentCount} type="present" />
        <SummaryCard label="Total Absent"  value={absentCount}  type="absent" />
      </div>

      {/* ── Results Table ── */}
      <div className="glass-card" style={{ marginTop: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>Enrollment Results</h3>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Polling every 4s</span>
        </div>

        {loading && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>⏳ Waiting for hits to complete...</p>}

        {!loading && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: '18px', fontWeight: 600, color: 'var(--iqra-red)' }}>⚠️ No students enrolled in this course.</p>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
              Please enroll students from the Academic Enrollment module.
            </p>
          </div>
        )}

        {results.length > 0 && (
          <table className="table-container">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th style={{ textAlign: 'center' }}>Hit 1</th>
                <th style={{ textAlign: 'center' }}>Hit 2</th>
                <th>Final Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.student_id}>
                  <td><code style={{ background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px', fontSize: '13px' }}>{r.student_id}</code></td>
                  <td style={{ fontWeight: 500 }}>{r.full_name}</td>
                  <td style={{ textAlign: 'center' }}>
                    {hitStatus.hit1 ? (r.hit_1 ? '✅' : '❌') : <span style={{ color: '#CBD5E1' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {hitStatus.hit2 ? (r.hit_2 ? '✅' : '❌') : <span style={{ color: '#CBD5E1' }}>—</span>}
                  </td>
                  <td>
                    <StatusBadge status={r.status} isOverride={r.is_override} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn"
                      style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--border)' }}
                      onClick={() => {
                        setOverrideModal({ studentId: r.student_id, fullName: r.full_name });
                        setOverrideStatus(r.status === 'Present' ? 'Absent' : 'Present');
                      }}
                    >
                      Override
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Override Modal ── */}
      {overrideModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(10, 26, 51, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '32px', width: '480px', background: 'white' }}>
            <h2 style={{ marginBottom: '8px' }}>Manual Override</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
              Student: <strong>{overrideModal.fullName}</strong> ({overrideModal.studentId})
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>New Attendance Status</label>
              <select
                className="input-field"
                value={overrideStatus}
                onChange={e => setOverrideStatus(e.target.value)}
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
              </select>
            </div>

            <div style={{ marginBottom: '32px' }}>
              <label style={labelStyle}>Justification / Reason</label>
              <textarea
                placeholder="Briefly explain why you are overriding the AI decision..."
                className="input-field"
                style={{ height: '100px', resize: 'none' }}
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleOverrideSave}>Save Override</button>
              <button className="btn" style={{ flex: 1, border: '1px solid var(--border)' }} onClick={() => { setOverrideModal(null); setOverrideReason(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Sub-components ──────────────────────────────────────────────────────────

const HitCard = ({ label, subtitle, done, color }) => (
  <div className="glass-card" style={{ padding: '20px', borderTop: `4px solid ${color}` }}>
    <h4 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{label}</h4>
    <p style={{ margin: '4px 0', fontSize: '20px', fontWeight: 700, color: done ? 'var(--text-main)' : '#CBD5E1' }}>
      {done ? '✅ Complete' : '⏳ Pending'}
    </p>
    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>{subtitle}</p>
  </div>
);

const SummaryCard = ({ label, value, type }) => (
  <div className="glass-card" style={{ 
    padding: '20px', 
    background: type === 'present' ? '#F0FDF4' : '#FEF2F2',
    border: 'none'
  }}>
    <h4 style={{ margin: 0, fontSize: '14px', color: type === 'present' ? '#166534' : '#991B1B' }}>{label}</h4>
    <p style={{ margin: '4px 0', fontSize: '32px', fontWeight: 800, color: type === 'present' ? '#15803d' : '#b91c1c' }}>{value}</p>
  </div>
);

const StatusBadge = ({ status, isOverride }) => (
  <span className={`badge ${status === 'Present' ? 'badge-present' : 'badge-absent'}`}>
    {status} {isOverride && <span style={{ opacity: 0.7, fontWeight: 400, marginLeft: '4px' }}>• Manual</span>}
  </span>
);

const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' };

export default AttendanceSession;
