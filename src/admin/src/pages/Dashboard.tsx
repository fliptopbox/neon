import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import InstagramIcon from '@mui/icons-material/Instagram';
import EmailIcon from '@mui/icons-material/Email';
import { modelPortrait } from '../helpers/imageKit';
import ModelDialog from '../components/ModelDialog';
import { getApiUrl } from '../config/api';

interface RecentVenue {
  id: number;
  name: string;
  day: string;
  time: string;
  is_active: boolean;
  created_at: string;
}

interface VenueChartData {
  week_day: number;
  count: number;
}

interface VenueTimePrice {
  name: string;
  start_time: string;
  duration: number;
  price_inperson: number;
  price_online: number;
}

interface RecentModel {
  id: number;
  user_id: number;
  fullname: string;
  firstname: string;
  sex: number;
  is_active: boolean;
  created_at: string;
  booking_count: number;
  instagram?: string;
  emailaddress?: string;
  avatar?: string;
}

interface RecentCalendar {
  id: number;
  date: string;
  start: string;
  fullname: string;
  venue_name: string;
  tbc: number;
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
    tbc: number;
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
  const [venuesByDay, setVenuesByDay] = useState<VenueChartData[]>([]);
  const [venuesTimePrice, setVenuesTimePrice] = useState<VenueTimePrice[]>([]);
  const [selectedModelUserId, setSelectedModelUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchStats();
    fetchVenueChartData();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/dashboard/stats'), {
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

  const fetchVenueChartData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiUrl('/api/venues'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const venues = await response.json() as any[];
        
        // Group by day of week
        const dayCount: { [key: number]: number } = {};
        venues.forEach((venue: any) => {
          dayCount[venue.week_day] = (dayCount[venue.week_day] || 0) + 1;
        });
        
        const chartData = Object.entries(dayCount).map(([day, count]) => ({
          week_day: parseInt(day),
          count: count as number
        }));
        
        setVenuesByDay(chartData);
        
        // Get venues for today's day of week
        const today = new Date().getDay();
        const todaysVenues = venues
          .filter((venue: any) => venue.week_day === today)
          .sort((a: any, b: any) => a.start_time.localeCompare(b.start_time))
          .map((venue: any) => ({
            name: venue.name,
            start_time: venue.start_time,
            duration: venue.duration || 0,
            price_inperson: venue.price_inperson || 0,
            price_online: venue.price_online || 0
          }));
        
        setVenuesTimePrice(todaysVenues);
      }
    } catch (error) {
      console.error('Error fetching venue chart data:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const weekDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const dayColors = [
    '#FF6384', // Sunday - Pink
    '#36A2EB', // Monday - Blue
    '#FFCE56', // Tuesday - Yellow
    '#4BC0C0', // Wednesday - Teal
    '#9966FF', // Thursday - Purple
    '#FF9F40', // Friday - Orange
    '#FF6384'  // Saturday - Pink
  ];

  const renderPieChart = () => {
    const total = venuesByDay.reduce((sum, item) => sum + item.count, 0);
    let currentAngle = 0;
    
    return (
      <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: '300px', margin: '0 auto' }}>
        {venuesByDay.map((item, index) => {
          const percentage = (item.count / total) * 100;
          const angle = (item.count / total) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;
          
          const x1 = 100 + 80 * Math.cos((Math.PI * startAngle) / 180);
          const y1 = 100 + 80 * Math.sin((Math.PI * startAngle) / 180);
          const x2 = 100 + 80 * Math.cos((Math.PI * currentAngle) / 180);
          const y2 = 100 + 80 * Math.sin((Math.PI * currentAngle) / 180);
          
          const largeArc = angle > 180 ? 1 : 0;
          
          const pathData = [
            `M 100 100`,
            `L ${x1} ${y1}`,
            `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
            `Z`
          ].join(' ');
          
          return (
            <path
              key={item.week_day}
              d={pathData}
              fill={dayColors[item.week_day]}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
        <circle cx="100" cy="100" r="40" fill="white" />
        <text x="100" y="100" textAnchor="middle" dominantBaseline="middle" fontSize="20" fontWeight="bold">
          {total}
        </text>
        <text x="100" y="115" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#666">
          Events
        </text>
      </svg>
    );
  };

  const renderTimeChart = () => {
    if (venuesTimePrice.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          No classes scheduled
        </div>
      );
    }
    
    return (
      <div>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Time</th>
              <th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {venuesTimePrice.map((venue, index) => {
              const hasInperson = venue.price_inperson > 0;
              const hasOnline = venue.price_online > 0;
              
              return (
                <tr key={index}>
                  <td>{venue.name}</td>
                  <td>
                    <div style={{ fontWeight: 'bold' }}>
                      {venue.start_time.substring(0, 5)}
                    </div>
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                      {venue.duration} min
                    </div>
                  </td>
                  <td>
                    {!hasInperson && !hasOnline ? (
                      <span style={{ color: '#999' }}>Free</span>
                    ) : (
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '4px', 
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        fontWeight: 'bold'
                      }}>
                        {hasInperson && `£${(venue.price_inperson / 100).toFixed(2)}`}
                        {hasInperson && hasOnline && ' | '}
                        {hasOnline && `£${(venue.price_online / 100).toFixed(2)}`}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
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
          <div>
            <p style={{ color: '#666', fontSize: '0.875rem', margin: 0 }}>To Be Confirmed</p>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0.25rem 0', color: '#ff9800' }}>{stats?.calendar.tbc || 0}</p>
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
              <tr key={event.id} style={{
                backgroundColor: event.tbc ? '#ffcdd2' : 'transparent'
              }}>
                <td>{formatDate(event.date)}</td>
                <td>{event.start}</td>
                <td style={{
                  color: event.tbc ? '#d32f2f' : 'inherit'
                }}>
                  {event.fullname || 'N/A'}{event.tbc ? ' (TBC)' : ''}
                </td>
                <td>{event.venue_name || 'N/A'}</td>
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
        <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Recently Added Models</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
          gap: '1rem' 
        }}>
          {stats?.models.recent.slice(0, 8).map((model) => (
            <div 
              key={model.id}
              onClick={() => setSelectedModelUserId(model.user_id)}
              style={{
                cursor: 'pointer',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid #e0e0e0',
                transition: 'all 0.2s',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <div style={{ marginBottom: '0.5rem' }}>
                {model.avatar ? (
                  <img 
                    src={modelPortrait(model.avatar, 150, 150)} 
                    alt={model.firstname || 'Model'}
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    color: '#999'
                  }}>
                    {model.firstname?.charAt(0).toUpperCase() || 'M'}
                  </div>
                )}
              </div>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                marginBottom: '0.5rem',
                textAlign: 'center'
              }}>
                {model.firstname || 'N/A'}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {model.instagram && (
                  <a 
                    href={`https://instagram.com/${model.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: '#E4405F', display: 'flex', alignItems: 'center' }}
                  >
                    <InstagramIcon style={{ fontSize: '1.25rem' }} />
                  </a>
                )}
                {model.emailaddress && (
                  <a 
                    href={`mailto:${model.emailaddress}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{ color: '#666', display: 'flex', alignItems: 'center' }}
                  >
                    <EmailIcon style={{ fontSize: '1.25rem' }} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Venues Section with Charts */}
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

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
          {/* Pie Chart: Events by Day of Week */}
          <div>
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem', textAlign: 'center' }}>Events per Day of Week</h3>
            {venuesByDay.length > 0 ? (
              <>
                {renderPieChart()}
                <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center' }}>
                  {venuesByDay.map((item) => (
                    <div key={item.week_day} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: dayColors[item.week_day],
                        borderRadius: '2px'
                      }} />
                      <span style={{ fontSize: '0.875rem' }}>
                        {weekDayNames[item.week_day]}: {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ textAlign: 'center', color: '#666' }}>No venue data available</p>
            )}
          </div>

          {/* Classes List */}
          <div>
            {renderTimeChart()}
          </div>
        </div>
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

      {selectedModelUserId && (
        <ModelDialog
          userId={selectedModelUserId}
          onClose={() => setSelectedModelUserId(null)}
        />
      )}
    </div>
  );
}
