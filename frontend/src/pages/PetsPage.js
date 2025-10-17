import React, { useState, useEffect } from 'react';
import { petAPI } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import PetForm from '@/components/Pets/PetForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const PetsPage = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState(null);

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const response = await petAPI.getAll();
      setPets(response.data);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (petId) => {
    if (window.confirm('Are you sure you want to delete this pet?')) {
      try {
        await petAPI.delete(petId);
        fetchPets();
      } catch (error) {
        console.error('Failed to delete pet:', error);
        alert('Failed to delete pet');
      }
    }
  };

  const handleEdit = (pet) => {
    setEditingPet(pet);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPet(null);
    fetchPets();
  };

  if (loading) {
    return <div className="text-center py-12">Loading pets...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Pets</h1>
          <p className="text-gray-600 mt-1">Manage your pet profiles</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Pet
        </Button>
      </div>

      {pets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <PawPrint className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No pets yet</h3>
            <p className="text-gray-600 mb-4">Add your first pet to get started</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Pet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <Card key={pet.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{pet.name}</CardTitle>
                    <CardDescription>{pet.breed}, {pet.age} years old</CardDescription>
                  </div>
                  {pet.intro_completed ? (
                    <CheckCircle className="h-5 w-5 text-green-600" title="Introduction completed" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-600" title="Introduction pending" />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Weight:</span> {pet.weight} lbs</p>
                  {pet.medical_info && (
                    <p><span className="font-semibold">Medical:</span> {pet.medical_info}</p>
                  )}
                  <p><span className="font-semibold">Vaccinations:</span> {pet.vaccinations.length}</p>
                  {!pet.intro_completed && (
                    <div className="bg-orange-50 text-orange-800 p-2 rounded mt-3 text-xs">
                      ⚠️ Introduction service required before booking other services
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(pet)} className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(pet.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pet Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPet ? 'Edit Pet' : 'Add New Pet'}</DialogTitle>
          </DialogHeader>
          <PetForm pet={editingPet} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

const PawPrint = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <path d="M12 18c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export default PetsPage;