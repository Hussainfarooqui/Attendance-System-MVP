import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'FACULTY', department_code: '' });

  const openModal = () => {
    setFormData({ full_name: '', email: '', password: '', role: 'FACULTY', department_code: '' });
    setShowModal(true);
  };

  const hasAssociateDean = users.some(u => u.role === 'ASSOCIATE_DEAN');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/admin/users');
      setUsers(response.data);
    } catch (err) {
      console.error("Failed to fetch users");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/admin/users', formData);
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create user");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`/api/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete user");
    }
  };

  return (
    <div className="main-content">
      <div className="flex-between">
        <h1>User Management</h1>
        <button className="btn btn-primary" onClick={openModal}>+ Add User</button>
      </div>

      <div className="glass-card" style={{ marginTop: '30px' }}>
        <table className="table-container">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    background: u.role === 'ADMIN' ? '#ffe8e8' : (u.role === 'HOD' || u.role === 'DEAN' || u.role === 'ASSOCIATE_DEAN') ? '#e8fdf5' : '#e8f5ff', 
                    color: u.role === 'ADMIN' ? '#d9534f' : (u.role === 'HOD' || u.role === 'DEAN' || u.role === 'ASSOCIATE_DEAN') ? '#006633' : '#003366' 
                  }}>
                    {u.role.replace('_', ' ')} {u.department_code ? `(${u.department_code})` : ''}
                  </span>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(u.id)}
                    className="btn"
                    style={{ background: '#ff4d4d', color: 'white', padding: '5px 12px' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New User</h2>
            <form onSubmit={handleCreate} style={{ marginTop: '20px' }}>
              <input 
                className="input-field"
                placeholder="Full Name" 
                style={{ marginBottom: '10px' }} 
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                required
              />
              <input 
                className="input-field"
                type="email" 
                placeholder="Email Address" 
                style={{ marginBottom: '10px' }} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
              <input 
                className="input-field"
                type="password" 
                placeholder="Password" 
                style={{ marginBottom: '10px' }} 
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
              <select 
                className="input-field"
                style={{ marginBottom: '10px' }}
                onChange={e => setFormData({...formData, role: e.target.value})}
                value={formData.role}
              >
                <option value="FACULTY">Faculty Member</option>
                <option value="ADMIN">System Administrator</option>
                <option value="HOD">Head of Department (HOD)</option>
                <option value="DEAN">Dean</option>
                <option value="ASSOCIATE_DEAN" disabled={hasAssociateDean}>
                  Associate Dean {hasAssociateDean ? '(Already Exists)' : ''}
                </option>
              </select>

              {formData.role === 'HOD' && (
                <input 
                  className="input-field"
                  placeholder="Department Code (e.g. CS, EE)" 
                  style={{ marginBottom: '20px' }} 
                  value={formData.department_code}
                  onChange={e => setFormData({...formData, department_code: e.target.value})}
                  required
                />
              )}
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn btn-primary">Create User</button>
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
