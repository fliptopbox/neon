import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProfileData {
  fullname: string;
  known_as: string;
  description: string;
  instagram: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData>({
    fullname: '',
    known_as: '',
    description: '',
    instagram: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setProfile({
        fullname: data.fullname || '',
        known_as: data.known_as || '',
        description: data.description || '',
        instagram: data.instagram || '',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      await fetch('/api/users/me/bio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      setMessage('Profile updated successfully!');
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Loading profile...</div>;

  return (
    <div className="container">
      <h1>Profile</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullname">Full Name</label>
            <input
              id="fullname"
              type="text"
              className="input"
              value={profile.fullname}
              onChange={(e) => setProfile({ ...profile, fullname: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="known_as">Known As</label>
            <input
              id="known_as"
              type="text"
              className="input"
              value={profile.known_as}
              onChange={(e) => setProfile({ ...profile, known_as: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="instagram">Instagram</label>
            <input
              id="instagram"
              type="text"
              className="input"
              value={profile.instagram}
              onChange={(e) => setProfile({ ...profile, instagram: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              className="input"
              rows={4}
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
            />
          </div>
          {message && (
            <p className={message.includes('success') ? 'success' : 'error'}>{message}</p>
          )}
          <button type="submit" className="button button-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
