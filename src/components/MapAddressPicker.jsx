import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
    import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
    import { LatLng } from 'leaflet';
    import { Input } from "@/components/ui/input";
    import { Button } from "@/components/ui/button";
    import { Loader2 } from 'lucide-react';

    function DraggableMarker({ position, setPosition, setAddress }) {
        const markerRef = useRef(null);
        const map = useMap();

        const eventHandlers = useMemo(
            () => ({
                dragend() {
                    const marker = markerRef.current;
                    if (marker != null) {
                        const newPos = marker.getLatLng();
                        setPosition(newPos);
                    }
                },
            }),
            [setPosition],
        );

        useMapEvents({
            click(e) {
                setPosition(e.latlng);
                map.flyTo(e.latlng, map.getZoom());
            },
        });
        
        useEffect(() => {
            if (position) {
                const reverseGeocode = async () => {
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`);
                        const data = await response.json();
                        if (data && data.display_name) {
                            setAddress(data.display_name);
                        } else {
                            setAddress('Address not found');
                        }
                    } catch (error) {
                        console.error('Reverse geocoding failed:', error);
                        setAddress('Could not fetch address');
                    }
                };
                reverseGeocode();
            }
        }, [position, setAddress]);


        return (
            <Marker
                draggable={true}
                eventHandlers={eventHandlers}
                position={position}
                ref={markerRef}
            />
        );
    }

    const MapAddressPicker = ({ value, onChange }) => {
        const [addressText, setAddressText] = useState(value || '');
        const [position, setPosition] = useState(new LatLng(51.505, -0.09));
        const [mapCenter, setMapCenter] = useState(new LatLng(51.505, -0.09));
        const [loading, setLoading] = useState(false);
        const [isInitialLoad, setIsInitialLoad] = useState(true);

        const stableOnChange = useCallback(onChange, []);

        const handleSearch = useCallback(async (addressToSearch) => {
            if (!addressToSearch) return;
            setLoading(true);
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressToSearch)}&format=json&limit=1`);
                const data = await response.json();
                if (data && data.length > 0) {
                    const newPos = new LatLng(parseFloat(data[0].lat), parseFloat(data[0].lon));
                    setPosition(newPos);
                    setMapCenter(newPos);
                } else {
                    console.log('Address not found');
                }
            } catch (error) {
                console.error('Geocoding failed:', error);
            } finally {
                setLoading(false);
            }
        }, []);

        useEffect(() => {
            if (value && isInitialLoad) {
                setAddressText(value);
                handleSearch(value);
                setIsInitialLoad(false);
            } else if (!value && isInitialLoad) {
                setIsInitialLoad(false);
            }
        }, [value, isInitialLoad, handleSearch]);

        useEffect(() => {
            stableOnChange(addressText);
        }, [addressText, stableOnChange]);

        return (
            <div className="space-y-2">
                <div className="flex gap-2">
                    <Input
                        value={addressText}
                        onChange={(e) => setAddressText(e.target.value)}
                        placeholder="Type an address or drop a pin"
                    />
                    <Button type="button" onClick={() => handleSearch(addressText)} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                    </Button>
                </div>
                <div className="h-64 w-full rounded-md overflow-hidden z-0">
                    <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <DraggableMarker position={position} setPosition={setPosition} setAddress={setAddressText} />
                        <MapController center={mapCenter} />
                    </MapContainer>
                </div>
            </div>
        );
    };
    
    function MapController({ center }) {
        const map = useMap();
        useEffect(() => {
            if (center) {
                map.flyTo(center, 15);
            }
        }, [center, map]);
        return null;
    }

    export default MapAddressPicker;