import React, { useState, useEffect } from 'react';
import { serviceAPI } from '@/utils/api';
import { useLocation } from '@/context/LocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, DollarSign, Clock, Calendar } from 'lucide-react';

const ServiceForm = ({ service, onSave, onCancel, locationId }) => {
  const [formData, setFormData] = useState({
    location_id: service?.location_id || locationId,
    name: service?.name || '',
    description: service?.description || '',
    booking_type: service?.booking_type || 'time_slot',
    species: service?.species || 'all',
    duration_minutes: service?.duration_minutes || 60,
    pricing: service?.pricing || { type: 'fixed', amount: 0 },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePricingChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Convert duration to number
    const submitData = {
      ...formData,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      pricing: {
        ...formData.pricing,
        amount: parseFloat(formData.pricing.amount) || 0
      }
    };

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

      <div className="space-y-2">
        <Label htmlFor="name">Service Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Daycare, Boarding, Grooming"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your service..."
          rows={3}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="booking_type">Booking Type *</Label>
          <Select value={formData.booking_type} onValueChange={(value) => setFormData(prev => ({ ...prev, booking_type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time_slot">Time Slot</SelectItem>
              <SelectItem value="overnight">Overnight/Boarding</SelectItem>
              <SelectItem value="daycare">Daycare</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="species">Species *</Label>
          <Select value={formData.species} onValueChange={(value) => setFormData(prev => ({ ...prev, species: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Species</SelectItem>
              <SelectItem value="dog">Dogs Only</SelectItem>
              <SelectItem value="cat">Cats Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.booking_type === 'time_slot' && (
          <div className="space-y-2">
            <Label htmlFor="duration_minutes">Duration (minutes)</Label>
            <Input
              id="duration_minutes"
              name="duration_minutes"
              type="number"
              value={formData.duration_minutes || ''}
              onChange={handleChange}
              placeholder="60"
            />
          </div>
        )}
      </div>

      {/* Pricing Section */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">Pricing</h3>
        
        <div className="space-y-2">
          <Label htmlFor="pricing_type">Pricing Type *</Label>
          <Select 
            value={formData.pricing.type} 
            onValueChange={(value) => handlePricingChange('type', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed Price</SelectItem>
              <SelectItem value="per_size">Price by Pet Size</SelectItem>
              <SelectItem value="per_day">Price per Day</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {formData.pricing.type === 'fixed' && (
          <div className="space-y-2">
            <Label htmlFor="amount">Price *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.pricing.amount || ''}
                onChange={(e) => handlePricingChange('amount', e.target.value)}
                className="pl-7"
                placeholder="0.00"
                required
              />
            </div>
          </div>
        )}

        {formData.pricing.type === 'per_size' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-500">Per-size pricing will be configurable after creation</p>
            <div className="space-y-2">
              <Label>Base Price *</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.pricing.amount || ''}
                  onChange={(e) => handlePricingChange('amount', e.target.value)}
                  className="pl-7"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (service ? 'Update Service' : 'Create Service')}
        </Button>
      </div>
    </form>
  );
};

const AddonForm = ({ onSave, onCancel, locationId }) => {
  const [formData, setFormData] = useState({
    location_id: locationId,
    name: '',
    description: '',
    pricing_type: 'one_off',
    price: 0,
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

    const submitData = {
      ...formData,
      price: parseFloat(formData.price)
    };

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

      <div className="space-y-2">
        <Label htmlFor="name">Add-on Name *</Label>
        <Input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Bath, Nail Trim, Extra Walk"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe this add-on..."
          rows={2}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pricing_type">Pricing Type *</Label>
          <Select value={formData.pricing_type} onValueChange={(value) => setFormData(prev => ({ ...prev, pricing_type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="one_off">One-time Fee</SelectItem>
              <SelectItem value="per_day">Per Day</SelectItem>
              <SelectItem value="per_km">Per Kilometer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-500">$</span>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              className="pl-7"
              placeholder="0.00"
              required
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Add-on'}
        </Button>
      </div>
    </form>
  );
};

const ServicesManagementPage = () => {
  const { selectedLocation } = useLocation();
  const [services, setServices] = useState([]);
  const [addons, setAddons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [showAddonForm, setShowAddonForm] = useState(false);
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    if (selectedLocation) {
      fetchData();
    }
  }, [selectedLocation]);

  const fetchData = async () => {
    try {
      const [servicesRes, addonsRes] = await Promise.all([
        serviceAPI.getAll(selectedLocation?.id),
        serviceAPI.getAddons(selectedLocation?.id)
      ]);
      setServices(servicesRes.data);
      setAddons(addonsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveService = async (formData) => {
    try {
      if (editingService) {
        await serviceAPI.update(editingService.id, formData);
      } else {
        await serviceAPI.create(formData);
      }
      
      setShowServiceForm(false);
      setEditingService(null);
      fetchData();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to save service'
      };
    }
  };

  const handleSaveAddon = async (formData) => {
    try {
      await serviceAPI.createAddon(formData);
      setShowAddonForm(false);
      fetchData();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to create add-on'
      };
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleDeleteService = async (service) => {
    if (window.confirm(`Are you sure you want to delete ${service.name}?`)) {
      try {
        await serviceAPI.delete(service.id);
        fetchData();
      } catch (error) {
        alert('Failed to delete service');
      }
    }
  };

  const handleDeleteAddon = async (addon) => {
    if (window.confirm(`Are you sure you want to delete ${addon.name}?`)) {
      try {
        await serviceAPI.deleteAddon(addon.id);
        fetchData();
      } catch (error) {
        alert('Failed to delete add-on');
      }
    }
  };

  const handleCloseServiceForm = () => {
    setShowServiceForm(false);
    setEditingService(null);
  };

  if (!selectedLocation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please select a location to manage services</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Loading services...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services & Pricing</h1>
          <p className="text-gray-600 mt-1">Configure services for {selectedLocation.name}</p>
        </div>
      </div>

      <Tabs defaultValue="services" className="space-y-6">
        <TabsList>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="addons">Add-ons</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowServiceForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>

          {services.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No services yet</h3>
                <p className="text-gray-600 mb-4">Create your first service</p>
                <Button onClick={() => setShowServiceForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{service.name}</CardTitle>
                        <CardDescription>{service.booking_type}</CardDescription>
                      </div>
                      <Badge>{service.species}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {service.description && (
                        <p className="text-sm text-gray-600">{service.description}</p>
                      )}
                      
                      <div className="flex items-center gap-2 text-sm">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span className="font-semibold">${service.pricing.amount}</span>
                        <span className="text-gray-500">({service.pricing.type})</span>
                      </div>

                      {service.duration_minutes && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {service.duration_minutes} minutes
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => handleEditService(service)} className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteService(service)} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="addons" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowAddonForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Add-on
            </Button>
          </div>

          {addons.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Plus className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold mb-2">No add-ons yet</h3>
                <p className="text-gray-600 mb-4">Create optional add-ons for your services</p>
                <Button onClick={() => setShowAddonForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Add-on
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {addons.map((addon) => (
                <Card key={addon.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{addon.name}</h3>
                        <p className="text-sm text-gray-600">{addon.description}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteAddon(addon)}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold">${addon.price}</span>
                      <Badge variant="secondary" className="text-xs">{addon.pricing_type}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Service Form Dialog */}
      <Dialog open={showServiceForm} onOpenChange={setShowServiceForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
          </DialogHeader>
          <ServiceForm
            service={editingService}
            onSave={handleSaveService}
            onCancel={handleCloseServiceForm}
            locationId={selectedLocation?.id}
          />
        </DialogContent>
      </Dialog>

      {/* Add-on Form Dialog */}
      <Dialog open={showAddonForm} onOpenChange={setShowAddonForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Add-on</DialogTitle>
          </DialogHeader>
          <AddonForm
            onSave={handleSaveAddon}
            onCancel={() => setShowAddonForm(false)}
            locationId={selectedLocation?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesManagementPage;
