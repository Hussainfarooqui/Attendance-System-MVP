import React, { useState, useEffect } from 'react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/faculty/courses');
      setCourses(response.data);
    } catch (err) {
      console.error("Failed to fetch courses");
    }
  };

  const handleStartAttendance = async (courseId) => {
    try {
      const response = await api.post('/api/faculty/sessions/start', {
        course_id: courseId,
        room_id: 1, // Mock room for MVP
        week_number: 1,
        session_number: 1
      });
      navigate(`/faculty/sessions/${response.data.session_id}`);
    } catch (err) {
      alert("Failed to start session");
    }
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
                <span className="badge" style={{ background: '#F1F5F9', color: '#475569' }}>Slot: {course.slot}</span>
                <span className="badge" style={{ background: '#F1F5F9', color: '#475569' }}>Week 14</span>
              </div>
            </div>
            
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', borderRadius: '8px' }}
              onClick={() => handleStartAttendance(course.id)}
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
    </div>
  );
};

export default CourseList;
