import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface VenueTag {
  id: string;
  description: string;
}

export default function VenueTags() {
  const [tags, setTags] = useState<VenueTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTag, setEditingTag] = useState<VenueTag | null>(null);
  const [formData, setFormData] = useState({
    id: '',
    description: ''
  });

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/venue-tags', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json() as VenueTag[];
      setTags(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching venue tags:', error);
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingTag(null);
    setFormData({
      id: '',
      description: ''
    });
    setShowModal(true);
  };

  const openEditModal = (tag: VenueTag) => {
    setEditingTag(tag);
    setFormData({
      id: tag.id,
      description: tag.description
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTag(null);
    setFormData({
      id: '',
      description: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingTag 
        ? `/api/venue-tags/${editingTag.id}`
        : '/api/venue-tags';
      
      const method = editingTag ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchTags();
        closeModal();
      } else {
        const error = await response.json() as { error?: string };
        alert(`Error: ${error.error || 'Failed to save tag'}`);
      }
    } catch (error) {
      console.error('Error saving tag:', error);
      alert('Error saving tag');
    }
  };

  const deleteTag = async (id: string) => {
    if (!confirm(`Are you sure you want to delete the tag "${id}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/venue-tags/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await fetchTags();
      } else {
        const error = await response.json() as { error?: string };
        alert(`Error: ${error.error || 'Failed to delete tag'}`);
      }
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('Error deleting tag');
    }
  };

  if (loading) return <div className="loading">Loading venue tags...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Venue Tags</h1>
        <button onClick={openAddModal} className="button button-primary">
          Add Tag
        </button>
      </div>

      <div className="card">
        <table className="table">
        <thead>
          <tr>
            <th>Tag ID</th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tags.map((tag) => (
            <tr key={tag.id}>
              <td><code>{tag.id}</code></td>
              <td>{tag.description}</td>
              <td>
                <button
                  onClick={() => openEditModal(tag)}
                  className="button button-secondary"
                  style={{ marginRight: '0.5rem' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteTag(tag.id)}
                  className="button button-danger"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

        {tags.length === 0 && (
          <p style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            No venue tags found. Click "Add Tag" to create one.
          </p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingTag ? 'Edit Tag' : 'Add Tag'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="id">Tag ID:</label>
                <input
                  type="text"
                  id="id"
                  value={formData.id}
                  onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().trim() })}
                  required
                  disabled={!!editingTag}
                  placeholder="e.g., bar, materials, accessible"
                  pattern="[a-z]+"
                  title="Only lowercase letters, no spaces"
                />
                <small style={{ display: 'block', marginTop: '5px', color: '#666' }}>
                  Lowercase letters only, no spaces
                </small>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <input
                  type="text"
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  maxLength={256}
                  placeholder="e.g., Bar or alcoholic drinks available"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} className="button">
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  {editingTag ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
