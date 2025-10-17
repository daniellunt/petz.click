import React from 'react';
import { useLocation } from '@/context/LocationContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, MapPin } from 'lucide-react';

const LocationSwitcher = ({ isCollapsed }) => {
  const { locations, selectedLocation, selectLocation, loading } = useLocation();

  if (loading) {
    return (
      <div className={`px-2 ${isCollapsed ? 'text-center' : ''}`}>
        <div className="animate-pulse bg-gray-200 h-10 rounded"></div>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className={`px-2 py-2 text-sm text-gray-500 ${isCollapsed ? 'text-center' : ''}`}>
        {isCollapsed ? (
          <Building className="h-5 w-5 mx-auto" />
        ) : (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
            <Building className="h-5 w-5 text-yellow-600" />
            <span>No locations</span>
          </div>
        )}
      </div>
    );
  }

  if (isCollapsed) {
    return (
      <div className="px-2 py-2 text-center">
        <div className="p-2 bg-blue-50 rounded-lg">
          <MapPin className="h-5 w-5 text-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-2">
      <Select
        value={selectedLocation?.id}
        onValueChange={(value) => {
          const location = locations.find(loc => loc.id === value);
          if (location) selectLocation(location);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="truncate">{selectedLocation?.name || 'Select Location'}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {locations.map((location) => (
            <SelectItem key={location.id} value={location.id}>
              <div className="flex flex-col">
                <span className="font-medium">{location.name}</span>
                <span className="text-xs text-gray-500">{location.city}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LocationSwitcher;
