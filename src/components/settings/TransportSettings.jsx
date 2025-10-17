import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Map } from 'lucide-react';
import Vehicles from '@/components/settings/Vehicles';
import Zoning from '@/components/Zoning';

const TransportSettings = () => {
  return (
    <Tabs defaultValue="vehicles" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="vehicles"><Truck className="mr-2 h-4 w-4"/>Vehicles</TabsTrigger>
        <TabsTrigger value="zones"><Map className="mr-2 h-4 w-4"/>Zones</TabsTrigger>
      </TabsList>
      <TabsContent value="vehicles">
        <Vehicles />
      </TabsContent>
      <TabsContent value="zones">
        <Zoning />
      </TabsContent>
    </Tabs>
  );
};

export default TransportSettings;