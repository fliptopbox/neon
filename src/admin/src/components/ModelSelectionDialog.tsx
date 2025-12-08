import { useState, useEffect, useRef } from 'react';
import ModelCard from './ModelCard';
import { getApiUrl } from '../config/api';

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
  active: number;
}

interface ModelSelectionDialogProps {
  selectedDate: string;
  bookedModelIds: number[];
  onSelectModel: (userId: number) => void;
  onClose: () => void;
}

export default function ModelSelectionDialog({
  selectedDate,
  bookedModelIds,
  onSelectModel,
  onClose
}: ModelSelectionDialogProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'date' | 'alpha' | 'reverse'>('date');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchModels();
    // Focus the search input when dialog opens
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch(getApiUrl('/api/models'));
      const data = await response.json();
      
      // Sort: unbooked models first, then booked models
      const sorted = [...data].sort((a, b) => {
        const aBooked = bookedModelIds.includes(a.user_id);
        const bBooked = bookedModelIds.includes(b.user_id);
        
        if (aBooked === bBooked) return 0;
        return aBooked ? 1 : -1;
      });
      
      setModels(sorted);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching models:', error);
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Filter models based on search query
  const filteredModels = models.filter((model) => {
    if (searchQuery.length < 1) return true;
    
    const query = searchQuery.toLowerCase();
    const fullnameMatch = model.fullname?.toLowerCase().startsWith(query);
    const instagramMatch = model.instagram?.toLowerCase().startsWith(query) || 
                          model.bio_instagram?.toLowerCase().startsWith(query);
    
    return fullnameMatch || instagramMatch;
  });

  // Sort filtered models
  const sortedModels = [...filteredModels].sort((a, b) => {
    if (sortOrder === 'alpha') {
      return (a.fullname || '').localeCompare(b.fullname || '');
    } else if (sortOrder === 'reverse') {
      return (b.fullname || '').localeCompare(a.fullname || '');
    }
    // Default: by date (id - assuming higher id = more recent)
    return b.id - a.id;
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '900px', 
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0
        }}
      >
        {/* Fixed header */}
        <div style={{ 
          padding: '1.5rem',
          borderBottom: '1px solid #ddd',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ margin: 0 }}>Select Model</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666' }}>
              {formatDate(selectedDate)}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="button"
            style={{ minWidth: 'auto', padding: '0.5rem 1rem' }}
          >
            ✕
          </button>
        </div>

        {/* Search Input with Sort Icons */}
        <div style={{ padding: '0 1.5rem 1rem 1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name or Instagram..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  fontSize: '1rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = '#007bff'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
              {searchQuery.length >= 1 && (
                <div style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.25rem' }}>
                  Found {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
            
            {/* Sort Icons */}
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                onClick={() => setSortOrder('date')}
                title="Sort by date added (newest first)"
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: sortOrder === 'date' ? '#007bff' : 'white',
                  color: sortOrder === 'date' ? 'white' : '#666',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                ⏰
              </button>
              <button
                onClick={() => setSortOrder('alpha')}
                title="Sort alphabetically (A-Z)"
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: sortOrder === 'alpha' ? '#007bff' : 'white',
                  color: sortOrder === 'alpha' ? 'white' : '#666',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                🔤
              </button>
              <button
                onClick={() => setSortOrder('reverse')}
                title="Sort reverse alphabetically (Z-A)"
                style={{
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: sortOrder === 'reverse' ? '#007bff' : 'white',
                  color: sortOrder === 'reverse' ? 'white' : '#666',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
              >
                ⬇️
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable content area */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              Loading models...
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1rem'
            }}>
              {sortedModels.map(model => {
                const isBooked = bookedModelIds.includes(model.user_id);
                return (
                  <div 
                    key={model.id}
                    style={{ position: 'relative' }}
                  >
                    {isBooked && (
                      <div style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        backgroundColor: '#ff9800',
                        color: 'white',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        zIndex: 1
                      }}>
                        BOOKED
                      </div>
                    )}
                    <ModelCard 
                      model={model}
                      onClick={() => onSelectModel(model.user_id)}
                      className={isBooked ? 'booked-model' : ''}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
