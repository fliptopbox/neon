import { useState, useEffect } from 'react';
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

  useEffect(() => {
    fetchModels();
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
              {models.map(model => {
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
