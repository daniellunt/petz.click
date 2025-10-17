import React, { useState, useEffect } from 'react';
import { roomAPI } from '@/utils/api';
import { useLocation } from '@/context/LocationContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Building, CheckCircle, XCircle } from 'lucide-react';

const RoomForm = ({ room, onSave, onCancel, locationId }) => {
  const [formData, setFormData] = useState({
    location_id: room?.location_id || locationId,
    name: room?.name || '',
    room_type: room?.room_type || 'kennel',
    capacity: room?.capacity || 1,
    size_restrictions: room?.size_restrictions || [],
    species: room?.species || 'all',
    amenities: room?.amenities || [],
    notes: room?.notes || '',
  });
  const [amenityInput, setAmenityInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sizeOptions = ['small', 'medium', 'large', 'xlarge'];
  const commonAmenities = [
    'Indoor', 'Outdoor Access', 'Climate Control', 'Camera', 
    'Elevated Bed', 'Music', 'TV', 'Skylight', 'Private Yard'
  ];

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const toggleSizeRestriction = (size) => {
    setFormData(prev => ({
      ...prev,
      size_restrictions: prev.size_restrictions.includes(size)
        ? prev.size_restrictions.filter(s => s !== size)
        : [...prev.size_restrictions, size]
    }));
  };

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addCustomAmenity = () => {
    if (amenityInput.trim() && !formData.amenities.includes(amenityInput.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenityInput.trim()]
      }));
      setAmenityInput('');
    }
  };

  const removeAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const submitData = {
      ...formData,
      capacity: parseInt(formData.capacity)
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

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Room Name/Number *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., K-101, Suite A"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="room_type">Room Type *</Label>
          <Select value={formData.room_type} onValueChange={(value) => setFormData(prev => ({ ...prev, room_type: value }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kennel">Kennel</SelectItem>
              <SelectItem value="suite">Suite</SelectItem>
              <SelectItem value="play_area">Play Area</SelectItem>
              <SelectItem value="grooming">Grooming Room</SelectItem>
              <SelectItem value="isolation">Isolation</SelectItem>
              <SelectItem value="medical">Medical</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity *</Label>
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min="1"
            value={formData.capacity}
            onChange={handleChange}
            required
          />
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
      </div>

      {/* Size Restrictions */}
      <div className="space-y-2">
        <Label>Size Restrictions (leave empty for all sizes)</Label>
        <div className="flex flex-wrap gap-2">
          {sizeOptions.map(size => (
            <button
              key={size}
              type="button"
              onClick={() => toggleSizeRestriction(size)}
              className={`px-3 py-1 rounded-full text-sm ${
                formData.size_restrictions.includes(size)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {size.charAt(0).toUpperCase() + size.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-2">
        <Label>Amenities</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {commonAmenities.map(amenity => (
            <button
              key={amenity}
              type="button"
              onClick={() => toggleAmenity(amenity)}
              className={`px-3 py-1 rounded-full text-sm ${
                formData.amenities.includes(amenity)
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {amenity}
            </button>
          ))}
        </div>
        
        {/* Selected/Custom Amenities */}
        {formData.amenities.length > 0 && (
          <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded">
            {formData.amenities.map(amenity => (
              <Badge key={amenity} variant="secondary" className="px-2 py-1">
                {amenity}
                <button
                  type="button"
                  onClick={() => removeAmenity(amenity)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add Custom Amenity */}
        <div className="flex gap-2">
          <Input
            value={amenityInput}
            onChange={(e) => setAmenityInput(e.target.value)}
            placeholder="Add custom amenity..."
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomAmenity())}
          />
          <Button type="button" variant="outline" onClick={addCustomAmenity}>
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Any additional notes about this room..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (room ? 'Update Room' : 'Create Room')}
        </Button>
      </div>
    </form>
  );
};

const RoomsPage = () => {
  const { selectedLocation } = useLocation();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  useEffect(() => {
    if (selectedLocation) {
      fetchRooms();
    }
  }, [selectedLocation]);

  const fetchRooms = async () => {
    try {
      const response = await roomAPI.getAll(selectedLocation?.id);
      setRooms(response.data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingRoom) {
        await roomAPI.update(editingRoom.id, formData);
      } else {
        await roomAPI.create(formData);
      }
      
      setShowForm(false);
      setEditingRoom(null);
      fetchRooms();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Failed to save room'
      };
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleDelete = async (room) => {
    if (window.confirm(`Are you sure you want to delete ${room.name}?`)) {
      try {
        await roomAPI.delete(room.id);
        fetchRooms();
      } catch (error) {
        alert('Failed to delete room');
      }
    }
  };

  const handleToggleAvailability = async (room) => {
    try {
      await roomAPI.toggleAvailability(room.id, !room.is_available);
      fetchRooms();
    } catch (error) {
      alert('Failed to update room availability');
    }
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingRoom(null);
  };

  const getRoomTypeColor = (type) => {
    const colors = {
      kennel: 'bg-blue-100 text-blue-800',
      suite: 'bg-purple-100 text-purple-800',
      play_area: 'bg-green-100 text-green-800',
      grooming: 'bg-pink-100 text-pink-800',
      isolation: 'bg-orange-100 text-orange-800',
      medical: 'bg-red-100 text-red-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (!selectedLocation) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Please select a location to manage rooms</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-12">Loading rooms...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rooms & Kennels</h1>
          <p className="text-gray-600 mt-1">Manage facility rooms for {selectedLocation.name}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Room
        </Button>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No rooms yet</h3>
            <p className="text-gray-600 mb-4">Create your first room or kennel</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Room
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <Card key={room.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{room.name}</CardTitle>
                    <CardDescription>Capacity: {room.capacity}</CardDescription>
                  </div>
                  <Badge className={getRoomTypeColor(room.room_type)}>
                    {room.room_type.replace('_', ' ')}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {room.is_available ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${room.is_available ? 'text-green-600' : 'text-red-600'}`}>
                      {room.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  <div className="text-sm">
                    <span className="font-semibold">Species:</span> {room.species}
                  </div>

                  {room.size_restrictions.length > 0 && (
                    <div className="text-sm">
                      <span className="font-semibold">Sizes:</span> {room.size_restrictions.join(', ')}
                    </div>
                  )}

                  {room.amenities.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-1">Amenities:</p>
                      <div className="flex flex-wrap gap-1">
                        {room.amenities.slice(0, 3).map(amenity => (
                          <Badge key={amenity} variant="secondary" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {room.amenities.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{room.amenities.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {room.notes && (
                    <p className="text-sm text-gray-600 line-clamp-2">{room.notes}</p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleAvailability(room)}
                    className="flex-1"
                  >
                    {room.is_available ? 'Mark Unavailable' : 'Mark Available'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(room)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(room)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Room Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
          </DialogHeader>
          <RoomForm
            room={editingRoom}
            onSave={handleSave}
            onCancel={handleClose}
            locationId={selectedLocation?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RoomsPage;