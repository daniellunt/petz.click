import React, { useState, useEffect } from 'react';
import { Search, Loader2, User, Dog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { supabase } from '@/lib/customSupabaseClient';
import { useNavigate } from 'react-router-dom';
import { useLocation } from '@/contexts/LocationContext';

const UniversalSearch = () => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState({ clients: [], pets: [] });
    const navigate = useNavigate();
    const { selectedLocation } = useLocation();

    useEffect(() => {
        const down = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    useEffect(() => {
        if (query.length < 2) {
            setResults({ clients: [], pets: [] });
            return;
        }

        const performSearch = async () => {
            if (!selectedLocation) return;
            setLoading(true);
            
            const [clientRes, petRes] = await Promise.all([
                supabase.from('clients').select('id, name, email').eq('location_id', selectedLocation.id).ilike('name', `%${query}%`).limit(5),
                supabase.from('pets').select('id, name, clients(name)').eq('clients.location_id', selectedLocation.id).ilike('name', `%${query}%`).limit(5)
            ]);
            
            setResults({
                clients: clientRes.data || [],
                pets: petRes.data || [],
            });

            setLoading(false);
        };

        const timeoutId = setTimeout(performSearch, 300);
        return () => clearTimeout(timeoutId);
    }, [query, selectedLocation]);

    const handleSelect = (path) => {
        navigate(path);
        setOpen(false);
        setQuery('');
    };

    return (
        <>
            <Button
                variant="outline"
                className="w-full justify-start text-sm text-muted-foreground"
                onClick={() => setOpen(true)}
            >
                <Search className="mr-2 h-4 w-4" />
                Search...
                <kbd className="pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
            <CommandDialog open={open} onOpenChange={setOpen}>
                <CommandInput
                    placeholder="Search clients, pets, bookings..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    {!selectedLocation && <CommandEmpty>Please select a location to search.</CommandEmpty>}
                    {loading && selectedLocation && <CommandEmpty><Loader2 className="mx-auto h-8 w-8 animate-spin" /></CommandEmpty>}
                    {!loading && query.length > 1 && results.clients.length === 0 && results.pets.length === 0 && (
                        <CommandEmpty>No results found.</CommandEmpty>
                    )}
                    
                    {results.clients.length > 0 && (
                        <CommandGroup heading="Clients">
                            {results.clients.map(client => (
                                <CommandItem key={`client-${client.id}`} onSelect={() => handleSelect(`/clients/${client.id}`)}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>{client.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {results.pets.length > 0 && (
                        <CommandGroup heading="Pets">
                            {results.pets.map(pet => (
                                <CommandItem key={`pet-${pet.id}`} onSelect={() => handleSelect(`/pets/${pet.id}`)}>
                                    <Dog className="mr-2 h-4 w-4" />
                                    <span>{pet.name} <span className="text-xs text-muted-foreground">({pet.clients.name})</span></span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
};

export default UniversalSearch;