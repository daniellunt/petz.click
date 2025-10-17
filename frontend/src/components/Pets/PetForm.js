import React, { useState } from 'react';
import { petAPI } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const PetForm = ({ pet, onClose }) => {
  const [formData, setFormData] = useState({
    name: pet?.name || '',
    breed: pet?.breed || '',
    age: pet?.age || '',
    weight: pet?.weight || '',
    medical_info: pet?.medical_info || '',
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
      const submitData = {
        ...formData,
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        vaccinations: pet?.vaccinations || []
      };

      if (pet) {
        await petAPI.update(pet.id, submitData);
      } else {
        await petAPI.create(submitData);
      }
      
      onClose();
    } catch (error) {
      setError(error.response?.data?.detail || 'Failed to save pet');
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
      
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Pet Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="breed">Breed *</Label>
          <Input
            id="breed"
            name="breed"
            value={formData.breed}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Age (years) *</Label>
          <Input
            id="age"
            name="age"
            type="number"
            min="0"
            value={formData.age}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight">Weight (lbs) *</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            step="0.1"
            min="0"
            value={formData.weight}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="medical_info">Medical Information</Label>
        <Textarea
          id="medical_info"
          name="medical_info"
          value={formData.medical_info}
          onChange={handleChange}
          placeholder="Any medical conditions, allergies, or special needs..."
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : (pet ? 'Update Pet' : 'Add Pet')}
        </Button>
      </div>
    </form>
  );
};

export default PetForm;