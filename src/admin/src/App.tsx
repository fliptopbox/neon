import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Venues from './pages/Venues';
import VenueTags from './pages/VenueTags';
import Calendar from './pages/Calendar';
import Models from './pages/Models';
import Artists from './pages/Artists';
import Users from './pages/Users';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/venue-tags" element={<VenueTags />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/models" element={<Models />} />
              <Route path="/artists" element={<Artists />} />
              <Route path="/users" element={<Users />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
