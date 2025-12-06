import { modelPortrait } from '../helpers/imageKit';
import InstagramIcon from '@mui/icons-material/Instagram';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import PhoneIcon from '@mui/icons-material/Phone';

interface ModelCardProps {
  model: {
    id: number;
    fullname: string;
    portrait: string;
    email: string | null;
    bio_instagram?: string | null;
    instagram?: string;
    websites?: string[] | string | null;
  };
  onClick?: () => void;
  className?: string;
}

export default function ModelCard({ model, onClick, className = '' }: ModelCardProps) {
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
    <div 
      className={`card ${className}`}
      onClick={onClick}
      style={{ 
        padding: '1.5rem', 
        cursor: onClick ? 'pointer' : 'default', 
        transition: 'transform 0.2s' 
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <img 
          src={modelPortrait(model.portrait)} 
          alt={model.fullname}
          style={{ 
            width: '100%', 
            aspectRatio: '3/4',
            objectFit: 'cover', 
            borderRadius: '8px',
            marginBottom: '1rem'
          }}
        />
        <h3 style={{ 
          margin: '0 0 0.25rem 0', 
          fontSize: '1.25rem',
          fontWeight: 'bold'
        }}>
          {model.fullname}
        </h3>
        <div style={{ 
          fontSize: '0.875rem',
          color: '#666',
          marginBottom: '0.5rem'
        }}>
          +44 7XXX XXXXXX
        </div>
      </div>
      
      <ul style={{ 
        listStyle: 'none', 
        padding: 0, 
        margin: 0,
        fontSize: '0.875rem',
        display: 'flex',
        gap: '0.75rem',
        justifyContent: 'center'
      }}>
        {instagramHandle !== 'Not provided' && (
          <li>
            <a 
              href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ color: '#007bff', display: 'flex', alignItems: 'center' }}
              title={instagramHandle}
            >
              <InstagramIcon sx={{ fontSize: 48 }} />
            </a>
          </li>
        )}
        {model.email && (
          <li>
            <a 
              href={`mailto:${model.email}`}
              onClick={(e) => e.stopPropagation()}
              style={{ color: '#007bff', display: 'flex', alignItems: 'center' }}
              title={model.email}
            >
              <EmailIcon sx={{ fontSize: 48 }} />
            </a>
          </li>
        )}
        {websites.length > 0 && (
          <li>
            <a 
              href={websites[0]}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{ color: '#007bff', display: 'flex', alignItems: 'center' }}
              title={websites.join(', ')}
            >
              <LanguageIcon sx={{ fontSize: 48 }} />
            </a>
          </li>
        )}
        <li>
          <PhoneIcon sx={{ fontSize: 48, color: '#999', cursor: 'default' }} titleAccess="+44 7XXX XXXXXX" />
        </li>
      </ul>
    </div>
  );
}
