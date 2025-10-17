import React, { useState, useEffect } from 'react';
import { userAPI, locationAPI } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, UserX, UserCheck, Mail, Phone, Shield } from 'lucide-react';

const UserForm = ({ user, locations, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    role: user?.role || 'staff',
    location_ids: user?.location_ids || [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleLocationToggle = (locationId) => {
    setFormData(prev => ({
      ...prev,
      location_ids: prev.location_ids.includes(locationId)
        ? prev.location_ids.filter(id => id !== locationId)
        : [...prev.location_ids, locationId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Remove password if empty on edit
    const submitData = { ...formData };
    if (user && !submitData.password) {
      delete submitData.password;
    }

    const result = await onSave(submitData);
    
    if (!result.success) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@example.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 555-0100"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password {!user && '*'}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={user ? 'Leave blank to keep current' : '••••••••'}
            required={!user}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin - Full Access</SelectItem>
              <SelectItem value="staff">Staff - Limited Access</SelectItem>
              <SelectItem value="client">Client - Customer Portal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Location Access */}
      <div className="space-y-2">
        <Label>Location Access</Label>
        <div className="border rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
          {locations.length === 0 ? (
            <p className="text-sm text-gray-500">No locations available</p>
          ) : (
            locations.map(location => (
              <div key={location.id} className="flex items-center">
                <input
                  type="checkbox"
                  id={`location-${location.id}`}
                  checked={formData.location_ids.includes(location.id)}
                  onChange={() => handleLocationToggle(location.id)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor={`location-${location.id}`} className="ml-2 text-sm">
                  {location.name} - {location.city}
                </label>
              </div>
            ))
          )}
        </div>
        <p className="text-xs text-gray-500">Select which locations this user can access</p>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
        </Button>
      </div>
    </form>
  );
};

const UsersManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, locationsRes] = await Promise.all([
        userAPI.getAll(),
        locationAPI.getAll()
      ]);
      setUsers(usersRes.data);
      setLocations(locationsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingUser) {
        await userAPI.update(editingUser.id, formData);
      } else {
        await userAPI.create(formData);
      }
      
      setShowForm(false);
      setEditingUser(null);
      fetchData();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to save user'
      };
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.is_active) {
        await userAPI.deactivate(user.id);
      } else {
        await userAPI.activate(user.id);
      }
      fetchData();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to update user status');
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const getRoleBadge = (role) => {
    const styles = {
      admin: 'bg-red-100 text-red-800',
      staff: 'bg-blue-100 text-blue-800',
      client: 'bg-gray-100 text-gray-800'
    };
    return styles[role] || styles.client;
  };

  if (loading) {
    return <div className="text-center py-12">Loading users...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users & Permissions</h1>
          <p className="text-gray-600 mt-1">Manage staff accounts and access levels</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {users.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No users yet</h3>
            <p className="text-gray-600 mb-4">Add your first staff member</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {user.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold">{user.name}</h3>
                        <Badge className={getRoleBadge(user.role)}>
                          {user.role}
                        </Badge>
                        {!user.is_active && (
                          <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-4 w-4" />
                          {user.phone}
                        </div>
                        {user.location_ids.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4" />
                            {user.location_ids.length} location(s)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleToggleActive(user)}
                      className={user.is_active ? 'text-red-600' : 'text-green-600'}
                    >
                      {user.is_active ? (
                        <>
                          <UserX className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* User Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <UserForm
            user={editingUser}
            locations={locations}
            onSave={handleSave}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagementPage;
