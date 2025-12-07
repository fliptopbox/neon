import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';

interface Venue {
  id: number;
  name: string;
  week_day: number;
  start_time: string;
  area: string;
  active: number;
  frequency: string;
  instagram: string | null;
  website: string;
  address: string;
  timezone: string;
  duration: number;
  postcode: string;
  price_inperson: number;
  price_online: number;
  tags: string[];
}

interface VenueFormData {
  name: string;
  week_day: number;
  start_time: string;
  area: string;
  frequency: string;
  instagram: string;
  website: string;
  address: string;
  timezone: string;
  duration: number;
  postcode: string;
  price_inperson: number;
  price_online: number;
  tags: string;
}

export default function Venues() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const { token } = useAuth();

  const [formData, setFormData] = useState<VenueFormData>({
    name: '',
    week_day: 0,
    start_time: '',
    area: '',
    frequency: 'weekly',
    instagram: '',
    website: '',
    address: '',
    timezone: 'UTC',
    duration: 120,
    postcode: '',
    price_inperson: 0,
    price_online: 0,
    tags: '',
  });

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const response = await fetch(getApiUrl('/api/venues'));
      const data = await response.json() as Venue[];
      setVenues(data);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingVenue(null);
    setFormData({
      name: '',
      week_day: 0,
      start_time: '',
      area: '',
      frequency: 'weekly',
      instagram: '',
      website: '',
      address: '',
      timezone: 'UTC',
      duration: 120,
      postcode: '',
      price_inperson: 0,
      price_online: 0,
      tags: '',
    });
    setShowModal(true);
  };

  const openEditModal = (venue: Venue) => {
    setEditingVenue(venue);
    setFormData({
      name: venue.name,
      week_day: venue.week_day,
      start_time: venue.start_time,
      area: venue.area,
      frequency: venue.frequency,
      instagram: venue.instagram || '',
      website: venue.website,
      address: venue.address,
      timezone: venue.timezone,
      duration: venue.duration,
      postcode: venue.postcode,
      price_inperson: venue.price_inperson,
      price_online: venue.price_online,
      tags: Array.isArray(venue.tags) ? venue.tags.join(', ') : '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagsArray = formData.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const payload = {
      ...formData,
      tags: tagsArray,
    };

    try {
      const url = editingVenue ? getApiUrl(`/api/venues/${editingVenue.id}`) : getApiUrl('/api/venues');
      const method = editingVenue ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowModal(false);
        fetchVenues();
      } else {
        const errorData = await response.json() as { error?: string };
        alert(`Error: ${errorData.error || 'Failed to save venue'}`);
      }
    } catch (error) {
      console.error('Failed to save venue:', error);
      alert('Failed to save venue');
    }
  };

  const deleteVenue = async (id: number) => {
    if (!confirm('Are you sure you want to delete this venue?')) return;

    try {
      await fetch(getApiUrl(`/api/venues/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchVenues();
    } catch (error) {
      console.error('Failed to delete venue:', error);
    }
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) return <div className="loading">Loading venues...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Venues</h1>
        <button onClick={openAddModal} className="button button-primary">
          Add Venue
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Day</th>
              <th>Time</th>
              <th>Area</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {venues.map((venue) => (
              <tr key={venue.id}>
                <td>{venue.name}</td>
                <td>{weekDays[venue.week_day]}</td>
                <td>{venue.start_time}</td>
                <td>{venue.area}</td>
                <td>{venue.active ? 'Active' : 'Inactive'}</td>
                <td>
                  <button
                    onClick={() => openEditModal(venue)}
                    className="button button-primary"
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem', marginRight: '0.5rem' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteVenue(venue.id)}
                    className="button button-danger"
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '90vh',
              padding: 0
            }}
          >
            {/* Fixed header */}
            <div style={{ 
              padding: '1.5rem',
              borderBottom: '1px solid #ddd'
            }}>
              <h2 style={{ margin: 0 }}>{editingVenue ? 'Edit Venue' : 'Add Venue'}</h2>
            </div>

            {/* Scrollable content area */}
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem'
            }}>
              <form onSubmit={handleSubmit} id="venue-form">
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Day of Week *</label>
                  <select
                    value={formData.week_day}
                    onChange={(e) => setFormData({ ...formData, week_day: Number(e.target.value) })}
                    required
                  >
                    {weekDays.map((day, index) => (
                      <option key={index} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Start Time *</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Duration (minutes) *</label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Area *</label>
                  <input
                    type="text"
                    value={formData.area}
                    onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Address *</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <label>Postcode *</label>
                  <input
                    type="text"
                    value={formData.postcode}
                    onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Website *</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Instagram</label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@username"
                  />
                </div>

                <div className="form-group">
                  <label>Timezone *</label>
                  <input
                    type="text"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Frequency *</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    required
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>In-Person Price</label>
                  <input
                    type="number"
                    value={formData.price_inperson}
                    onChange={(e) => setFormData({ ...formData, price_inperson: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Online Price</label>
                  <input
                    type="number"
                    value={formData.price_online}
                    onChange={(e) => setFormData({ ...formData, price_online: Number(e.target.value) })}
                  />
                </div>

                <div className="form-group">
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="life drawing, beginner friendly"
                  />
                </div>
              </form>
            </div>

            {/* Fixed footer with buttons */}
            <div style={{ 
              padding: '1rem 1.5rem',
              borderTop: '1px solid #ddd',
              backgroundColor: '#f8f9fa',
              display: 'flex', 
              gap: '0.5rem', 
              justifyContent: 'flex-end'
            }}>
              <button type="button" onClick={() => setShowModal(false)} className="button">
                Cancel
              </button>
              <button type="submit" form="venue-form" className="button button-primary">
                {editingVenue ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
