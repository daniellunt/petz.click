
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Building, PlusCircle, Dog, Edit, Trash2, Bone, Loader2, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/customSupabaseClient';
import { useLocation } from '@/contexts/LocationContext';

const Rooms = () => {
    const { toast } = useToast();
    const { selectedLocation } = useLocation();

    const [loading, setLoading] = useState(true);
    const [pets, setPets] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [dogSizes, setDogSizes] = useState([]);

    const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
    const [isEditRoomOpen, setIsEditRoomOpen] = useState(false);
    
    const [editingRoom, setEditingRoom] = useState(null);

    const [roomName, setRoomName] = useState('');
    const [roomUse, setRoomUse] = useState('');
    const [roomCapacity, setRoomCapacity] = useState('');
    const [selectedSizes, setSelectedSizes] = useState([]);

    const fetchData = useCallback(async () => {
        if (!selectedLocation) {
            setLoading(false);
            return;
        };
        setLoading(true);

        const { data: sizesData, error: sizesError } = await supabase.from('dog_sizes').select('*');
        if (sizesError) toast({ title: "Error fetching dog sizes", description: sizesError.message, variant: "destructive" });
        else setDogSizes(sizesData);

        const { data: roomsData, error: roomsError } = await supabase
            .from('rooms')
            .select('*, room_allowed_sizes(size_id)')
            .eq('location_id', selectedLocation.id);

        if (roomsError) {
            toast({ title: "Error fetching rooms", description: roomsError.message, variant: "destructive" });
        } else {
            const formattedRooms = roomsData.map(r => ({ ...r, allowedSizes: r.room_allowed_sizes.map(s => s.size_id) }));
            setRooms(formattedRooms);
        }

        const { data: petsData, error: petsError } = await supabase
            .from('pets')
            .select('*, clients!inner(id, name, location_id)')
            .eq('clients.location_id', selectedLocation.id);
        
        if (petsError) toast({ title: "Error fetching pets", description: petsError.message, variant: "destructive" });
        else setPets(petsData);

        setLoading(false);
    }, [selectedLocation, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSizeChange = (sizeId) => {
        setSelectedSizes(prev => 
            prev.includes(sizeId) 
            ? prev.filter(s => s !== sizeId) 
            : [...prev, sizeId]
        );
    };

    const resetForm = () => {
        setRoomName('');
        setRoomUse('');
        setRoomCapacity('');
        setSelectedSizes([]);
        setEditingRoom(null);
    };

    const handleAddRoom = async () => {
        if (!roomName || !roomUse || !roomCapacity || selectedSizes.length === 0 || !selectedLocation) {
            toast({ title: "Error", description: "Please fill all fields and select at least one dog size.", variant: "destructive" });
            return;
        }

        const { data: roomData, error: roomError } = await supabase
            .from('rooms')
            .insert({ name: roomName, use: roomUse, capacity: parseInt(roomCapacity, 10), location_id: selectedLocation.id })
            .select()
            .single();

        if (roomError) {
            toast({ title: "Error creating room", description: roomError.message, variant: "destructive" });
            return;
        }
        
        const allowedSizesToInsert = selectedSizes.map(size_id => ({ room_id: roomData.id, size_id }));
        const { error: sizeError } = await supabase.from('room_allowed_sizes').insert(allowedSizesToInsert);
        
        if(sizeError) {
             toast({ title: "Error setting room sizes", description: sizeError.message, variant: "destructive" });
        } else {
            toast({ title: "Success!", description: `Room "${roomName}" has been added.` });
            fetchData();
            resetForm();
            setIsAddRoomOpen(false);
        }
    };

    const handleEditRoomClick = (room) => {
        setEditingRoom(room);
        setRoomName(room.name);
        setRoomUse(room.use);
        setRoomCapacity(room.capacity.toString());
        setSelectedSizes(room.allowedSizes);
        setIsEditRoomOpen(true);
    };

    const handleUpdateRoom = async () => {
        if (!roomName || !roomUse || !roomCapacity || selectedSizes.length === 0 || !editingRoom) {
            toast({ title: "Error", description: "Please fill all fields.", variant: "destructive" });
            return;
        }

        const { error: updateError } = await supabase.from('rooms').update({ name: roomName, use: roomUse, capacity: parseInt(roomCapacity, 10) }).eq('id', editingRoom.id);
        if (updateError) {
            toast({ title: "Error updating room", description: updateError.message, variant: 'destructive' });
            return;
        }

        const { error: deleteSizesError } = await supabase.from('room_allowed_sizes').delete().eq('room_id', editingRoom.id);
        if (deleteSizesError) {
             toast({ title: "Error clearing old sizes", description: deleteSizesError.message, variant: 'destructive' });
             return;
        }
        
        const newSizes = selectedSizes.map(s => ({ room_id: editingRoom.id, size_id: s }));
        const { error: insertSizesError } = await supabase.from('room_allowed_sizes').insert(newSizes);

        if(insertSizesError) {
            toast({ title: "Error setting new sizes", description: insertSizesError.message, variant: 'destructive' });
        } else {
            toast({ title: "Success!", description: `Room "${roomName}" has been updated.` });
            fetchData();
            resetForm();
            setIsEditRoomOpen(false);
        }
    };

    const handleDeleteRoom = async (roomId, roomName) => {
        const { error } = await supabase.from('rooms').delete().eq('id', roomId);
        if (error) {
            toast({ title: "Error deleting room", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Success!", description: `Room "${roomName}" has been deleted. Pets moved to unassigned.` });
            fetchData();
        }
    };
    
    const handleMovePet = async (petId, newRoomId) => {
        const movedPet = pets.find(p => p.id === petId);
        const destinationRoom = rooms.find(r => r.id === newRoomId);

        if (destinationRoom) {
            const petsInRoom = pets.filter(p => p.room_id === newRoomId).length;
            if (petsInRoom >= destinationRoom.capacity) {
                toast({ title: "Capacity Reached", description: `"${destinationRoom.name}" is full.`, variant: "destructive" });
                return;
            }
            if (!destinationRoom.allowedSizes.includes(movedPet.size)) {
                toast({ title: "Invalid Size", description: `"${destinationRoom.name}" does not allow ${movedPet.size} dogs.`, variant: "destructive" });
                return;
            }
        }

        const oldPetsState = [...pets];
        const updatedPets = pets.map(p => p.id === petId ? { ...p, room_id: newRoomId } : p);
        setPets(updatedPets);

        const { error } = await supabase.from('pets').update({ room_id: newRoomId }).eq('id', petId);

        if (error) {
            toast({ title: "Error moving pet", description: error.message, variant: 'destructive' });
            setPets(oldPetsState);
        } else {
            toast({ title: "Success!", description: `Moved ${movedPet.name}.`});
            // We don't need to call fetchData() as we optimistically update state.
        }
    };

    const unassignedPets = pets.filter(p => p.room_id === null);

    if (!selectedLocation) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Card className="w-full max-w-md text-center">
                    <CardHeader><CardTitle>No Location Selected</CardTitle><CardDescription>Please select a location from the switcher above to manage rooms.</CardDescription></CardHeader>
                </Card>
            </div>
        );
    }
    
    if (loading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }
    
    return (
        <>
            <Helmet>
                <title>Rooms - PetSuite</title>
                <meta name="description" content="Manage rooms, capacity, and assignments for your pet resort." />
            </Helmet>
            <motion.div
                className="flex-1 space-y-4 p-8 pt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Rooms: {selectedLocation.name}</h1>
                    <Dialog open={isAddRoomOpen} onOpenChange={(isOpen) => { setIsAddRoomOpen(isOpen); if (!isOpen) resetForm(); }}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add New Room
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[480px]">
                            <DialogHeader>
                                <DialogTitle>Add New Room</DialogTitle>
                                <DialogDescription>Configure a new room for {selectedLocation.name}.</DialogDescription>
                            </DialogHeader>
                             <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="room-name">Name</Label>
                                    <Input id="room-name" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="room-use">Use</Label>
                                    <Select onValueChange={setRoomUse} value={roomUse}>
                                        <SelectTrigger id="room-use">
                                            <SelectValue placeholder="Select a use case" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Daycare">Daycare</SelectItem>
                                            <SelectItem value="Boarding">Boarding</SelectItem>
                                            <SelectItem value="Dual">Dual-Use</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="capacity">Capacity</Label>
                                    <Input id="capacity" type="number" value={roomCapacity} onChange={(e) => setRoomCapacity(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Allowed Dog Sizes</Label>
                                    <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
                                        {dogSizes.map(size => (
                                            <div key={size.id} className="flex items-center space-x-2">
                                                <Checkbox id={`add-${size.id}`} checked={selectedSizes.includes(size.id)} onCheckedChange={() => handleSizeChange(size.id)} />
                                                <label htmlFor={`add-${size.id}`} className="text-sm font-medium leading-none">{size.label}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter><Button type="submit" onClick={handleAddRoom}>Save Room</Button></DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader><CardTitle>Rooms</CardTitle></CardHeader>
                            <CardContent className="grid gap-6 md:grid-cols-2">
                                {rooms.length === 0 && <p className="text-muted-foreground p-4 col-span-2 text-center">No rooms created for this location yet.</p>}
                                {rooms.map(room => (
                                <Card key={room.id}>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between text-lg">
                                            <span>{room.name}</span>
                                            <Badge variant={room.use === 'Boarding' ? 'destructive' : room.use === 'Daycare' ? 'default' : 'secondary'}>{room.use}</Badge>
                                        </CardTitle>
                                        <CardDescription className="flex items-center gap-2 pt-1">
                                            <Dog className="h-4 w-4" /> Capacity: {pets.filter(p => p.room_id === room.id).length} / {room.capacity}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="min-h-[100px] bg-muted/20 rounded-lg p-2 space-y-2">
                                        {pets.filter(p => p.room_id === room.id).map((pet) => (
                                            <div key={pet.id} className="p-2 rounded-md bg-background shadow-sm flex items-center justify-between">
                                                <span className="font-medium">{pet.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline">{pet.size}</Badge>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6"><Move className="h-4 w-4" /></Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent>
                                                            {rooms.filter(r => r.id !== room.id).map(otherRoom => (
                                                                <DropdownMenuItem key={otherRoom.id} onSelect={() => handleMovePet(pet.id, otherRoom.id)}>Move to {otherRoom.name}</DropdownMenuItem>
                                                            ))}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem onSelect={() => handleMovePet(pet.id, null)}>Unassign</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                    <CardFooter className="flex justify-between items-center pt-4">
                                        <div className="flex flex-wrap gap-1">
                                            {room.allowedSizes.map(sizeId => {
                                                const size = dogSizes.find(s => s.id === sizeId);
                                                return size ? <Badge key={sizeId} variant="outline" className="text-xs">{size.label}</Badge> : null;
                                            })}
                                        </div>
                                        <div className="flex gap-1">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditRoomClick(room)}><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will delete the "{room.name}" room and move all pets inside to unassigned.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteRoom(room.id, room.name)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CardFooter>
                                </Card>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                    <div className="lg:col-span-1">
                         <Card>
                            <CardHeader><CardTitle>Unassigned Pets</CardTitle></CardHeader>
                            <CardContent className="min-h-[200px] space-y-2 p-4 rounded-lg bg-muted/30">
                                {unassignedPets.map((pet) => (
                                    <div key={pet.id} className="p-3 rounded-md bg-background shadow-sm flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Bone className="h-5 w-5 text-muted-foreground"/>
                                            <span className="font-semibold">{pet.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">{pet.size}</Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button size="sm">Assign</Button></DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    {rooms.map(room => (
                                                        <DropdownMenuItem key={room.id} onSelect={() => handleMovePet(pet.id, room.id)}>Assign to {room.name}</DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                ))}
                                {unassignedPets.length === 0 && <p className="text-center text-muted-foreground p-4">No unassigned pets.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Dialog open={isEditRoomOpen} onOpenChange={(isOpen) => { setIsEditRoomOpen(isOpen); if (!isOpen) resetForm(); }}>
                    <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                            <DialogTitle>Edit Room: {editingRoom?.name}</DialogTitle>
                            <DialogDescription>Update the configuration for this room.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-room-name">Name</Label>
                                <Input id="edit-room-name" value={roomName} onChange={(e) => setRoomName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-room-use">Use</Label>
                                <Select onValueChange={setRoomUse} value={roomUse}>
                                    <SelectTrigger id="edit-room-use"><SelectValue placeholder="Select a use case" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Daycare">Daycare</SelectItem>
                                        <SelectItem value="Boarding">Boarding</SelectItem>
                                        <SelectItem value="Dual">Dual-Use</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-capacity">Capacity</Label>
                                <Input id="edit-capacity" type="number" value={roomCapacity} onChange={(e) => setRoomCapacity(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Allowed Dog Sizes</Label>
                                <div className="grid grid-cols-2 gap-4 rounded-md border p-4">
                                    {dogSizes.map(size => (
                                        <div key={size.id} className="flex items-center space-x-2">
                                            <Checkbox id={`edit-${size.id}`} checked={selectedSizes.includes(size.id)} onCheckedChange={() => handleSizeChange(size.id)} />
                                            <label htmlFor={`edit-${size.id}`} className="text-sm font-medium leading-none">{size.label}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter><Button type="submit" onClick={handleUpdateRoom}>Save Changes</Button></DialogFooter>
                    </DialogContent>
                </Dialog>
                
                <motion.div className="mt-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
                    <Card>
                        <CardHeader><CardTitle>Timeline View</CardTitle><CardDescription>See upcoming schedules and bookings.</CardDescription></CardHeader>
                        <CardContent className="h-64 flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                            <div className="text-center"><Building className="mx-auto h-12 w-12" /><p className="mt-4">Interactive timeline view coming soon!</p></div>
                        </CardContent>
                    </Card>
                </motion.div>

            </motion.div>
        </>
    );
};

export default Rooms;
