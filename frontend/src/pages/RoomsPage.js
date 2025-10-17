import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building } from 'lucide-react';

const RoomsPage = () => {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Rooms & Kennels</h1>
        <p className="text-gray-600 mt-1">Manage facility rooms and assignments</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Room Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-16 text-gray-500">
            <Building className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-lg">Room management coming soon</p>
            <p className="text-sm mt-2">Configure rooms, capacity, and availability</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoomsPage;