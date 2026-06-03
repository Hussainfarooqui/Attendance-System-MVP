import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [week, setWeek] = useState(1);
  const [sessionOfWeek, setSessionOfWeek] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('/api/faculty/courses');
      setCourses(response.data);
    } catch (err) {
      console.error("Failed to fetch courses");
    }
  };

  const handleStartAttendance = async (e) => {
    e.preventDefault();
    if (!selectedCourse) return;

    // Calculate overall session number
    const sessionNum = selectedCourse.course_type === '1.5hr'
      ? (parseInt(week) - 1) * 2 + parseInt(sessionOfWeek)
      : parseInt(week);

    try {
      const response = await axios.post('/api/faculty/sessions/start', {
        course_id: selectedCourse.id,
        room_id: 1, // Mock room for MVP
        week_number: parseInt(week),
        session_number: sessionNum
      });
      setShowModal(false);
      navigate(`/faculty/sessions/${response.data.session_id}`);
    } catch (err) {
      alert("Failed to start session");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCourse(null);
    setWeek(1);
    setSessionOfWeek(1);
  };

  return (
    <div className="main-content">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px' }}>Faculty Portal</h1>
        <p style={{ color: 'var(--text-muted)' }}>Assigned Courses & Session Management</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {courses.map(course => (
          <div key={course.id} className="glass-card" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            borderTop: '5px solid var(--iqra-gold)'
          }}>
            <div style={{ flex: 1, marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', color: 'var(--iqra-blue)' }}>{course.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px', fontWeight: 600 }}>{course.code}</p>
              
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <span className="badge" style={{ background: '#F1F5F9', color: '#475569' }}>
                  {course.course_type === '1.5hr' ? '1.5-Hour (2/wk)' : '3-Hour (1/wk)'}
                </span>
                <span className="badge" style={{ background: '#F1F5F9', color: '#475569' }}>
                  {course.semester}
                </span>
              </div>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', borderRadius: '8px' }}
              onClick={() => { setSelectedCourse(course); setShowModal(true); }}
            >
              Initialize AI Attendance
            </button>
          </div>
        ))}
        
        {courses.length === 0 && (
          <div className="glass-card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '16px' }}>No courses are currently assigned to your account.</p>
          </div>
        )}
      </div>

      {showModal && selectedCourse && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: '8px' }}>Start Attendance Session</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>
              Course: <strong>{selectedCourse.name}</strong> ({selectedCourse.code})
            </p>

            <form onSubmit={handleStartAttendance}>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Select Week</label>
                <select 
                  className="input-field" 
                  value={week} 
                  onChange={(e) => setWeek(e.target.value)}
                  required
                >
                  {Array.from({ length: 16 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Week {w}</option>
                  ))}
                </select>
              </div>

              {selectedCourse.course_type === '1.5hr' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>Select Session of the Week</label>
                  <select 
                    className="input-field" 
                    value={sessionOfWeek} 
                    onChange={(e) => setSessionOfWeek(e.target.value)}
                    required
                  >
                    <option value="1">Session 1 (e.g. Mon/Tue)</option>
                    <option value="2">Session 2 (e.g. Wed/Thu)</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                  Start Session
                </button>
                <button type="button" className="btn" style={{ flex: 1, border: '1px solid var(--border)' }} onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' };

export default CourseList;
