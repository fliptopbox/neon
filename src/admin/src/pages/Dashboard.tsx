import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface RecentVenue {
  id: number;
  name: string;
  day: string;
  time: string;
  is_active: boolean;
  created_at: string;
}

interface RecentModel {
  id: number;
  fullname: string;
  sex: number;
  is_active: boolean;
  created_at: string;
  booking_count: number;
}

interface RecentCalendar {
  id: number;
  date: string;
  start: string;
  fullname: string;
  venue_name: string;
}

interface RecentArtist {
  id: number;
  fullname: string;
  created_at: string;
}

interface RecentUser {
  id: number;
  email: string;
  is_admin: boolean;
  created_at: string;
}

interface RecentTag {
  id: string;
  description: string;
}

interface DashboardStats {
  venues: {
    total: number;
    active: number;
    recent: RecentVenue[];
  };
  models: {
    total: number;
    active: number;
    notBooked: number;
    recent: RecentModel[];
  };
  calendar: {
    total: number;
    upcoming: number;
    recent: RecentCalendar[];
  };
  artists: {
    total: number;
    recent: RecentArtist[];
  };
  users: {
    total: number;
    admin: number;
    recent: RecentUser[];
  };
  venueTags: {
    total: number;
    recent: RecentTag[];
  };
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as DashboardStats;
      console.log('Dashboard stats:', data);
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container">
        <h1>Dashboard</h1>
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Dashboard</h1>
      
      {/* Venues Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Venues</h2>
          <Link to="/venues" className="button button-primary">Manage All →</Link>
        </div>
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
          <div>
            <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Total</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0' }}>{stats?.venues.total || 0}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Active</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#28a745' }}>{stats?.venues.active || 0}</p>
          </div>
        </div>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Recent Venues</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Day</th>
              <th>Time</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {stats?.venues.recent.map((venue) => (
              <tr key={venue.id}>
                <td>{venue.name}</td>
                <td>{venue.day}</td>
                <td>{venue.time}</td>
                <td>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem',
                    backgroundColor: venue.is_active ? '#d4edda' : '#f8d7da',
                    color: venue.is_active ? '#155724' : '#721c24'
                  }}>
                    {venue.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{formatDate(venue.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Models Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Models</h2>
          <Link to="/models" className="button button-primary">Manage All →</Link>
        </div>
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
          <div>
            <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Total</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0' }}>{stats?.models.total || 0}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Active</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#28a745' }}>{stats?.models.active || 0}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Not Booked</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#ffc107' }}>{stats?.models.notBooked || 0}</p>
          </div>
        </div>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Recently Added Models</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Gender</th>
              <th>Bookings</th>
              <th>Status</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {stats?.models.recent.map((model) => (
              <tr key={model.id}>
                <td>{model.fullname || 'N/A'}</td>
                <td>{model.sex === 2 ? 'Female' : model.sex === 1 ? 'Male' : 'Other'}</td>
                <td>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    backgroundColor: model.booking_count > 0 ? '#d4edda' : '#fff3cd',
                    color: model.booking_count > 0 ? '#155724' : '#856404'
                  }}>
                    {model.booking_count} {model.booking_count === 1 ? 'booking' : 'bookings'}
                  </span>
                </td>
                <td>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem',
                    backgroundColor: model.is_active ? '#d4edda' : '#f8d7da',
                    color: model.is_active ? '#155724' : '#721c24'
                  }}>
                    {model.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{formatDate(model.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calendar Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Calendar</h2>
          <Link to="/calendar" className="button button-primary">View All →</Link>
        </div>
        <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem' }}>
          <div>
            <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Total Events</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0' }}>{stats?.calendar.total || 0}</p>
          </div>
          <div>
            <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>Upcoming</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#007bff' }}>{stats?.calendar.upcoming || 0}</p>
          </div>
        </div>
        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Recent Events</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Model</th>
              <th>Venue</th>
            </tr>
          </thead>
          <tbody>
            {stats?.calendar.recent.map((event) => (
              <tr key={event.id}>
                <td>{formatDate(event.date)}</td>
                <td>{event.start}</td>
                <td>{event.fullname || 'N/A'}</td>
                <td>{event.venue_name || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid for smaller sections */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        {/* Artists */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Artists</h2>
            <Link to="/artists" style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.875rem' }}>View All →</Link>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>{stats?.artists.total || 0}</p>
          <div style={{ fontSize: '0.875rem' }}>
            {stats?.artists.recent.slice(0, 3).map((artist) => (
              <div key={artist.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                {artist.fullname || 'N/A'}
              </div>
            ))}
          </div>
        </div>

        {/* Users */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Users</h2>
            <Link to="/users" style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.875rem' }}>View All →</Link>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
            <div>
              <p style={{ color: '#666', fontSize: '0.75rem', margin: 0 }}>Total</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats?.users.total || 0}</p>
            </div>
            <div>
              <p style={{ color: '#666', fontSize: '0.75rem', margin: 0 }}>Admins</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>{stats?.users.admin || 0}</p>
            </div>
          </div>
        </div>

        {/* Venue Tags */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Venue Tags</h2>
            <Link to="/venue-tags" style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.875rem' }}>View All →</Link>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 1rem 0' }}>{stats?.venueTags.total || 0}</p>
          <div style={{ fontSize: '0.875rem' }}>
            {stats?.venueTags.recent.map((tag) => (
              <div key={tag.id} style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
                <code>{tag.id}</code> - {tag.description}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
