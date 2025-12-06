import { useState, useEffect } from 'react';
import ModelCard from './ModelCard';

interface Model {
  id: number;
  user_id: number;
  fullname: string;
  portrait: string;
  email: string;
  instagram?: string;
  bio_instagram?: string;
  websites?: string | string[];
  phone?: string;
}

interface Venue {
  id: number;
  name: string;
  week_day: number;
}

interface CalendarEvent {
  id: number;
  user_id: number;
  venue_id: number;
  date: string;
  attendance_inperson: number;
  attendance_online: number;
  start: string;
  duration: number;
  notes: string | null;
}

interface BookingEditorProps {
  event: CalendarEvent;
  onSave: (updatedEvent: Partial<CalendarEvent>) => Promise<void>;
  onDelete: () => Promise<void>;
  onClose: () => void;
}

export default function BookingEditor({
  event,
  onSave,
  onDelete,
  onClose
}: BookingEditorProps) {
  const [model, setModel] = useState<Model | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loadingModel, setLoadingModel] = useState(true);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    venue_id: event.venue_id.toString(),
    date: event.date.split('T')[0],
    attendance_inperson: event.attendance_inperson.toString(),
    attendance_online: event.attendance_online.toString(),
    start: event.start,
    duration: event.duration.toString(),
    notes: event.notes || ''
  });

  // Get day of week from event date (0 = Sunday, 1 = Monday, etc.)
  const eventDate = new Date(event.date);
  const dayOfWeek = eventDate.getDay();

  useEffect(() => {
    fetchModel();
    fetchVenues();
  }, []);

  const fetchModel = async () => {
    try {
      const response = await fetch(`/api/models/by-user/${event.user_id}`);
      if (response.ok) {
        const data = await response.json();
        setModel(data);
      }
      setLoadingModel(false);
    } catch (error) {
      console.error('Error fetching model:', error);
      setLoadingModel(false);
    }
  };

  const fetchVenues = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/venues', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        
        // Filter venues by day of week (week_day field matches event day)
        const filteredByDay = data.filter((v: Venue) => v.week_day === dayOfWeek);
        
        // Sort venues alphabetically by name
        const sorted = [...filteredByDay].sort((a, b) => a.name.localeCompare(b.name));
        setVenues(sorted);
        
        // Set default to "Life Drawing Art" if it exists in filtered list
        const lifeDrawing = sorted.find((v: Venue) => v.name === 'Life Drawing Art');
        if (lifeDrawing && !event.venue_id) {
          setFormData(prev => ({ ...prev, venue_id: lifeDrawing.id.toString() }));
        } else if (sorted.length > 0 && !event.venue_id) {
          // If Life Drawing Art not available, use first venue
          setFormData(prev => ({ ...prev, venue_id: sorted[0].id.toString() }));
        }
      }
      setLoadingVenues(false);
    } catch (error) {
      console.error('Error fetching venues:', error);
      setLoadingVenues(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      await onSave({
        user_id: event.user_id,
        venue_id: parseInt(formData.venue_id),
        date: formData.date,
        attendance_inperson: parseInt(formData.attendance_inperson),
        attendance_online: parseInt(formData.attendance_online),
        start: formData.start,
        duration: parseFloat(formData.duration),
        notes: formData.notes || null
      });
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this booking?')) {
      return;
    }
    
    setSaving(true);
    try {
      await onDelete();
    } catch (error) {
      console.error('Error deleting:', error);
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '600px', 
          maxHeight: '90vh', 
          display: 'flex',
          flexDirection: 'column',
          padding: 0
        }}
      >
        <div style={{ 
          padding: '1.5rem',
          borderBottom: '1px solid #ddd',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0 }}>Edit Booking</h2>
          <button 
            onClick={onClose}
            className="button"
            style={{ minWidth: 'auto', padding: '0.5rem 1rem' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content area */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {/* Model Profile Card */}
          {loadingModel ? (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              Loading model...
            </div>
          ) : model ? (
            <div style={{ marginBottom: '1.5rem' }}>
              <ModelCard model={model} />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
              Model not found
            </div>
          )}

          {/* Booking Details Form */}
          <form onSubmit={handleSubmit} id="booking-form">
            <div className="form-group">
              <label htmlFor="venue_id">Venue:</label>
              {loadingVenues ? (
                <input type="text" value="Loading..." disabled />
              ) : (
                <select
                  id="venue_id"
                  value={formData.venue_id}
                  onChange={(e) => setFormData({ ...formData, venue_id: e.target.value })}
                  required
                >
                  <option value="">Select a venue</option>
                  {venues.map(venue => (
                    <option key={venue.id} value={venue.id}>
                      {venue.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="start">Start Time:</label>
              <input
                type="time"
                id="start"
                value={formData.start}
                onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration (hours):</label>
              <input
                type="number"
                id="duration"
                step="0.25"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="attendance_inperson">In-Person Attendance:</label>
              <input
                type="number"
                id="attendance_inperson"
                min="0"
                value={formData.attendance_inperson}
                onChange={(e) => setFormData({ ...formData, attendance_inperson: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="attendance_online">Online Attendance:</label>
              <input
                type="number"
                id="attendance_online"
                min="0"
                value={formData.attendance_online}
                onChange={(e) => setFormData({ ...formData, attendance_online: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="notes">Notes:</label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
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
          justifyContent: 'space-between'
        }}>
          <button 
            type="button" 
            onClick={handleDelete} 
            className="button"
            style={{ backgroundColor: '#dc3545', color: 'white' }}
            disabled={saving}
          >
            Delete Booking
          </button>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button 
              type="button" 
              onClick={onClose} 
              className="button"
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              form="booking-form"
              className="button button-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
