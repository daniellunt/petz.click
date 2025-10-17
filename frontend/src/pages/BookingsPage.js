import React, { useState, useEffect } from 'react';
import { bookingAPI, petAPI } from '@/utils/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import BookingForm from '@/components/Bookings/BookingForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [bookingsRes, petsRes] = await Promise.all([
        bookingAPI.getAll(),
        petAPI.getAll()
      ]);
      setBookings(bookingsRes.data);
      setPets(petsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseForm = () => {
    setShowForm(false);
    fetchData();
  };

  const getPetName = (petId) => {
    const pet = pets.find(p => p.id === petId);
    return pet ? pet.name : 'Unknown Pet';
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="text-center py-12">Loading bookings...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">My Bookings</h1>
          <p className="text-gray-600 mt-1">Manage your service bookings</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Booking
        </Button>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
            <p className="text-gray-600 mb-4">Create your first booking</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{getPetName(booking.pet_id)}</CardTitle>
                    <CardDescription>
                      {booking.service_type.charAt(0).toUpperCase() + booking.service_type.slice(1)} Service
                    </CardDescription>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-semibold">Location:</p>
                    <p className="text-gray-600">{booking.location}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Date:</p>
                    <p className="text-gray-600">{booking.start_date}</p>
                  </div>
                  {booking.notes && (
                    <div className="md:col-span-2">
                      <p className="font-semibold">Notes:</p>
                      <p className="text-gray-600">{booking.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
          </DialogHeader>
          <BookingForm pets={pets} onClose={handleCloseForm} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BookingsPage;