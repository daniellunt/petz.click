
    import React from 'react';
    import { ChevronsUpDown, Check, PlusCircle, Loader2, MapPin } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
    import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from '@/components/ui/command';
    import { useLocation } from '@/contexts/LocationContext';
    import { useNavigate } from 'react-router-dom';
    
    const LocationSwitcher = () => {
        const [open, setOpen] = React.useState(false);
        const { locations, selectedLocation, setSelectedLocation, loading } = useLocation();
        const navigate = useNavigate();
    
        return (
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        <div className="flex items-center">
                            {loading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                               <>
                                <MapPin className="mr-2 h-4 w-4" />
                                {selectedLocation ? selectedLocation.name : "Select location..."}
                               </>
                            )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0">
                    <Command>
                        <CommandInput placeholder="Search location..." />
                        <CommandEmpty>No location found.</CommandEmpty>
                        <CommandGroup>
                            {locations.map((location) => (
                                <CommandItem
                                    key={location.id}
                                    value={location.id}
                                    onSelect={(currentValue) => {
                                        const newLocation = locations.find(loc => loc.id === currentValue);
                                        if(newLocation) setSelectedLocation(newLocation);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={`mr-2 h-4 w-4 ${selectedLocation && selectedLocation.id === location.id ? "opacity-100" : "opacity-0"}`}
                                    />
                                    {location.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                        <CommandSeparator />
                        <CommandGroup>
                            <CommandItem onSelect={() => {
                                navigate('/settings/locations');
                                setOpen(false);
                            }}>
                                <PlusCircle className="mr-2 h-5 w-5" />
                                <span>Manage Locations</span>
                            </CommandItem>
                        </CommandGroup>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    };
    
    export default LocationSwitcher;
  