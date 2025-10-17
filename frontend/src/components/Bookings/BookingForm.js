import React, { useState } from 'react';
import { bookingAPI } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const BookingForm = ({ pets, onClose }) => {
  const [formData, setFormData] = useState({
    pet_id: '',
    service_type: '',
    start_date: '',
    end_date: '',
    location: '',
    notes: ''
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

    try {
      const submitData = { ...formData };
      
      // Remove end_date for non-boarding services
      if (formData.service_type !== 'boarding') {
        delete submitData.end_date;
      }
      
      await bookingAPI.create(submitData);
      onClose();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const eligiblePets = pets.filter(pet => 
    formData.service_type === 'introduction' || pet.intro_completed
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label>Service Type *</Label>
        <Select value={formData.service_type} onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="introduction">Introduction Service</SelectItem>
            <SelectItem value="daycare">Daycare</SelectItem>
            <SelectItem value="boarding">Boarding</SelectItem>
            <SelectItem value="timed">Timed Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {formData.service_type && (
        <>
          <div className="space-y-2">
            <Label>Select Pet *</Label>
            <Select value={formData.pet_id} onValueChange={(value) => setFormData(prev => ({ ...prev, pet_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select pet" />
              </SelectTrigger>
              <SelectContent>
                {eligiblePets.map(pet => (
                  <SelectItem key={pet.id} value={pet.id}>{pet.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {formData.service_type !== 'introduction' && eligiblePets.length === 0 && (
              <p className="text-sm text-orange-600">No pets have completed introduction service</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Start Date *</Label>
            <Input
              id="start_date"
              name="start_date"
              type="date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </div>

          {formData.service_type === 'boarding' && (
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date *</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Downtown Location"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Any special instructions..."
              rows={3}
            />
          </div>
        </>
      )}

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading || !formData.service_type}>
          {loading ? 'Creating...' : 'Create Booking'}
        </Button>
      </div>
    </form>
  );
};

export default BookingForm;