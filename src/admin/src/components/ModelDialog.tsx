import { useEffect, useState } from 'react';
import { modelPortrait } from '../helpers/imageKit';
import InstagramIcon from '@mui/icons-material/Instagram';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import PhoneIcon from '@mui/icons-material/Phone';
import CloseIcon from '@mui/icons-material/Close';

interface Model {
  id: number;
  user_id?: number;
  fullname: string;
  known_as: string | null;
  sex: number;
  instagram: string;
  active: number;
  portrait: string;
  account_holder: string | null;
  account_number: string | null;
  account_sortcode: string | null;
  email: string | null;
  websites: string[] | string | null;
  bio_instagram: string | null;
  description: string | null;
}

interface ModelDialogProps {
  modelId?: number;
  userId?: number;
  onClose: () => void;
}

export default function ModelDialog({ modelId, userId, onClose }: ModelDialogProps) {
  const [model, setModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModel();
  }, [modelId, userId]);

  const fetchModel = async () => {
    try {
      let url = '';
      if (modelId) {
        url = `/api/models/${modelId}`;
      } else if (userId) {
        // Fetch model by user_id
        const response = await fetch('/api/models');
        const models = await response.json() as Model[];
        const foundModel = models.find(m => m.user_id === userId);
        if (foundModel) {
          setModel(foundModel);
        }
        setLoading(false);
        return;
      }

      if (url) {
        const response = await fetch(url);
        const data = await response.json() as Model;
        setModel(data);
      }
    } catch (error) {
      console.error('Failed to fetch model:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!model) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '2rem' }}>
          <p>Model not found</p>
          <button onClick={onClose} className="button" style={{ marginTop: '1rem' }}>Close</button>
        </div>
      </div>
    );
  }

  // Parse websites if it's a string
  let websites: string[] = [];
  if (model.websites) {
    if (typeof model.websites === 'string') {
      try {
        websites = JSON.parse(model.websites);
      } catch {
        websites = [];
      }
    } else if (Array.isArray(model.websites)) {
      websites = model.websites;
    }
  }

  const instagramHandle = model.bio_instagram || model.instagram || 'Not provided';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', padding: '2rem' }}>
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#666'
          }}
          aria-label="Close"
        >
          <CloseIcon />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img 
            src={modelPortrait(model.portrait, 300, 400)} 
            alt={model.fullname}
            style={{ 
              width: '100%', 
              maxWidth: '300px',
              aspectRatio: '3/4',
              objectFit: 'cover', 
              borderRadius: '8px',
              marginBottom: '1rem'
            }}
          />
          <h2 style={{ 
            margin: '0 0 0.25rem 0', 
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}>
            {model.fullname}
          </h2>
          {model.known_as && (
            <p style={{ 
              fontSize: '1rem',
              color: '#666',
              margin: '0 0 0.5rem 0'
            }}>
              "{model.known_as}"
            </p>
          )}
          <div style={{ 
            fontSize: '0.875rem',
            color: '#666',
            marginBottom: '1rem'
          }}>
            +44 7XXX XXXXXX
          </div>

          {model.description && (
            <p style={{
              fontSize: '0.9rem',
              color: '#555',
              lineHeight: '1.5',
              marginBottom: '1rem',
              textAlign: 'left'
            }}>
              {model.description}
            </p>
          )}

          <div style={{ 
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            marginTop: '1rem'
          }}>
            {instagramHandle !== 'Not provided' && (
              <a 
                href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#007bff', display: 'flex', alignItems: 'center' }}
                title={instagramHandle}
              >
                <InstagramIcon sx={{ fontSize: 40 }} />
              </a>
            )}
            {model.email && (
              <a 
                href={`mailto:${model.email}`}
                style={{ color: '#007bff', display: 'flex', alignItems: 'center' }}
                title={model.email}
              >
                <EmailIcon sx={{ fontSize: 40 }} />
              </a>
            )}
            {websites.length > 0 && (
              <a 
                href={websites[0]}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#007bff', display: 'flex', alignItems: 'center' }}
                title={websites.join(', ')}
              >
                <LanguageIcon sx={{ fontSize: 40 }} />
              </a>
            )}
            <PhoneIcon sx={{ fontSize: 40, color: '#999', cursor: 'default' }} titleAccess="+44 7XXX XXXXXX" />
          </div>
        </div>
      </div>
    </div>
  );
}
