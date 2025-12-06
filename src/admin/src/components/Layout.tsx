import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PlaceIcon from '@mui/icons-material/Place';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FaceIcon from '@mui/icons-material/Face';
import BrushIcon from '@mui/icons-material/Brush';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import './Layout.css';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems: NavItem[] = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/venues', label: 'Venues', icon: <PlaceIcon /> },
    { path: '/venue-tags', label: 'Venue Tags', icon: <LocalOfferIcon /> },
    { path: '/calendar', label: 'Calendar', icon: <CalendarMonthIcon /> },
    { path: '/models', label: 'Models', icon: <FaceIcon /> },
    { path: '/artists', label: 'Artists', icon: <BrushIcon /> },
    { path: '/users', label: 'Users', icon: <PeopleIcon />, adminOnly: true },
    { path: '/profile', label: 'Profile', icon: <PersonIcon /> },
  ];

  const handleNavClick = () => {
    setMobileOpen(false);
  };

  return (
    <div className="layout">
      {/* Mobile Menu Button */}
      <button 
        className="mobile-menu-button"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        <MenuIcon sx={{ fontSize: 28 }} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="mobile-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <nav className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2>{collapsed ? 'N' : 'Neon Admin'}</h2>
          <button 
            className="collapse-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
        </div>
        <ul className="nav-links">
          {navItems.map((item) => {
            if (item.adminOnly && !user?.isAdmin) return null;
            return (
              <li key={item.path}>
                <Link to={item.path} onClick={handleNavClick} title={item.label}>
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="sidebar-footer">
          {!collapsed && <p>{user?.email}</p>}
          <button onClick={handleLogout} className="button button-danger" title="Logout">
            <LogoutIcon sx={{ fontSize: 20 }} />
            {!collapsed && <span style={{ marginLeft: '0.5rem' }}>Logout</span>}
          </button>
        </div>
      </nav>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
