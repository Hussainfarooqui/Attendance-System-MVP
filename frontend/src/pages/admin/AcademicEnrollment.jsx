import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AcademicEnrollment = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [eRes, sRes, cRes] = await Promise.all([
        axios.get('/api/admin/enrollments'),
        axios.get('/api/admin/students'),
        axios.get('/api/admin/courses')
      ]);
      setEnrollments(eRes.data);
      setStudents(sRes.data);
      setCourses(cRes.data);
    } catch (err) {
      console.error("Failed to fetch data");
    }
  };

  const handleEnroll = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !selectedCourse) return;

    try {
      const res = await axios.post('/api/admin/enroll-academic', {
        student_id: selectedStudent,
        course_id: parseInt(selectedCourse)
      });
      setMsg(res.data.message);
      fetchData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg("Enrollment failed");
      setTimeout(() => setMsg(''), 3000);
    }
  };

  const enrollAllInAll = async () => {
    if (!window.confirm("Are you sure you want to enroll ALL students in ALL courses?")) return;
    setMsg("Processing bulk enrollment...");
    try {
      for (const student of students) {
        for (const course of courses) {
          await axios.post('/api/admin/enroll-academic', {
            student_id: student.id,
            course_id: course.id
          });
        }
      }
      setMsg("Bulk enrollment completed successfully!");
      fetchData();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg("Bulk enrollment encountered errors");
      setTimeout(() => setMsg(''), 3000);
    }
  };

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Academic Enrollment</h1>
        <button className="btn" onClick={enrollAllInAll} style={{ backgroundColor: '#2e7d32', color: 'white' }}>
          Enroll All in All Courses
        </button>
      </div>

      {msg && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          borderRadius: '8px', 
          background: msg.includes('fail') ? '#ffebee' : '#e8f5e9',
          color: msg.includes('fail') ? '#c62828' : '#2e7d32'
        }}>
          {msg}
        </div>
      )}

      <div className="glass-card" style={{ marginTop: '30px', padding: '20px' }}>
        <h3>Quick Enrollment</h3>
        <form onSubmit={handleEnroll} style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
          <select 
            className="input-field" 
            style={{ flex: 1, padding: '10px' }}
            value={selectedStudent}
            onChange={e => setSelectedStudent(e.target.value)}
            required
          >
            <option value="">Select Student</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.id})</option>)}
          </select>

          <select 
            className="input-field" 
            style={{ flex: 1, padding: '10px' }}
            value={selectedCourse}
            onChange={e => setSelectedCourse(e.target.value)}
            required
          >
            <option value="">Select Course</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
          </select>

          <button type="submit" className="btn btn-primary">Enroll Student</button>
        </form>
      </div>

      <div className="glass-card" style={{ marginTop: '30px', padding: '20px' }}>
        <h3>Current Academic Enrollments</h3>
        <table className="table-container" style={{ marginTop: '15px' }}>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Student Name</th>
              <th>Course Code</th>
              <th>Course Name</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((e, index) => (
              <tr key={index}>
                <td>{e.student_id}</td>
                <td>{e.student_name}</td>
                <td>{e.course_code}</td>
                <td>{e.course_name}</td>
              </tr>
            ))}
            {enrollments.length === 0 && (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', color: '#999' }}>No academic enrollments found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AcademicEnrollment;
