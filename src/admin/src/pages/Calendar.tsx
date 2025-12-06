import { useEffect, useState } from 'react';
import ModelSelectionDialog from '../components/ModelSelectionDialog';
import BookingEditor from '../components/BookingEditor';

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
  fullname?: string;
  venue_name?: string;
}

interface CalendarDay {
  date: Date;
  dateStr: string;
  event: CalendarEvent | null;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [venues, setVenues] = useState<any[]>([]);
  
  // Model selection dialog (for available dates)
  const [showModelSelection, setShowModelSelection] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Booking editor (for booked dates)
  const [showBookingEditor, setShowBookingEditor] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    fetchEvents();
    fetchVenues();
  }, []);

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
        // Sort venues alphabetically by name
        const sorted = [...data].sort((a: any, b: any) => a.name.localeCompare(b.name));
        setVenues(sorted);
      }
    } catch (error) {
      console.error('Error fetching venues:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json() as CalendarEvent[];
      setEvents(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      setLoading(false);
    }
  };

  const handleDayClick = (day: CalendarDay) => {
    if (day.event) {
      // Booked date - show booking editor
      setEditingEvent(day.event);
      setShowBookingEditor(true);
    } else if (day.isCurrentMonth) {
      // Available date - show model selection
      setSelectedDate(day.dateStr);
      setShowModelSelection(true);
    }
  };

  const handleModelSelected = async (userId: number) => {
    if (!selectedDate) return;
    
    // Check if we have venues available
    if (venues.length === 0) {
      alert('No venues available. Please add a venue first.');
      return;
    }
    
    // Find "Life Drawing Art" venue or use first venue as fallback
    const lifeDrawingVenue = venues.find((v: any) => v.name === 'Life Drawing Art');
    const defaultVenueId = lifeDrawingVenue ? lifeDrawingVenue.id : venues[0].id;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          venue_id: defaultVenueId,
          date: selectedDate,
          attendance_inperson: 0,
          attendance_online: 0,
          start: '10:00',
          duration: 2.0,
          notes: null
        })
      });

      if (response.ok) {
        const result = await response.json();
        await fetchEvents();
        setShowModelSelection(false);
        setSelectedDate(null);
        
        // Find the newly created event and open it for editing
        const newEvents = await fetchEventsSync();
        const newEvent = newEvents.find((e: CalendarEvent) => 
          e.date.split('T')[0] === selectedDate && e.user_id === userId
        );
        
        if (newEvent) {
          setEditingEvent(newEvent);
          setShowBookingEditor(true);
        }
      } else {
        const error = await response.json() as { error?: string };
        alert(`Error: ${error.error || 'Failed to create booking'}`);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Error creating booking');
    }
  };

  const fetchEventsSync = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/calendar', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  };

  const handleSaveBooking = async (updatedData: Partial<CalendarEvent>) => {
    if (!editingEvent) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/calendar/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedData)
      });

      if (response.ok) {
        await fetchEvents();
        setShowBookingEditor(false);
        setEditingEvent(null);
      } else {
        const error = await response.json() as { error?: string };
        alert(`Error: ${error.error || 'Failed to update booking'}`);
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('Error updating booking');
    }
  };

  const handleDeleteBooking = async () => {
    if (!editingEvent) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/calendar/${editingEvent.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchEvents();
        setShowBookingEditor(false);
        setEditingEvent(null);
      } else {
        const error = await response.json() as { error?: string };
        alert(`Error: ${error.error || 'Failed to delete booking'}`);
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Error deleting booking');
    }
  };

  const generateCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the previous month if needed to fill the week
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // End at the next month if needed to complete the week
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create event lookup map
    const eventMap = new Map<string, CalendarEvent>();
    events.forEach(event => {
      const eventDate = new Date(event.date);
      const key = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}-${String(eventDate.getDate()).padStart(2, '0')}`;
      eventMap.set(key, event);
    });
    
    while (current <= endDate) {
      const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
      const event = eventMap.get(dateStr) || null;
      
      const currentCopy = new Date(current);
      currentCopy.setHours(0, 0, 0, 0);
      
      days.push({
        date: new Date(current),
        dateStr,
        event,
        isCurrentMonth: current.getMonth() === month,
        isToday: currentCopy.getTime() === today.getTime()
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Get list of user_ids that are already booked on selected date
  const getBookedModelIds = (dateStr: string): number[] => {
    return events
      .filter(event => event.date.split('T')[0] === dateStr)
      .map(event => event.user_id);
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthYear = currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const calendarDays = generateCalendarDays();

  if (loading) return <div className="loading">Loading calendar...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Calendar</h1>
      </div>

      {/* Month Navigation */}
      <div className="card" style={{ marginBottom: '1rem', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={previousMonth} className="button button-secondary">
            ← Previous
          </button>
          <h2 style={{ margin: 0 }}>{monthYear}</h2>
          <button onClick={nextMonth} className="button button-secondary">
            Next →
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          backgroundColor: '#ddd'
        }}>
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{
              backgroundColor: '#f8f9fa',
              padding: '0.5rem',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '0.875rem'
            }}>
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => handleDayClick(day)}
              style={{
                backgroundColor: day.event 
                  ? '#e3f2fd'  // Light blue for booked days
                  : day.isCurrentMonth 
                    ? '#fff'   // White for empty days in current month
                    : '#f5f5f5', // Light gray for days outside current month
                minHeight: '100px',
                padding: '0.5rem',
                cursor: (day.event || day.isCurrentMonth) ? 'pointer' : 'default',
                border: day.isToday ? '2px solid #007bff' : 'none',
                opacity: day.isCurrentMonth ? 1 : 0.5,
                position: 'relative',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (day.event) {
                  e.currentTarget.style.backgroundColor = '#bbdefb';
                } else if (day.isCurrentMonth) {
                  e.currentTarget.style.backgroundColor = '#f0f0f0';
                }
              }}
              onMouseLeave={(e) => {
                if (day.event) {
                  e.currentTarget.style.backgroundColor = '#e3f2fd';
                } else if (day.isCurrentMonth) {
                  e.currentTarget.style.backgroundColor = '#fff';
                } else {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }
              }}
            >
              <div style={{
                fontSize: '0.875rem',
                fontWeight: day.isToday ? 'bold' : 'normal',
                marginBottom: '0.25rem',
                color: day.isCurrentMonth ? '#333' : '#999'
              }}>
                {day.date.getDate()}
              </div>
              
              {day.event ? (
                <div style={{ fontSize: '0.75rem' }}>
                  <div style={{
                    fontWeight: 'bold',
                    marginBottom: '0.25rem',
                    color: '#1976d2',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {day.event.fullname || 'Unknown'}
                  </div>
                  <div style={{ color: '#666' }}>
                    {day.event.start}
                  </div>
                  {(day.event.attendance_inperson > 0 || day.event.attendance_online > 0) && (
                    <div style={{ color: '#666', marginTop: '0.25rem' }}>
                      👥 {day.event.attendance_inperson}
                      {day.event.attendance_online > 0 && ` + ${day.event.attendance_online} online`}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#999',
                  fontStyle: 'italic'
                }}>
                  {day.isCurrentMonth && 'Available'}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem', padding: '1rem' }}>
        <h3 style={{ marginTop: 0 }}>Legend</h3>
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#e3f2fd', border: '1px solid #ddd' }}></div>
            <span>Booked - Click to edit</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#fff', border: '1px solid #ddd' }}></div>
            <span>Available - Click to book</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '20px', height: '20px', backgroundColor: '#fff', border: '2px solid #007bff' }}></div>
            <span>Today</span>
          </div>
        </div>
      </div>

      {/* Model Selection Dialog for available dates */}
      {showModelSelection && selectedDate && (
        <ModelSelectionDialog
          selectedDate={selectedDate}
          bookedModelIds={getBookedModelIds(selectedDate)}
          onSelectModel={handleModelSelected}
          onClose={() => {
            setShowModelSelection(false);
            setSelectedDate(null);
          }}
        />
      )}

      {/* Booking Editor for booked dates */}
      {showBookingEditor && editingEvent && (
        <BookingEditor
          event={editingEvent}
          onSave={handleSaveBooking}
          onDelete={handleDeleteBooking}
          onClose={() => {
            setShowBookingEditor(false);
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
}
