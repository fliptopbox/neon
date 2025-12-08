import { useState, useEffect, useRef } from 'react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  const [formData, setFormData] = useState<UserFormData>({
    emailaddress: '',
    password: '',
    fullname: '',
    known_as: '',
  });

  useEffect(() => {
    fetchUsers();
    // Focus search input on mount
    setTimeout(() => searchInputRef.current?.focus(), 100);
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

  // Filter and sort users
  const filteredUsers = users.filter((user) => {
    if (searchQuery.length < 1) return true;
    
    const query = searchQuery.toLowerCase();
    const nameMatch = user.fullname?.toLowerCase().startsWith(query);
    const emailMatch = user.emailaddress?.toLowerCase().startsWith(query);
    const knownAsMatch = user.known_as?.toLowerCase().startsWith(query);
    
    return nameMatch || emailMatch || knownAsMatch;
  });

  // Sort: admins first (alphabetically), then regular users (alphabetically)
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    // If one is admin and the other isn't, admin comes first
    if (a.is_admin && !b.is_admin) return -1;
    if (!a.is_admin && b.is_admin) return 1;
    
    // Both are same role, sort alphabetically by name
    return (a.fullname || '').localeCompare(b.fullname || '');
  });

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1>Users</h1>
        <button onClick={openAddModal} className="button button-primary">
          Add User
        </button>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search by name, email, or known as..."
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
            Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="card desktop-table" style={{ display: 'block' }}>
        <style>{`
          @media (max-width: 768px) {
            .desktop-table { display: none !important; }
          }
          @media (min-width: 769px) {
            .users-mobile-list { display: none !important; }
          }
        `}</style>
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
            {sortedUsers.map((user, index) => {
              // Check if we need to add a separator
              const prevUser = index > 0 ? sortedUsers[index - 1] : null;
              const showSeparator = prevUser && prevUser.is_admin && !user.is_admin;
              
              return (
                <>
                  {showSeparator && (
                    <tr key={`separator-${user.id}`}>
                      <td colSpan={7} style={{ 
                        backgroundColor: '#f8f9fa', 
                        padding: '0.5rem 1rem',
                        fontWeight: 'bold',
                        fontSize: '0.875rem',
                        color: '#666',
                        borderTop: '2px solid #dee2e6',
                        borderBottom: '2px solid #dee2e6'
                      }}>
                        Regular Users
                      </td>
                    </tr>
                  )}
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
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="users-mobile-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sortedUsers.map((user, index) => {
          // Check if we need to add a separator
          const prevUser = index > 0 ? sortedUsers[index - 1] : null;
          const showSeparator = prevUser && prevUser.is_admin && !user.is_admin;
          
          return (
            <>
              {showSeparator && (
                <div key={`separator-${user.id}`} style={{
                  backgroundColor: '#f8f9fa',
                  padding: '0.75rem 1rem',
                  fontWeight: 'bold',
                  fontSize: '0.875rem',
                  color: '#666',
                  borderTop: '2px solid #dee2e6',
                  borderBottom: '2px solid #dee2e6',
                  borderRadius: '4px',
                  textAlign: 'center'
                }}>
                  Regular Users
                </div>
              )}
              <div key={user.id} className="card" style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.25rem' }}>
                  {user.fullname}
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.25rem' }}>
                  {user.emailaddress}
                </div>
                {user.known_as && (
                  <div style={{ fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
                    Known as: {user.known_as}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
                <span style={{ 
                  padding: '0.25rem 0.5rem', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  background: user.active ? '#28a745' : '#6c757d',
                  color: 'white'
                }}>
                  {user.active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.75rem' }}>
              Joined: {new Date(user.created_on).toLocaleDateString()}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => openEditModal(user)}
                className="button button-primary"
                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem', flex: '1 1 auto' }}
              >
                Edit
              </button>
              <button
                onClick={() => toggleAdmin(user.id)}
                className="button"
                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem', flex: '1 1 auto' }}
              >
                Toggle Admin
              </button>
              <button
                onClick={() => toggleUser(user.id)}
                className="button"
                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem', flex: '1 1 auto' }}
              >
                Toggle Status
              </button>
              <button
                onClick={() => deleteUser(user.id)}
                className="button button-danger"
                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem', flex: '1 1 auto' }}
              >
                Delete
              </button>
            </div>
          </div>
            </>
          );
        })}
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
