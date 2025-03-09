// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Context
import { AuthProvider, AuthContext } from './context/AuthContext';

// Root redirect component that uses the auth context
const RootRedirect = () => {
  const { user } = React.useContext(AuthContext);
  
  // Redirect based on user role
  if (!user) return <Navigate to="/login" replace />;
  return user.role === 'admin' ? 
    <Navigate to="/admin" replace /> : 
    <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <AuthProvider>
        <Router>
          <Navbar />
          <main className="container mx-auto py-4">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}>
                  <AdminPanel />
                </ProtectedRoute>
              } />
              <Route path="/" element={<RootRedirect />} />
            </Routes>
          </main>
        </Router>
      </AuthProvider>
    </div>
  );
}

export default App;