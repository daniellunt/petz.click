
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, FeatureGroup } from 'react-leaflet';
import { EditControl } from "react-leaflet-draw";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useLocation } from '@/contexts/LocationContext';
import { supabase } from '@/lib/customSupabaseClient';

const generateRandomColor = () => `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;

const Zoning = () => {
  const { toast } = useToast();
  const { selectedLocation } = useLocation();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoneName, setZoneName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [drawnLayer, setDrawnLayer] = useState(null);

  const fetchZones = useCallback(async () => {
    if (!selectedLocation) {
        setZones([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    const { data, error } = await supabase
        .from('zones')
        .select('*')
        .eq('location_id', selectedLocation.id);

    if (error) {
        toast({ title: "Error fetching zones", description: error.message, variant: "destructive" });
    } else {
        setZones(data);
    }
    setLoading(false);
  }, [selectedLocation, toast]);

  useEffect(() => {
    fetchZones();
  }, [fetchZones]);

  const handleCreated = e => {
    const { layer } = e;
    setDrawnLayer(layer.toGeoJSON().geometry);
    toast({ title: "Zone Drawn!", description: "Enter a name below and click 'Add Zone' to save it." });
  };
  
  const handleAddZone = async () => {
     if (!zoneName.trim()) {
        toast({ title: "Zone name is required", variant: "destructive" });
        return;
     }
     if (!drawnLayer) {
        toast({ title: "No zone drawn", description: "Please draw a zone on the map first.", variant: "destructive"});
        return;
     }
     if (!selectedLocation) return;
     
     setIsSubmitting(true);
     const newZonePayload = {
        name: zoneName,
        color: generateRandomColor(),
        location_id: selectedLocation.id,
        path: drawnLayer.coordinates[0].map(coord => [coord[1], coord[0]]) // Leaflet uses [lat, lng]
     };

     const { error } = await supabase.from('zones').insert(newZonePayload);

     if (error) {
        toast({ title: "Error adding zone", description: error.message, variant: "destructive" });
     } else {
        toast({ title: "Zone Added!", description: `"${zoneName}" has been created.` });
        setZoneName('');
        setDrawnLayer(null);
        fetchZones();
     }
     setIsSubmitting(false);
  };

  const handleDeleteZone = async (zoneId, name) => {
    const { error } = await supabase.from('zones').delete().eq('id', zoneId);
    if (error) {
        toast({ title: "Error deleting zone", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Success", description: `Zone "${name}" has been deleted.` });
        fetchZones();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Route Zones</CardTitle>
            <CardDescription>Draw and manage geographic zones for route planning.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[500px] w-full rounded-md overflow-hidden relative">
              <MapContainer center={[36.3, -5.1]} zoom={10} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
                <FeatureGroup>
                   <EditControl
                    position="topright"
                    onCreated={handleCreated}
                    draw={{
                        rectangle: false,
                        circle: false,
                        circlemarker: false,
                        marker: false,
                        polyline: false,
                    }}
                    edit={{
                        edit: false,
                        remove: false,
                    }}
                    />
                  {zones.map(zone => (
                    <Polygon key={zone.id} pathOptions={{ color: zone.color, fillOpacity: 0.5, weight: 2 }} positions={zone.path || []} />
                  ))}
                </FeatureGroup>
              </MapContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Manage Zones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-4 border p-4 rounded-lg">
                <p className="font-semibold text-sm">Create New Zone</p>
                <div className="space-y-2">
                    <Label htmlFor="zone-name">Zone Name</Label>
                    <Input id="zone-name" placeholder="e.g. Downtown Core" value={zoneName} onChange={(e) => setZoneName(e.target.value)} disabled={!selectedLocation || isSubmitting} />
                </div>
                <Button onClick={handleAddZone} className="w-full" disabled={!selectedLocation || isSubmitting || !drawnLayer}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                    Add Zone
                </Button>
            </div>

            <div className="space-y-2">
                {loading ? <div className="flex justify-center p-4"><Loader2 className="h-6 w-6 animate-spin"/></div> :
                 !selectedLocation ? <p className="text-sm text-center text-muted-foreground pt-4">Select a location to see zones.</p> :
                 zones.length === 0 ? <p className="text-sm text-center text-muted-foreground pt-4">No zones created yet.</p> :
                 zones.map(zone => (
                    <div key={zone.id} className="flex items-center justify-between p-2 rounded-md border">
                        <div className="flex items-center gap-3">
                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: zone.color }}></div>
                            <span className="font-medium">{zone.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteZone(zone.id, zone.name)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Zoning;
