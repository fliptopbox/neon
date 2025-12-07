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
        padding: '1rem', 
        cursor: onClick ? 'pointer' : 'default', 
        transition: 'transform 0.2s',
        display: 'flex',
        gap: '1.5rem',
        alignItems: 'start'
      }}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.transform = 'translateY(0)')}
    >
      {/* Portrait */}
      <div style={{ flexShrink: 0 }}>
        <img 
          src={modelPortrait(model.portrait, 120, 160)} 
          alt={model.fullname}
          style={{ 
            width: '120px', 
            height: '160px',
            objectFit: 'cover', 
            borderRadius: '8px'
          }}
        />
      </div>
      
      {/* Info Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
        {/* Full Name */}
        <h3 style={{ 
          margin: 0, 
          fontSize: '1.5rem',
          fontWeight: 'bold',
          lineHeight: 1.2
        }}>
          {model.fullname}
        </h3>
        
        {/* Phone Number */}
        <div style={{ 
          fontSize: '0.875rem',
          color: '#666'
        }}>
          +44 7XXX XXXXXX
        </div>
        
        {/* Icon Links Row */}
        <ul style={{ 
          listStyle: 'none', 
          padding: 0, 
          margin: 0,
          display: 'flex',
          gap: '0.75rem'
        }}>
          {instagramHandle !== 'Not provided' && (
            <li>
              <a 
                href={`https://instagram.com/${instagramHandle.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: '#E4405F', display: 'flex', alignItems: 'center' }}
                title={instagramHandle}
              >
                <InstagramIcon sx={{ fontSize: 28 }} />
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
                <EmailIcon sx={{ fontSize: 28 }} />
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
                <LanguageIcon sx={{ fontSize: 28 }} />
              </a>
            </li>
          )}
          <li>
            <PhoneIcon sx={{ fontSize: 28, color: '#999', cursor: 'default' }} titleAccess="+44 7XXX XXXXXX" />
          </li>
        </ul>
      </div>
    </div>
  );
}
