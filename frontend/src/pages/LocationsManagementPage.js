import React, { useState } from 'react';
import { useLocation } from '@/context/LocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, MapPin, Phone, Mail } from 'lucide-react';

const LocationForm = ({ location, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: location?.name || '',
    address: location?.address || '',
    city: location?.city || '',
    state: location?.state || '',
    zip_code: location?.zip_code || '',
    country: location?.country || 'USA',
    phone: location?.phone || '',
    email: location?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await onSave(formData);
    
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
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="name">Location Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Downtown Location"
            required
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Main St"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City *</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="New York"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="NY"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zip_code">ZIP Code</Label>
          <Input
            id="zip_code"
            name="zip_code"
            value={formData.zip_code}
            onChange={handleChange}
            placeholder="10001"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            placeholder="USA"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 555-0100"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="location@example.com"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (location ? 'Update Location' : 'Create Location')}
        </Button>
      </div>
    </form>
  );
};

const LocationsManagementPage = () => {
  const { locations, createLocation, updateLocation, deleteLocation, refreshLocations } = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const handleSave = async (formData) => {
    const result = editingLocation
      ? await updateLocation(editingLocation.id, formData)
      : await createLocation(formData);
    
    if (result.success) {
      setShowForm(false);
      setEditingLocation(null);
      refreshLocations();
    }
    
    return result;
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setShowForm(true);
  };

  const handleDelete = async (location) => {
    if (window.confirm(`Are you sure you want to delete ${location.name}?`)) {
      await deleteLocation(location.id);
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingLocation(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600 mt-1">Manage your business locations</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Location
        </Button>
      </div>

      {locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No locations yet</h3>
            <p className="text-gray-600 mb-4">Add your first location to get started</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {locations.map((location) => (
            <Card key={location.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{location.name}</CardTitle>
                    <CardDescription>{location.city}, {location.state}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p>{location.address}</p>
                      <p className="text-gray-500">
                        {location.city}, {location.state} {location.zip_code}
                      </p>
                    </div>
                  </div>
                  
                  {location.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{location.phone}</span>
                    </div>
                  )}
                  
                  {location.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{location.email}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(location)} className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(location)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Location Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
          </DialogHeader>
          <LocationForm
            location={editingLocation}
            onSave={handleSave}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationsManagementPage;
