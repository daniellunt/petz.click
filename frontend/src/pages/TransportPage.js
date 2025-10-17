import React, { useState, useEffect, useCallback } from 'react';
import { useLoadScript, GoogleMap, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { transportAPI, clientAPI } from '@/utils/api';
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
import { Plus, Edit, Trash2, MapPin, Bus, Car, Navigation, Settings as SettingsIcon } from 'lucide-react';

const libraries = ['places', 'geometry'];
const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060,
};

const TransportPage = () => {
  const { selectedLocation } = useLocation();
  const [activeTab, setActiveTab] = useState('bookings');
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  if (!selectedLocation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please select a location to manage transport</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transport Management</h1>
        <p className="text-gray-600 mt-1">Manage transport services for {selectedLocation.name}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="bookings">Transport Bookings</TabsTrigger>
          <TabsTrigger value="stops">Bus Stops</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings">
          <TransportBookingsTab locationId={selectedLocation.id} />
        </TabsContent>

        <TabsContent value="stops">
          <BusStopsTab locationId={selectedLocation.id} />
        </TabsContent>

        <TabsContent value="settings">
          <TransportSettingsTab locationId={selectedLocation.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Bus Stops Management Tab
const BusStopsTab = ({ locationId }) => {
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [map, setMap] = useState(null);

  useEffect(() => {
    fetchStops();
  }, [locationId]);

  const fetchStops = async () => {
    try {
      const response = await transportAPI.getStops(locationId);
      setStops(response.data);
    } catch (error) {
      console.error('Failed to fetch stops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (stopId) => {
    if (window.confirm('Delete this bus stop?')) {
      try {
        await transportAPI.deleteStop(stopId);
        fetchStops();
      } catch (error) {
        alert('Failed to delete stop');
      }
    }
  };

  const onMapLoad = useCallback((map) => {
    setMap(map);
  }, []);

  if (loading) return <div>Loading stops...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Bus Stop
        </Button>
      </div>

      {/* Map showing all stops */}
      {stops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bus Stops Map</CardTitle>
          </CardHeader>
          <CardContent>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={stops[0] ? { lat: stops[0].latitude, lng: stops[0].longitude } : defaultCenter}
              zoom={12}
              onLoad={onMapLoad}
            >
              {stops.map((stop) => (
                <Marker
                  key={stop.id}
                  position={{ lat: stop.latitude, lng: stop.longitude }}
                  title={stop.name}
                  icon={{
                    url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                  }}
                />
              ))}
            </GoogleMap>
          </CardContent>
        </Card>
      )}

      {/* Stops List */}
      {stops.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bus className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No bus stops yet</h3>
            <p className="text-gray-600 mb-4">Add bus stops for your school bus route</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Bus Stop
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {stops.map((stop) => (
            <Card key={stop.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{stop.name}</CardTitle>
                    <CardDescription>{stop.address}</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(stop.id)}>
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>Lat: {stop.latitude.toFixed(6)}, Lng: {stop.longitude.toFixed(6)}</span>
                </div>
                {stop.notes && (
                  <p className="text-sm text-gray-600 mt-2">{stop.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Stop Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Bus Stop</DialogTitle>
          </DialogHeader>
          <BusStopForm
            locationId={locationId}
            onSave={() => {
              setShowForm(false);
              fetchStops();
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Bus Stop Form Component
const BusStopForm = ({ locationId, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    location_id: locationId,
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);

  const handleMapClick = useCallback((e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
    
    // Get address from coordinates
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setFormData(prev => ({
          ...prev,
          address: results[0].formatted_address
        }));
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await transportAPI.createStop(formData);
      onSave();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create stop');
    } finally {
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
        <Label>Click on map to set location</Label>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '300px' }}
          center={defaultCenter}
          zoom={12}
          onClick={handleMapClick}
          onLoad={setMap}
        >
          {formData.latitude !== 0 && formData.longitude !== 0 && (
            <Marker
              position={{ lat: formData.latitude, lng: formData.longitude }}
            />
          )}
        </GoogleMap>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Stop Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Main Street Stop"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address *</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
          placeholder="Click on map to get address"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Latitude</Label>
          <Input value={formData.latitude.toFixed(6)} readOnly />
        </div>
        <div className="space-y-2">
          <Label>Longitude</Label>
          <Input value={formData.longitude.toFixed(6)} readOnly />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any additional notes..."
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || formData.latitude === 0}>
          {loading ? 'Creating...' : 'Create Stop'}
        </Button>
      </div>
    </form>
  );
};

// Transport Bookings Tab - Placeholder for now
const TransportBookingsTab = ({ locationId }) => {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <Car className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-xl font-semibold mb-2">Transport Bookings</h3>
        <p className="text-gray-600">Booking interface coming in next update</p>
      </CardContent>
    </Card>
  );
};

// Transport Settings Tab
const TransportSettingsTab = ({ locationId }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, [locationId]);

  const fetchSettings = async () => {
    try {
      const response = await transportAPI.getSettings(locationId);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await transportAPI.updateSettings(locationId, settings);
      alert('Settings saved successfully');
    } catch (error) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transport Pricing</CardTitle>
        <CardDescription>Configure pricing for transport services</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <h3 className="font-semibold">Pet Taxi (Charged by KM)</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Base Rate ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings?.taxi_base_rate || 0}
                onChange={(e) => setSettings(prev => ({ ...prev, taxi_base_rate: parseFloat(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Per KM Rate ($)</Label>
              <Input
                type="number"
                step="0.01"
                value={settings?.taxi_per_km_rate || 0}
                onChange={(e) => setSettings(prev => ({ ...prev, taxi_per_km_rate: parseFloat(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold">School Bus (Flat Rate)</h3>
          <div className="space-y-2">
            <Label>Flat Rate ($)</Label>
            <Input
              type="number"
              step="0.01"
              value={settings?.school_bus_flat_rate || 0}
              onChange={(e) => setSettings(prev => ({ ...prev, school_bus_flat_rate: parseFloat(e.target.value) }))}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransportPage;
