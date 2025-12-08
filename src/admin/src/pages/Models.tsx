import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import ModelCard from '../components/ModelCard';
import { getApiUrl } from '../config/api';
import InstagramIcon from '@mui/icons-material/Instagram';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import PhoneIcon from '@mui/icons-material/Phone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SortByAlphaIcon from '@mui/icons-material/SortByAlpha';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

interface Model {
  id: number;
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

interface ModelFormData {
  sex: number;
  instagram: string;
  portrait: string;
  account_holder: string;
  account_number: string;
  account_sortcode: string;
  active: number;
  // user_bios fields
  fullname: string;
  known_as: string;
  bio_instagram: string;
  description: string;
  websites: string;
}

export default function Models() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'date' | 'alpha' | 'reverse'>('date');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  const [formData, setFormData] = useState<ModelFormData>({
    sex: 0,
    instagram: '',
    portrait: '',
    account_holder: '',
    account_number: '',
    account_sortcode: '',
    active: 1,
    fullname: '',
    known_as: '',
    bio_instagram: '',
    description: '',
    websites: '',
  });

  useEffect(() => {
    fetchModels();
    // Focus the search input when component mounts
    searchInputRef.current?.focus();
  }, []);

  const fetchModels = async () => {
    try {
      const response = await fetch(getApiUrl('/api/models'));
      const data = await response.json() as Model[];
      setModels(data);
    } catch (error) {
      console.error('Failed to fetch models:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingModel(null);
    setFormData({
      sex: 0,
      instagram: '',
      portrait: '',
      account_holder: '',
      account_number: '',
      account_sortcode: '',
      active: 1,
      fullname: '',
      known_as: '',
      bio_instagram: '',
      description: '',
      websites: '',
    });
    setShowModal(true);
  };

  const openEditModal = (model: Model) => {
    // Parse websites for editing
    let websitesStr = '';
    if (model.websites) {
      if (typeof model.websites === 'string') {
        try {
          const parsed = JSON.parse(model.websites);
          websitesStr = Array.isArray(parsed) ? parsed.join('\n') : '';
        } catch {
          websitesStr = '';
        }
      } else if (Array.isArray(model.websites)) {
        websitesStr = model.websites.join('\n');
      }
    }

    setEditingModel(model);
    setFormData({
      sex: model.sex,
      instagram: model.instagram,
      portrait: model.portrait,
      account_holder: model.account_holder || '',
      account_number: model.account_number || '',
      account_sortcode: model.account_sortcode || '',
      active: model.active,
      fullname: model.fullname || '',
      known_as: model.known_as || '',
      bio_instagram: model.bio_instagram || '',
      description: model.description || '',
      websites: websitesStr,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingModel ? getApiUrl(`/api/models/${editingModel.id}`) : getApiUrl('/api/models');
      const method = editingModel ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowModal(false);
        fetchModels();
      } else {
        const errorData = await response.json() as { error?: string };
        alert(`Error: ${errorData.error || 'Failed to save model'}`);
      }
    } catch (error) {
      console.error('Failed to save model:', error);
      alert('Failed to save model');
    }
  };

  const deleteModel = async (id: number) => {
    if (!confirm('Are you sure you want to delete this model?')) return;

    try {
      await fetch(getApiUrl(`/api/models/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchModels();
    } catch (error) {
      console.error('Failed to delete model:', error);
    }
  };

  const sexLabels = ['Not specified', 'Male', 'Female'];

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

  if (loading) return <div className="loading">Loading models...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Models</h1>
        <button onClick={openAddModal} className="button button-primary">
          Add Model
        </button>
      </div>

      {/* Search Input with Sort Icons */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
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
            <AccessTimeIcon sx={{ fontSize: 20 }} />
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
            <SortByAlphaIcon sx={{ fontSize: 20 }} />
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
            <ArrowDownwardIcon sx={{ fontSize: 20 }} />
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        {sortedModels.map((model) => (
          <div key={model.id} style={{ 
            flex: '1 1 calc(50% - 0.5rem)',
            minWidth: '300px'
          }}>
            <ModelCard
              model={model}
              onClick={() => openEditModal(model)}
            />
          </div>
        ))}
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
              <h2 style={{ margin: 0 }}>{editingModel ? 'Edit Model' : 'Add Model'}</h2>
            </div>

            {/* Scrollable content area */}
            <div style={{ 
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem'
            }}>
              <form onSubmit={handleSubmit} id="model-form">
                <h3 style={{ marginTop: 0, marginBottom: '1rem', fontSize: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Personal Information</h3>
                
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    placeholder="Full legal name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Known As</label>
                  <input
                    type="text"
                    value={formData.known_as}
                    onChange={(e) => setFormData({ ...formData, known_as: e.target.value })}
                    placeholder="Preferred/stage name"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Bio or description"
                    rows={3}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>

                <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Social Media & Contact</h3>

                <div className="form-group">
                  <label>Bio Instagram</label>
                  <input
                    type="text"
                    value={formData.bio_instagram}
                    onChange={(e) => setFormData({ ...formData, bio_instagram: e.target.value })}
                    placeholder="@username (from user_bios)"
                  />
                </div>

                <div className="form-group">
                  <label>Model Instagram *</label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@username (from models table)"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Websites</label>
                  <textarea
                    value={formData.websites}
                    onChange={(e) => setFormData({ ...formData, websites: e.target.value })}
                    placeholder="One URL per line&#10;https://example.com&#10;https://another.com"
                    rows={3}
                    style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                </div>

                <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Model Profile</h3>

                <div className="form-group">
                  <label>Sex *</label>
                  <select
                    value={formData.sex}
                    onChange={(e) => setFormData({ ...formData, sex: Number(e.target.value) })}
                    required
                  >
                    <option value={0}>Not specified</option>
                    <option value={1}>Male</option>
                    <option value={2}>Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Portrait Path *</label>
                  <input
                    type="text"
                    value={formData.portrait}
                    onChange={(e) => setFormData({ ...formData, portrait: e.target.value })}
                    placeholder="folder/filename.jpg or filename.jpg"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Status *</label>
                  <select
                    value={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: Number(e.target.value) })}
                    required
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>

                <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem', fontSize: '1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.5rem' }}>Payment Information</h3>

                <div className="form-group">
                  <label>Account Holder</label>
                  <input
                    type="text"
                    value={formData.account_holder}
                    onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
                    placeholder="Full name on bank account"
                  />
                </div>

                <div className="form-group">
                  <label>Account Number</label>
                  <input
                    type="text"
                    value={formData.account_number}
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                    placeholder="8 digits"
                    pattern="[0-9]{8}"
                    maxLength={8}
                  />
                </div>

                <div className="form-group">
                  <label>Account Sort Code</label>
                  <input
                    type="text"
                    value={formData.account_sortcode}
                    onChange={(e) => setFormData({ ...formData, account_sortcode: e.target.value })}
                    placeholder="XX-XX-XX"
                    pattern="[0-9]{2}-[0-9]{2}-[0-9]{2}"
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
              <div>
                {editingModel && (
                  <button 
                    type="button" 
                    onClick={() => deleteModel(editingModel.id)}
                    className="button button-danger"
                  >
                    Delete
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="button">
                  Cancel
                </button>
                <button type="submit" form="model-form" className="button button-primary">
                  {editingModel ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
