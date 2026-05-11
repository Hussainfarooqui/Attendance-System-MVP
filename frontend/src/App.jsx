import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import UserManagement from './pages/admin/UserManagement';
import StudentEnrollment from './pages/admin/StudentEnrollment';
import CourseManagement from './pages/admin/CourseManagement';
import AcademicEnrollment from './pages/admin/AcademicEnrollment';
import CourseList from './pages/faculty/CourseList';
import AttendanceSession from './pages/faculty/AttendanceSession';
import Reports from './pages/faculty/Reports';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', height:'100vh' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/" />;
  return children;
};

const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const logoUrl = "https://iqra.edu.pk/wp-content/uploads/2025/08/LOGO-IU-01-2048x495-1.png";

  return (
    <div className="layout">
      {/* Sidebar Section */}
      <div className="sidebar">
        <div className="sidebar-header">
          <img src={logoUrl} alt="Iqra University" className="sidebar-logo" />
        </div>
        
        <nav className="sidebar-nav">
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px', paddingLeft: '16px' }}>
            {user.role} Dashboard
          </div>
          
          {user.role === 'Admin' && (
            <>
              <NavLink to="/admin/users" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                <span>User Management</span>
              </NavLink>
              <NavLink to="/admin/students" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                <span>Biometric Enrollment</span>
              </NavLink>
              <NavLink to="/admin/academic" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                <span>Academic Enrollment</span>
              </NavLink>
              <NavLink to="/admin/courses" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                <span>Course Management</span>
              </NavLink>
            </>
          )}

          {user.role === 'Faculty' && (
            <>
              <NavLink to="/faculty/courses" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                <span>My Courses</span>
              </NavLink>
              <NavLink to="/faculty/reports" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>
                <span>Attendance Reports</span>
              </NavLink>
            </>
          )}

          <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              className="btn btn-gold"
              onClick={logout}
              style={{ width: '100%', borderRadius: '8px' }}
            >
              Sign Out
            </button>
          </div>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <div style={{ padding: '40px' }}>
                  <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Welcome, {JSON.parse(localStorage.getItem('user') || '{}')?.full_name}</h1>
                  <p style={{ color: '#64748B' }}>IQRA University AI Attendance System — {new Date().toLocaleDateString('en-GB', { dateStyle: 'full' })}</p>
                  
                  <div className="glass-card" style={{ marginTop: '40px', borderLeft: '6px solid var(--iqra-gold)' }}>
                    <h3>System Overview</h3>
                    <p style={{ marginTop: '10px', color: '#475569' }}>
                      Please select a module from the sidebar to manage university records, enroll students, or track attendance.
                    </p>
                  </div>
                </div>
              </Layout>
            </ProtectedRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/users" element={
            <ProtectedRoute role="Admin"><Layout><UserManagement /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/students" element={
            <ProtectedRoute role="Admin"><Layout><StudentEnrollment /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/academic" element={
            <ProtectedRoute role="Admin"><Layout><AcademicEnrollment /></Layout></ProtectedRoute>
          } />
          <Route path="/admin/courses" element={
            <ProtectedRoute role="Admin"><Layout><CourseManagement /></Layout></ProtectedRoute>
          } />

          {/* Faculty Routes */}
          <Route path="/faculty/courses" element={
            <ProtectedRoute role="Faculty"><Layout><CourseList /></Layout></ProtectedRoute>
          } />
          <Route path="/faculty/sessions/:sessionId" element={
            <ProtectedRoute role="Faculty"><Layout><AttendanceSession /></Layout></ProtectedRoute>
          } />
          <Route path="/faculty/reports" element={
            <ProtectedRoute role="Faculty"><Layout><Reports /></Layout></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
