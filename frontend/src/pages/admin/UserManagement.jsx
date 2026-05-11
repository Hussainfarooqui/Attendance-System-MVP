import React, { useState, useEffect } from 'react';
import axios from 'axios';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'Faculty' });

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
      alert("Failed to create user");
    }
  };

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>User Management</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add User</button>
      </div>

      <div className="glass-card" style={{ marginTop: '30px', padding: '20px' }}>
        <table className="table-container">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td><span style={{ padding: '4px 8px', borderRadius: '4px', background: u.role === 'Admin' ? '#ffe8e8' : '#e8f5ff', color: u.role === 'Admin' ? '#d9534f' : '#003366' }}>{u.role}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ padding: '30px', width: '400px', background: 'white' }}>
            <h2>Add New User</h2>
            <form onSubmit={handleCreate} style={{ marginTop: '20px' }}>
              <input 
                placeholder="Full Name" 
                style={{ width: '100%', padding: '10px', marginBottom: '10px' }} 
                onChange={e => setFormData({...formData, full_name: e.target.value})}
                required
              />
              <input 
                type="email" 
                placeholder="Email Address" 
                style={{ width: '100%', padding: '10px', marginBottom: '10px' }} 
                onChange={e => setFormData({...formData, email: e.target.value})}
                required
              />
              <input 
                type="password" 
                placeholder="Password" 
                style={{ width: '100%', padding: '10px', marginBottom: '10px' }} 
                onChange={e => setFormData({...formData, password: e.target.value})}
                required
              />
              <select 
                style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
                onChange={e => setFormData({...formData, role: e.target.value})}
                value={formData.role}
              >
                <option value="Faculty">Faculty</option>
                <option value="Admin">Admin</option>
              </select>
              
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
