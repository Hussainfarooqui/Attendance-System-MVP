import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CourseManagement = () => {
  const [courses, setCourses]   = useState([]);
  const [faculty, setFaculty]   = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(null); // holds course being assigned
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [newCourse, setNewCourse] = useState({ name: '', code: '', faculty_id: '', semester: '', department: '', section: '', course_type: '3hr', schedule_days: '', time_slot: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [cRes, fRes] = await Promise.all([
        axios.get('/api/admin/courses'),
        axios.get('/api/admin/users'),
      ]);
      setCourses(cRes.data);
      setFaculty(fRes.data.filter(u => u.role === 'FACULTY'));
    } catch (err) {
      console.error('Failed to load data', err);
    }
  };

  const flash = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/courses', {
        name: newCourse.name,
        code: newCourse.code,
        semester: newCourse.semester,
        department: newCourse.department,
        section: newCourse.section,
        course_type: newCourse.course_type,
        schedule_days: newCourse.schedule_days,
        time_slot: newCourse.time_slot,
        faculty_id: newCourse.faculty_id ? parseInt(newCourse.faculty_id) : null,
      });
      flash('Course created successfully!');
      setShowCreate(false);
      setNewCourse({ name: '', code: '', faculty_id: '', semester: '', department: '', section: '', course_type: '3hr', schedule_days: '', time_slot: '' });
      fetchAll();
    } catch (err) {
      flash(err.response?.data?.detail || 'Failed to create course');
    }
  };

  const handleAssign = async () => {
    if (!selectedFacultyId) return;
    try {
      const res = await axios.post('/api/admin/assign-course', {
        course_id: showAssign.id,
        faculty_id: parseInt(selectedFacultyId),
      });
      flash(res.data.message);
      setShowAssign(null);
      setSelectedFacultyId('');
      fetchAll();
    } catch (err) {
      flash(err.response?.data?.detail || 'Assignment failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course? This will remove all related sessions and attendance records.")) return;
    try {
      await axios.delete(`/api/admin/courses/${id}`);
      flash('Course deleted successfully!');
      fetchAll();
    } catch (err) {
      flash(err.response?.data?.detail || 'Failed to delete course');
    }
  };

  return (
    <div className="main-content">
      <div className="flex-between">
        <div>
          <h1>Course Management</h1>
          <p style={{ color: '#666' }}>Create courses and assign them to faculty members.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Course</button>
      </div>

      {msg && (
        <div style={{ marginTop: 16, padding: '10px 16px', borderRadius: 8,
          background: msg.includes('fail') || msg.includes('Failed') ? '#ffebee' : '#e8f5e9',
          color:      msg.includes('fail') || msg.includes('Failed') ? '#c62828' : '#2e7d32',
          fontWeight: 600 }}>
          {msg}
        </div>
      )}

      <div className="glass-card" style={{ marginTop: 24 }}>
        <table className="table-container">
          <thead>
            <tr>
              <th>#</th>
              <th>Code</th>
              <th>Course Name</th>
              <th>Sem/Dept/Sec</th>
              <th>Schedule</th>
              <th>Type</th>
              <th>Assigned Faculty</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999' }}>No courses yet. Click "+ New Course" to add one.</td></tr>
            )}
            {courses.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td><code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4 }}>{c.code}</code></td>
                <td><strong>{c.name}</strong></td>
                <td>{c.semester} / {c.department} / {c.section}</td>
                <td>
                  {c.schedule_days && c.time_slot ? (
                    <div style={{ fontSize: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{c.schedule_days}</div>
                      <div style={{ color: '#666' }}>{c.time_slot}</div>
                    </div>
                  ) : (
                    <span style={{ color: '#aaa', fontSize: '12px' }}>Not set</span>
                  )}
                </td>
                <td>{c.course_type}</td>
                <td>
                  <span style={{
                    padding: '4px 10px', borderRadius: 12,
                    background: c.faculty_name === 'Unassigned' ? '#fff3e0' : '#e8f5e9',
                    color:      c.faculty_name === 'Unassigned' ? '#e65100' : '#2e7d32',
                    fontWeight: 600, fontSize: 13,
                  }}>
                    {c.faculty_name === 'Unassigned' ? '⚠ Unassigned' : `✓ ${c.faculty_name}`}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: 13 }}
                      onClick={() => { setShowAssign(c); setSelectedFacultyId(c.faculty_id || ''); }}
                    >
                      Assign
                    </button>
                    <button
                      className="btn"
                      style={{ padding: '6px 14px', fontSize: 13, background: '#ff4d4d', color: 'white' }}
                      onClick={() => handleDelete(c.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: 20 }}>New Course</h2>
            <form onSubmit={handleCreate}>
              <label style={labelStyle}>Course Name</label>
              <input
                className="input-field"
                placeholder="e.g. Artificial Intelligence"
                style={{ marginBottom: 14 }}
                value={newCourse.name}
                onChange={e => setNewCourse({ ...newCourse, name: e.target.value })}
                required
              />
              <label style={labelStyle}>Course Code</label>
              <input
                className="input-field"
                placeholder="e.g. CS-401"
                style={{ marginBottom: 14 }}
                value={newCourse.code}
                onChange={e => setNewCourse({ ...newCourse, code: e.target.value })}
                required
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Semester</label>
                  <input className="input-field" placeholder="e.g. Spring 26" style={{ marginBottom: 14 }} value={newCourse.semester} onChange={e => setNewCourse({ ...newCourse, semester: e.target.value })} required />
                </div>
                <div>
                  <label style={labelStyle}>Department</label>
                  <input className="input-field" placeholder="e.g. CS" style={{ marginBottom: 14 }} value={newCourse.department} onChange={e => setNewCourse({ ...newCourse, department: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Section</label>
                  <input className="input-field" placeholder="e.g. A" style={{ marginBottom: 14 }} value={newCourse.section} onChange={e => setNewCourse({ ...newCourse, section: e.target.value })} required />
                </div>
                <div>
                  <label style={labelStyle}>Course Type</label>
                  <select className="input-field" style={{ marginBottom: 14 }} value={newCourse.course_type} onChange={e => setNewCourse({ ...newCourse, course_type: e.target.value, schedule_days: '' })}>
                    <option value="3hr">3-Hour</option>
                    <option value="1.5hr">1.5-Hour</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>Schedule Days</label>
                  <select className="input-field" style={{ marginBottom: 14 }} value={newCourse.schedule_days} onChange={e => setNewCourse({ ...newCourse, schedule_days: e.target.value })} required>
                    <option value="">— Select Days —</option>
                    {newCourse.course_type === '1.5hr' ? (
                      <>
                        <option value="MON/WED">MON / WED</option>
                        <option value="TUE/THU">TUE / THU</option>
                      </>
                    ) : (
                      <>
                        <option value="MON">Monday</option>
                        <option value="TUE">Tuesday</option>
                        <option value="WED">Wednesday</option>
                        <option value="THU">Thursday</option>
                        <option value="FRI">Friday</option>
                        <option value="SAT">Saturday</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Time Slot</label>
                  <select className="input-field" style={{ marginBottom: 14 }} value={newCourse.time_slot} onChange={e => setNewCourse({ ...newCourse, time_slot: e.target.value })} required>
                    <option value="">— Select Time —</option>
                    <option value="08:30-11:20">08:30 - 11:20</option>
                    <option value="11:35-14:20">11:35 - 14:20</option>
                    <option value="13:00-14:20">13:00 - 14:20</option>
                    <option value="14:30-15:50">14:30 - 15:50</option>
                    <option value="16:00-17:20">16:00 - 17:20</option>
                  </select>
                </div>
              </div>
              <label style={labelStyle}>Assign Faculty (optional)</label>
              <select className="input-field" value={newCourse.faculty_id}
                style={{ marginBottom: 14 }}
                onChange={e => setNewCourse({ ...newCourse, faculty_id: e.target.value })}>
                <option value="">— Assign later —</option>
                {faculty.map(f => <option key={f.id} value={f.id}>{f.full_name} ({f.email})</option>)}
              </select>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="submit" className="btn btn-primary">Create</button>
                <button type="button" className="btn" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssign && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 style={{ marginBottom: 8 }}>Assign Faculty</h2>
            <p style={{ color: '#555', marginBottom: 20 }}>
              Course: <strong>{showAssign.name}</strong> ({showAssign.code})
            </p>

            <label style={labelStyle}>Select Faculty Member</label>
            <select className="input-field" value={selectedFacultyId}
              style={{ marginBottom: 14 }}
              onChange={e => setSelectedFacultyId(e.target.value)}>
              <option value="">— Select —</option>
              {faculty.map(f => (
                <option key={f.id} value={f.id}>{f.full_name} ({f.email})</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-primary" onClick={handleAssign} disabled={!selectedFacultyId}>
                Confirm Assignment
              </button>
              <button className="btn" onClick={() => { setShowAssign(null); setSelectedFacultyId(''); }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: 4, fontWeight: 600, fontSize: 13, color: '#555' };

export default CourseManagement;
