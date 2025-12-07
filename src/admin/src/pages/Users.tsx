import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../config/api';

interface User {
  id: number;
  emailaddress: string;
  fullname: string;
  active: number;
  created_on: string;
  known_as: string | null;
  is_admin: boolean;
}

interface UserFormData {
  emailaddress: string;
  password: string;
  fullname: string;
  known_as: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { token } = useAuth();

  const [formData, setFormData] = useState<UserFormData>({
    emailaddress: '',
    password: '',
    fullname: '',
    known_as: '',
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch(getApiUrl('/api/users'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json() as User[];
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      emailaddress: '',
      password: '',
      fullname: '',
      known_as: '',
    });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      emailaddress: user.emailaddress,
      password: '',
      fullname: user.fullname,
      known_as: user.known_as || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingUser) {
        // Update user bio via /api/users/me/bio endpoint
        // Note: This requires the user to be logged in as that user
        // For now, we'll just show a message
        alert('User editing is not yet fully implemented. Use the profile page to edit your own details.');
        setShowModal(false);
      } else {
        // Create new user via register endpoint
        const response = await fetch(getApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.emailaddress,
            password: formData.password,
            fullname: formData.fullname,
            known_as: formData.known_as,
          }),
        });

        if (response.ok) {
          setShowModal(false);
          fetchUsers();
        } else {
          const errorData = await response.json() as { error?: string };
          alert(`Error: ${errorData.error || 'Failed to create user'}`);
        }
      }
    } catch (error) {
      console.error('Failed to save user:', error);
      alert('Failed to save user');
    }
  };

  const toggleUser = async (id: number) => {
    try {
      await fetch(getApiUrl(`/api/users/${id}/toggle`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (error) {
      console.error('Failed to toggle user:', error);
    }
  };

  const toggleAdmin = async (id: number) => {
    try {
      await fetch(getApiUrl(`/api/users/${id}/toggle-admin`), {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (error) {
      console.error('Failed to toggle admin:', error);
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;

    try {
      await fetch(getApiUrl(`/api/users/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Users</h1>
        <button onClick={openAddModal} className="button button-primary">
          Add User
        </button>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Known As</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.emailaddress}</td>
                <td>{user.fullname}</td>
                <td>{user.known_as || '-'}</td>
                <td>
                  <span style={{ 
                    padding: '0.25rem 0.5rem', 
                    borderRadius: '4px', 
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: user.is_admin ? '#007bff' : '#6c757d',
                    color: 'white'
                  }}>
                    {user.is_admin ? 'Admin' : 'User'}
                  </span>
                </td>
                <td>{user.active ? 'Active' : 'Inactive'}</td>
                <td>{new Date(user.created_on).toLocaleDateString()}</td>
                <td>
                  <button
                    onClick={() => openEditModal(user)}
                    className="button button-primary"
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem', marginRight: '0.5rem' }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleAdmin(user.id)}
                    className="button"
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem', marginRight: '0.5rem' }}
                  >
                    Toggle Admin
                  </button>
                  <button
                    onClick={() => toggleUser(user.id)}
                    className="button"
                    style={{ fontSize: '0.875rem', padding: '0.25rem 0.5rem', marginRight: '0.5rem' }}
                  >
                    Toggle Status
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
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
            <h2>{editingUser ? 'Edit User' : 'Add User'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formData.emailaddress}
                  onChange={(e) => setFormData({ ...formData, emailaddress: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>

              {!editingUser && (
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={8}
                  />
                  <small style={{ color: '#666' }}>Minimum 8 characters</small>
                </div>
              )}

              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.fullname}
                  onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Known As</label>
                <input
                  type="text"
                  value={formData.known_as}
                  onChange={(e) => setFormData({ ...formData, known_as: e.target.value })}
                  placeholder="Nickname or stage name"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowModal(false)} className="button">
                  Cancel
                </button>
                <button type="submit" className="button button-primary">
                  {editingUser ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
