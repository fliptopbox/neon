import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';

interface Artist {
  id: number;
  fullname: string;
  known_as: string | null;
  instagram: string | null;
  active: number;
}

export default function Artists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const response = await fetch(getApiUrl('/api/artists'));
      const data = await response.json() as Artist[];
      setArtists(data);
    } catch (error) {
      console.error('Failed to fetch artists:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingArtist(null);
    setShowModal(true);
  };

  const openEditModal = (artist: Artist) => {
    setEditingArtist(artist);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingArtist ? getApiUrl(`/api/artists/${editingArtist.id}`) : getApiUrl('/api/artists');
      const method = editingArtist ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        setShowModal(false);
        fetchArtists();
      } else {
        const errorData = await response.json() as { error?: string };
        alert(`Error: ${errorData.error || 'Failed to save artist'}`);
      }
    } catch (error) {
      console.error('Failed to save artist:', error);
      alert('Failed to save artist');
    }
  };

  const deleteArtist = async (id: number) => {
    if (!confirm('Are you sure you want to delete this artist?')) return;

    try {
      await fetch(getApiUrl(`/api/artists/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchArtists();
    } catch (error) {
      console.error('Failed to delete artist:', error);
    }
  };

  if (loading) return <div className="loading">Loading artists...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Artists</h1>
        <button onClick={openAddModal} className="button button-primary">
          Add Artist
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Known As</th>
              <th>Instagram</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {artists.map((artist) => (
              <tr key={artist.id}>
                <td>{artist.fullname}</td>
                <td>{artist.known_as || '-'}</td>
                <td>{artist.instagram || '-'}</td>
                <td>{artist.active ? 'Active' : 'Inactive'}</td>
                <td>
                  <button
                    onClick={() => openEditModal(artist)}
                    className="button button-primary"
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem', marginRight: '0.5rem' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteArtist(artist.id)}
                    className="button button-danger"
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingArtist ? 'Edit Artist' : 'Add Artist'}</h2>
            <form onSubmit={handleSubmit}>
              <p>
                {editingArtist
                  ? 'Update this artist record. Artist details are managed through their user bio.'
                  : 'Create a new artist record. This will link to your current user account. Update artist details through their user bio.'}
              </p>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="button">
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  {editingArtist ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
