import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const StudentEnrollment = () => {
  const [students, setStudents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [fullName, setFullName] = useState('');
  const [capturing, setCapturing] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [method, setMethod] = useState('camera'); // 'camera' or 'upload'
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/admin/students');
      setStudents(response.data);
    } catch (err) {
      console.error("Failed to fetch students");
    }
  };

  const startCamera = async () => {
    setMethod('camera');
    setCapturing(true);
    setPhoto(null);
    setUploadFile(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Could not access camera");
      setCapturing(false);
    }
  };

  const capturePhoto = () => {
    const context = canvasRef.current.getContext('2d');
    context.drawImage(videoRef.current, 0, 0, 640, 480);
    const data = canvasRef.current.toDataURL('image/jpeg');
    setPhoto(data);
    
    // Stop camera
    const stream = videoRef.current.srcObject;
    if (stream) {
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
    setCapturing(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMethod('upload');
      setUploadFile(file);
      setPhoto(URL.createObjectURL(file));
      setCapturing(false);
    }
  };

  const handleEnroll = async () => {
    if (!studentId || !fullName) {
      alert("Please enter both Student ID and Full Name");
      return;
    }

    const formData = new FormData();
    formData.append('student_id', studentId);
    formData.append('full_name', fullName);

    if (method === 'camera' && photo) {
      const res = await fetch(photo);
      const blob = await res.blob();
      formData.append('file', blob, 'enrollment.jpg');
    } else if (method === 'upload' && uploadFile) {
      formData.append('file', uploadFile);
    }

    try {
      await axios.post('/api/admin/enroll-student', formData);
      alert("Student enrolled successfully!");
      closeModal();
      fetchStudents();
    } catch (err) {
      alert("Enrollment failed: " + (err.response?.data?.detail || "Unknown error"));
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setStudentId('');
    setFullName('');
    setPhoto(null);
    setUploadFile(null);
    setCapturing(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Biometric Enrollment</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Student</button>
      </div>

      <div className="glass-card" style={{ marginTop: '30px', padding: '20px' }}>
        <table className="table-container">
          <thead>
            <tr>
              <th>ID</th>
              <th>Full Name</th>
              <th>Enrollment Date</th>
              <th>Biometric Status</th>
            </tr>
          </thead>
          <tbody>
            {students.map(s => (
              <tr key={s.id}>
                <td><code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4 }}>{s.id}</code></td>
                <td>{s.full_name}</td>
                <td>{new Date(s.enrollment_date).toLocaleDateString()}</td>
                <td>
                  {s.face_embedding ? (
                    <span style={{ color: '#2e7d32', fontWeight: 600 }}>✅ Captured</span>
                  ) : (
                    <span style={{ color: '#c62828', fontWeight: 600 }}>❌ Missing (Manual only)</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '30px', width: '500px', background: 'white', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '20px' }}>Student Enrollment</h2>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Student ID (Required)</label>
              <input 
                placeholder="e.g. 2021-IU-123" 
                style={inputStyle} 
                value={studentId} 
                onChange={e => setStudentId(e.target.value)} 
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Complete Name (Required)</label>
              <input 
                placeholder="e.g. John Doe" 
                style={inputStyle} 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
              />
            </div>

            <label style={labelStyle}>Face Capture (Optional)</label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              <button 
                className={`btn ${method === 'camera' ? 'btn-primary' : ''}`} 
                onClick={() => setMethod('camera')}
                style={{ flex: 1 }}
              >
                Use Camera
              </button>
              <button 
                className={`btn ${method === 'upload' ? 'btn-primary' : ''}`} 
                onClick={() => setMethod('upload')}
                style={{ flex: 1 }}
              >
                Upload Image
              </button>
            </div>

            <div style={{ width: '100%', height: '280px', background: '#f5f5f5', borderRadius: '8px', overflow: 'hidden', position: 'relative', border: '1px solid #ddd' }}>
              {method === 'camera' && (
                <>
                  {capturing && <video ref={videoRef} autoPlay style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  {photo && !capturing && <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  {!capturing && !photo && (
                    <div style={placeholderStyle}>
                      <button className="btn" onClick={startCamera}>Open Camera</button>
                    </div>
                  )}
                </>
              )}

              {method === 'upload' && (
                <>
                  {photo ? (
                    <img src={photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={placeholderStyle}>
                      <input type="file" id="file-upload" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
                      <button className="btn" onClick={() => document.getElementById('file-upload').click()}>Choose File</button>
                    </div>
                  )}
                </>
              )}
            </div>

            <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              {method === 'camera' && capturing && (
                <button className="btn btn-primary" onClick={capturePhoto}>Capture Face</button>
              )}
              {photo && (
                <button className="btn" onClick={() => { setPhoto(null); setUploadFile(null); if (method === 'camera') startCamera(); }}>
                  Clear / Reset
                </button>
              )}
              <div style={{ flex: 1 }}></div>
              <button className="btn btn-primary" onClick={handleEnroll}>
                {photo ? 'Save with Biometrics' : 'Save without Biometrics'}
              </button>
              <button className="btn" onClick={closeModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const inputStyle = { width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', boxSizing: 'border-box' };
const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: '600', color: '#555', fontSize: '13px' };
const placeholderStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column', color: '#999' };

export default StudentEnrollment;
