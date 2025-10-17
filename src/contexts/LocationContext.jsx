
import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from "@/components/ui/use-toast";
    
    const LocationContext = createContext();
    
    export function LocationProvider({ children }) {
        const [locations, setLocations] = useState([]);
        const [selectedLocation, setSelectedLocation] = useState(null);
        const [loading, setLoading] = useState(true);
        const { toast } = useToast();
    
        const fetchLocations = useCallback(async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('locations')
                .select('*')
                .order('created_at', { ascending: true });
    
            if (error) {
                toast({ title: "Error fetching locations", description: error.message, variant: "destructive" });
            } else {
                setLocations(data);
                if (!selectedLocation && data.length > 0) {
                    setSelectedLocation(data[0]);
                } else if (selectedLocation) {
                    const updatedSelected = data.find(l => l.id === selectedLocation.id);
                    setSelectedLocation(updatedSelected || (data.length > 0 ? data[0] : null));
                }
            }
            setLoading(false);
        }, [toast, selectedLocation]);
    
        useEffect(() => {
            fetchLocations();
        }, []);
    
        const addLocation = async (name, address) => {
            const { data, error } = await supabase
                .from('locations')
                .insert([{ name, address }])
                .select();
            
            if (error) {
                toast({ title: "Error adding location", description: error.message, variant: "destructive" });
                return null;
            }
            
            toast({ title: "Success!", description: `Location "${name}" has been added.` });
            await fetchLocations();
            return data[0];
        };
    
        const updateLocation = async (locationId, name, address) => {
            const { error } = await supabase
                .from('locations')
                .update({ name, address })
                .eq('id', locationId);
            
            if (error) {
                toast({ title: "Error updating location", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "Success!", description: "Location has been updated." });
                await fetchLocations();
            }
        };
        
        const deleteLocation = async (locationId) => {
             const { error } = await supabase
                .from('locations')
                .delete()
                .eq('id', locationId);
    
            if (error) {
                toast({ title: "Error deleting location", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "Success!", description: "Location has been deleted." });
                await fetchLocations();
            }
        };
    
        const value = useMemo(() => ({
            locations,
            selectedLocation,
            setSelectedLocation,
            addLocation,
            updateLocation,
            deleteLocation,
            loading,
            fetchLocations
        }), [locations, selectedLocation, loading, fetchLocations]);
    
        return (
            <LocationContext.Provider value={value}>
                {children}
            </LocationContext.Provider>
        );
    }
    
    export function useLocation() {
        const context = useContext(LocationContext);
        if (!context) {
            throw new Error('useLocation must be used within a LocationProvider');
        }
        return context;
    }