import React, { useState } from 'react';
import api from '../../api';

function BulkUpload() {
  const [file, setFile] = useState(null);
  const [uploadType, setUploadType] = useState('courses');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setMessage('');
    setErrors([]);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(`/api/bulk-upload/${uploadType}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(response.data.message);
      if (response.data.success === false && response.data.errors) {
        setErrors(response.data.errors);
      }
    } catch (err) {
      if (err.response?.data?.success === false && err.response?.data?.errors) {
         setMessage(err.response.data.message);
         setErrors(err.response.data.errors);
      } else {
         setMessage(err.response?.data?.detail || err.response?.data?.message || 'Error uploading file');
      }
    }
    setLoading(false);
  };

  return (
    <div className="page-container" style={{ padding: '40px' }}>
      <h2 style={{ marginBottom: '24px' }}>Bulk Upload</h2>
      <div className="glass-card" style={{ maxWidth: '600px', marginBottom: '24px' }}>
        <form onSubmit={handleUpload}>
          <div style={{ marginBottom: '16px' }}>
            <label>Upload Type</label>
            <select 
              value={uploadType} 
              onChange={(e) => setUploadType(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            >
              <option value="courses">Courses</option>
              <option value="students">Students</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          
          <div style={{ marginBottom: '16px' }}>
            <label>Select .xlsx File</label>
            <input 
              type="file" 
              accept=".xlsx" 
              onChange={(e) => setFile(e.target.files[0])}
              style={{ width: '100%', padding: '8px', marginTop: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
            />
          </div>

          <button type="submit" className="btn btn-gold" disabled={loading || !file}>
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      {message && (
        <div className="glass-card" style={{ marginBottom: '24px', borderLeft: errors.length ? '6px solid red' : '6px solid green' }}>
          <h4>Result</h4>
          <p style={{ marginTop: '8px' }}>{message}</p>
        </div>
      )}

      {errors.length > 0 && (
        <div className="glass-card">
          <h4 style={{ color: 'red', marginBottom: '16px' }}>Validation Errors</h4>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '8px' }}>Row</th>
                <th style={{ padding: '8px' }}>Error</th>
              </tr>
            </thead>
            <tbody>
              {errors.map((e, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '8px' }}>{e.row}</td>
                  <td style={{ padding: '8px', color: '#ef4444' }}>{e.error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default BulkUpload;
