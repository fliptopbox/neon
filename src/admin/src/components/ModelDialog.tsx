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
        url = `/api/models/by-user/${userId}`;
      }

      if (url) {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Model not found');
        }
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

          {/* Metadata Section */}
          <div style={{ 
            marginTop: '2rem',
            padding: '1.5rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            textAlign: 'left'
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              borderBottom: '2px solid #dee2e6',
              paddingBottom: '0.5rem'
            }}>
              Model Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem', fontSize: '0.9rem' }}>
              <div style={{ fontWeight: '600', color: '#666' }}>Gender:</div>
              <div>{model.sex === 2 ? 'Female' : model.sex === 1 ? 'Male' : 'Not specified'}</div>
              
              <div style={{ fontWeight: '600', color: '#666' }}>Status:</div>
              <div>
                <span style={{ 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem',
                  backgroundColor: model.active ? '#d4edda' : '#f8d7da',
                  color: model.active ? '#155724' : '#721c24'
                }}>
                  {model.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              {model.instagram && (
                <>
                  <div style={{ fontWeight: '600', color: '#666' }}>Model Instagram:</div>
                  <div>
                    <a 
                      href={`https://instagram.com/${model.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#E4405F', textDecoration: 'none' }}
                    >
                      {model.instagram.startsWith('@') ? model.instagram : `@${model.instagram}`}
                    </a>
                  </div>
                </>
              )}
              
              {model.portrait && (
                <>
                  <div style={{ fontWeight: '600', color: '#666' }}>Portrait Path:</div>
                  <div style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>{model.portrait}</div>
                </>
              )}
              
              {model.account_holder && (
                <>
                  <div style={{ fontWeight: '600', color: '#666' }}>Account Holder:</div>
                  <div>{model.account_holder}</div>
                </>
              )}
              
              {model.account_number && (
                <>
                  <div style={{ fontWeight: '600', color: '#666' }}>Account Number:</div>
                  <div>{model.account_number}</div>
                </>
              )}
              
              {model.account_sortcode && (
                <>
                  <div style={{ fontWeight: '600', color: '#666' }}>Sort Code:</div>
                  <div>{model.account_sortcode}</div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
