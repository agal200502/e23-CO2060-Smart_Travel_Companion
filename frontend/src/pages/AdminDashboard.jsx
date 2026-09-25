import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Users, MapPin, Home as HomeIcon, Trash2, Edit2, Plus } from 'lucide-react';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('locations');
  const [locations, setLocations] = useState([]);
  const [users, setUsers] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingLocation, setEditingLocation] = useState(null);
  const [editingAccommodationId, setEditingAccommodationId] = useState(null);
  const [editingAccommodation, setEditingAccommodation] = useState(null);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  const [newLocation, setNewLocation] = useState({ name: '', description: '', district: '', category: '', imageUrl: '', latitude: 0, longitude: 0 });

  // ✅ NEW: state for adding new accommodation
  const [newAccommodation, setNewAccommodation] = useState({ name: '', price: '', rating: '', imageUrl: '', locationId: '' });
  const [showAddAccommodation, setShowAddAccommodation] = useState(false);

  useEffect(() => {
    fetchData();
    if (activeTab === 'accommodations') {
      fetchLocationOptions();
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'locations') {
        const res = await api.get('/locations');
        setLocations(res.data);
      } else if (activeTab === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } else if (activeTab === 'accommodations') {
        const res = await api.get('/accommodations');
        setAccommodations(res.data);
      } else if (activeTab === 'bookings') {
        const res = await api.get('/admin/bookings');
        setBookings(res.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLocationOptions = async () => {
    try {
      const res = await api.get('/locations');
      setLocationOptions(res.data);
    } catch (err) {
      console.error('Failed to load location options', err);
    }
  };

  const startEditLocation = (loc) => {
    setEditingLocationId(loc.id);
    setEditingLocation({ ...loc });
  };

  const cancelEditLocation = () => {
    setEditingLocationId(null);
    setEditingLocation(null);
  };

  const saveLocation = async () => {
    try {
      await api.put(`/admin/locations/${editingLocationId}`, editingLocation);
      cancelEditLocation();
      fetchData();
      alert('Location updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update location');
    }
  };

  const startEditAccommodation = (acc) => {
    setEditingAccommodationId(acc.id);
    setEditingAccommodation({
      id: acc.id,
      name: acc.name,
      price: acc.price,
      rating: acc.rating,
      totalRooms: acc.totalRooms,
      imageUrl: acc.imageUrl,
      locationId: acc.locationId || acc.location?.id,
    });
  };

  const cancelEditAccommodation = () => {
    setEditingAccommodationId(null);
    setEditingAccommodation(null);
  };

  const saveAccommodation = async () => {
    try {
      const body = {
        name: editingAccommodation.name,
        price: editingAccommodation.price,
        rating: editingAccommodation.rating,
        totalRooms: editingAccommodation.totalRooms,
        imageUrl: editingAccommodation.imageUrl,
      };
      if (editingAccommodation.locationId) {
        body.location = { id: editingAccommodation.locationId };
      }
      await api.put(`/admin/accommodations/${editingAccommodationId}`, body);
      cancelEditAccommodation();
      fetchData();
      alert('Accommodation updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update accommodation');
    }
  };

  // ✅ NEW: Add new accommodation
  const handleAddAccommodation = async (e) => {
    e.preventDefault();

    // ADD THIS LINE:
  console.log('SENDING:', JSON.stringify({
    name: newAccommodation.name,
    price: parseFloat(newAccommodation.price),
    rating: parseFloat(newAccommodation.rating),
    imageUrl: newAccommodation.imageUrl,
    location: { id: parseInt(newAccommodation.locationId) },
  }));
  
  // ... rest of your code


    if (!newAccommodation.locationId) {
      alert('Please select a location');
      return;
    }
    try {
      const body = {
        name: newAccommodation.name,
        price: parseFloat(newAccommodation.price),
        rating: parseFloat(newAccommodation.rating),
        imageUrl: newAccommodation.imageUrl,
        location: { id: parseInt(newAccommodation.locationId) },
      };
      await api.post('/admin/accommodations', body);
      setNewAccommodation({ name: '', price: '', rating: '', imageUrl: '', locationId: '' });
      setShowAddAccommodation(false);
      fetchData();
      alert('Accommodation added successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to add accommodation');
    }
  };

  const startEditUser = (usr) => {
    setEditingUserId(usr.id);
    setEditingUser({ ...usr });
  };

  const cancelEditUser = () => {
    setEditingUserId(null);
    setEditingUser(null);
  };

  const saveUser = async () => {
    try {
      await api.put(`/admin/users/${editingUserId}`, editingUser);
      cancelEditUser();
      fetchData();
      alert('User updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update user');
    }
  };

  const handleDeleteLocation = async (id) => {
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        await api.delete(`/admin/locations/${id}`);
        fetchData();
      } catch (err) {
        alert("Failed to delete");
      }
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/locations', newLocation);
      setNewLocation({ name: '', description: '', district: '', category: '', imageUrl: '', latitude: 0, longitude: 0 });
      fetchData();
      alert("Location added successfully!");
    } catch (err) {
      alert("Failed to add location");
    }
  };

  return (
    <div className="container animate-fade-in mb-4 mt-2">
      <h2 className="mb-2">Admin Dashboard</h2>
      
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button className={`btn ${activeTab === 'locations' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('locations')}><MapPin className="icon-inline"/> Manage Places</button>
        <button className={`btn ${activeTab === 'accommodations' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('accommodations')}><HomeIcon className="icon-inline"/> Accommodations</button>
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('users')}><Users className="icon-inline"/> View Users</button>
        <button className={`btn ${activeTab === 'bookings' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('bookings')}>Bookings</button>
      </div>

      <div className="glass p-4" style={{ padding: '2rem', borderRadius: 'var(--radius)' }}>
        {activeTab === 'locations' && (
          <div>
            <h3>Locations</h3>
            <table style={{ width: '100%', textAlign: 'left', marginTop: '1rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.5rem' }}>ID</th>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>District</th>
                  <th style={{ padding: '0.5rem' }}>Category</th>
                  <th style={{ padding: '0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.map(loc => (
                  <tr key={loc.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.5rem' }}>{loc.id}</td>
                    <td style={{ padding: '0.5rem' }}>{loc.name}</td>
                    <td style={{ padding: '0.5rem' }}>{loc.district}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', background: 'rgba(0,212,170,0.15)', color: 'var(--primary)', padding: '0.1rem 0.5rem', borderRadius: '12px' }}>
                        {loc.category || 'N/A'}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <button onClick={() => startEditLocation(loc)} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', marginRight: '0.5rem' }}><Edit2 size={14}/></button>
                      <button onClick={() => handleDeleteLocation(loc.id)} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', color: '#ff4d4f', borderColor: '#ff4d4f' }}><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {editingLocationId && editingLocation && (
              <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius)' }}>
                <h4>Edit Location</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <input className="form-control" placeholder="Name" value={editingLocation.name} onChange={e => setEditingLocation({ ...editingLocation, name: e.target.value })} required />
                  <input className="form-control" placeholder="District" value={editingLocation.district} onChange={e => setEditingLocation({ ...editingLocation, district: e.target.value })} required />
                  <input className="form-control" placeholder="Category / Interests (e.g. NATURE, WILDLIFE, HISTORY)" value={editingLocation.category || ''} onChange={e => setEditingLocation({ ...editingLocation, category: e.target.value })} style={{ gridColumn: 'span 2' }} />
                  <input className="form-control" placeholder="Image URL" value={editingLocation.imageUrl} onChange={e => setEditingLocation({ ...editingLocation, imageUrl: e.target.value })} required style={{ gridColumn: 'span 2' }} />
                  <textarea className="form-control" placeholder="Description" value={editingLocation.description} onChange={e => setEditingLocation({ ...editingLocation, description: e.target.value })} required style={{ gridColumn: 'span 2' }} />
                  <input className="form-control" type="number" step="0.0001" placeholder="Latitude" value={editingLocation.latitude} onChange={e => setEditingLocation({ ...editingLocation, latitude: parseFloat(e.target.value) })} required />
                  <input className="form-control" type="number" step="0.0001" placeholder="Longitude" value={editingLocation.longitude} onChange={e => setEditingLocation({ ...editingLocation, longitude: parseFloat(e.target.value) })} required />
                  <button type="button" className="btn btn-primary" style={{ gridColumn: 'span 1' }} onClick={saveLocation}><Edit2 className="icon-inline"/> Save</button>
                  <button type="button" className="btn btn-outline" style={{ gridColumn: 'span 1' }} onClick={cancelEditLocation}>Cancel</button>
                </div>
              </div>
            )}

            <h3 style={{ marginTop: '3rem' }}>Add New Location</h3>
            <form onSubmit={handleAddLocation} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
              <input className="form-control" placeholder="Name" value={newLocation.name} onChange={e => setNewLocation({...newLocation, name: e.target.value})} required />
              <input className="form-control" placeholder="District" value={newLocation.district} onChange={e => setNewLocation({...newLocation, district: e.target.value})} required />
              <input className="form-control" placeholder="Category / Interests (e.g. NATURE, WILDLIFE, HISTORY)" value={newLocation.category} onChange={e => setNewLocation({...newLocation, category: e.target.value})} style={{ gridColumn: 'span 2' }} />
              <input className="form-control" placeholder="Image URL" value={newLocation.imageUrl} onChange={e => setNewLocation({...newLocation, imageUrl: e.target.value})} required style={{ gridColumn: 'span 2' }} />
              <textarea className="form-control" placeholder="Description" value={newLocation.description} onChange={e => setNewLocation({...newLocation, description: e.target.value})} required style={{ gridColumn: 'span 2' }} />
              <input className="form-control" type="number" step="0.0001" placeholder="Latitude" value={newLocation.latitude} onChange={e => setNewLocation({...newLocation, latitude: parseFloat(e.target.value)})} required />
              <input className="form-control" type="number" step="0.0001" placeholder="Longitude" value={newLocation.longitude} onChange={e => setNewLocation({...newLocation, longitude: parseFloat(e.target.value)})} required />
              <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}><Plus className="icon-inline"/> Add Location</button>
            </form>
          </div>
        )}

        {activeTab === 'users' && (
          <div>
            <h3>Registered Users</h3>
            {editingUserId && editingUser && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius)' }}>
                <h4>Edit User</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <input className="form-control" placeholder="Name" value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} required />
                  <input className="form-control" placeholder="Email" value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} required />
                  <select className="form-control" value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })} style={{ gridColumn: 'span 2' }}>
                    <option value="ROLE_USER">User</option>
                    <option value="ROLE_ADMIN">Admin</option>
                  </select>
                  <button type="button" className="btn btn-primary" onClick={saveUser}><Edit2 className="icon-inline"/> Save</button>
                  <button type="button" className="btn btn-outline" onClick={cancelEditUser}>Cancel</button>
                </div>
              </div>
            )}
            <table style={{ width: '100%', textAlign: 'left', marginTop: '1rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.5rem' }}>ID</th>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>Email</th>
                  <th style={{ padding: '0.5rem' }}>Role</th>
                  <th style={{ padding: '0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.5rem' }}>{u.id}</td>
                    <td style={{ padding: '0.5rem' }}>{u.name}</td>
                    <td style={{ padding: '0.5rem' }}>{u.email}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{ 
                        background: u.role === 'ROLE_ADMIN' ? 'rgba(255, 126, 95, 0.2)' : 'rgba(255,255,255,0.1)',
                        padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem'
                      }}>{u.role}</span>
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <button onClick={() => startEditUser(u)} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }}><Edit2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'accommodations' && (
          <div>
            <h3>Accommodations</h3>

            {editingAccommodationId && editingAccommodation && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius)' }}>
                <h4>Edit Accommodation</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <input className="form-control" placeholder="Name" value={editingAccommodation.name} onChange={e => setEditingAccommodation({ ...editingAccommodation, name: e.target.value })} required />
                  <input className="form-control" type="number" placeholder="Price" value={editingAccommodation.price} onChange={e => setEditingAccommodation({ ...editingAccommodation, price: e.target.value })} required />
                  <input className="form-control" type="number" step="0.1" placeholder="Rating" value={editingAccommodation.rating} onChange={e => setEditingAccommodation({ ...editingAccommodation, rating: e.target.value })} required />
                  <input className="form-control" type="number" min="0" placeholder="Available Rooms" value={editingAccommodation.totalRooms} onChange={e => setEditingAccommodation({ ...editingAccommodation,totalRooms: e.target.value === ""? "": Number(e.target.value)})}required/>
                  <input className="form-control" placeholder="Image URL" value={editingAccommodation.imageUrl} onChange={e => setEditingAccommodation({ ...editingAccommodation, imageUrl: e.target.value })} required />
                  <select className="form-control" value={editingAccommodation.locationId || ''} onChange={e => setEditingAccommodation({ ...editingAccommodation, locationId: Number(e.target.value) })} style={{ gridColumn: 'span 2' }}>
                    <option value="">Keep Current Location</option>
                    {locationOptions.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-primary" onClick={saveAccommodation}><Edit2 className="icon-inline"/> Save</button>
                  <button type="button" className="btn btn-outline" onClick={cancelEditAccommodation}>Cancel</button>
                </div>
              </div>
            )}

            <table style={{ width: '100%', textAlign: 'left', marginTop: '1rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.5rem' }}>ID</th>
                  <th style={{ padding: '0.5rem' }}>Name</th>
                  <th style={{ padding: '0.5rem' }}>Price</th>
                  <th style={{ padding: '0.5rem' }}>Rating</th>
                  <th style={{ padding: '0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accommodations.map(acc => (
                  <tr key={acc.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.5rem' }}>{acc.id}</td>
                    <td style={{ padding: '0.5rem' }}>{acc.name}</td>
                    <td style={{ padding: '0.5rem' }}>${acc.price}</td>
                    <td style={{ padding: '0.5rem' }}>{acc.rating}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <button onClick={() => startEditAccommodation(acc)} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', marginRight: '0.5rem' }}><Edit2 size={14}/></button>
                      <button onClick={async () => {
                        if (window.confirm("Delete accommodation?")) {
                          await api.delete(`/admin/accommodations/${acc.id}`);
                          fetchData();
                        }
                      }} className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', color: '#ff4d4f', borderColor: '#ff4d4f' }}><Trash2 size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ✅ NEW: Add New Accommodation Section */}
            <div style={{ marginTop: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3>Add New Accommodation</h3>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => setShowAddAccommodation(!showAddAccommodation)}
                >
                  {showAddAccommodation ? 'Cancel' : <><Plus size={14}/> Add New</>}
                </button>
              </div>

              {showAddAccommodation && (
                <form onSubmit={handleAddAccommodation} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius)' }}>
                  <input
                    className="form-control"
                    placeholder="Hotel Name"
                    value={newAccommodation.name}
                    onChange={e => setNewAccommodation({ ...newAccommodation, name: e.target.value })}
                    required
                  />
                  <input
                    className="form-control"
                    type="number"
                    placeholder="Price per night ($)"
                    value={newAccommodation.price}
                    onChange={e => setNewAccommodation({ ...newAccommodation, price: e.target.value })}
                    required
                  />
                  <input
                    className="form-control"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    placeholder="Rating (0 - 5)"
                    value={newAccommodation.rating}
                    onChange={e => setNewAccommodation({ ...newAccommodation, rating: e.target.value })}
                    required
                  />
                  <select
                    className="form-control"
                    value={newAccommodation.locationId}
                    onChange={e => setNewAccommodation({ ...newAccommodation, locationId: e.target.value })}
                    required
                  >
                    <option value="">Select Location</option>
                    {locationOptions.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <input
                    className="form-control"
                    placeholder="Image URL"
                    value={newAccommodation.imageUrl}
                    onChange={e => setNewAccommodation({ ...newAccommodation, imageUrl: e.target.value })}
                    style={{ gridColumn: 'span 2' }}
                  />
                  <button type="submit" className="btn btn-primary" style={{ gridColumn: 'span 2' }}>
                    <Plus className="icon-inline"/> Add Accommodation
                  </button>
                </form>
              )}
            </div>

          </div>
        )}

        {activeTab === 'bookings' && (
          <div>
            <h3>All Bookings</h3>
            <table style={{ width: '100%', textAlign: 'left', marginTop: '1rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '0.5rem' }}>ID</th>
                  <th style={{ padding: '0.5rem' }}>User</th>
                  <th style={{ padding: '0.5rem' }}>Accommodation</th>
                  <th style={{ padding: '0.5rem' }}>Check-In</th>
                  <th style={{ padding: '0.5rem' }}>Check-Out</th>
                  <th style={{ padding: '0.5rem' }}>Guests</th>
                  <th style={{ padding: '0.5rem' }}>Status</th>
                  <th style={{ padding: '0.5rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.5rem' }}>{b.id}</td>
                    <td style={{ padding: '0.5rem' }}>{b.user?.name} ({b.user?.email})</td>
                    <td style={{ padding: '0.5rem' }}>{b.accommodation?.name}</td>
                    <td style={{ padding: '0.5rem' }}>{new Date(b.checkIn).toLocaleDateString()}</td>
                    <td style={{ padding: '0.5rem' }}>{new Date(b.checkOut).toLocaleDateString()}</td>
                    <td style={{ padding: '0.5rem' }}>{b.guests}</td>
                    <td style={{ padding: '0.5rem' }}>{b.status}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {b.status === 'PENDING' && (
                        <button onClick={async () => { try { await api.put(`/admin/bookings/${b.id}/confirm`); fetchData(); } catch (err) { alert('Failed to confirm'); } }} className="btn btn-primary" style={{ marginRight: 8 }}>Confirm</button>
                      )}
                      {b.status !== 'CANCELLED' && (
                        <button onClick={async () => { if (window.confirm('Cancel this booking?')) { try { await api.delete(`/admin/bookings/${b.id}`); fetchData(); } catch (err) { alert('Failed to cancel'); } } }} className="btn btn-outline">Cancel</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
