
import React, { useState } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { MapPin, PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
    import { useLocation } from '@/contexts/LocationContext';
    import {
      Dialog,
      DialogContent,
      DialogHeader,
      DialogTitle,
      DialogDescription,
      DialogFooter,
    } from '@/components/ui/dialog';
    import {
      AlertDialog,
      AlertDialogAction,
      AlertDialogCancel,
      AlertDialogContent,
      AlertDialogDescription,
      AlertDialogFooter,
      AlertDialogHeader,
      AlertDialogTitle,
    } from "@/components/ui/alert-dialog";
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import MapAddressPicker from '@/components/MapAddressPicker';
    
    const LocationForm = ({ location, onSave, onCancel }) => {
        const [name, setName] = useState(location ? location.name : '');
        const [address, setAddress] = useState(location ? location.address : '');
    
        const handleSubmit = (e) => {
            e.preventDefault();
            onSave(name, address);
        };
    
        return (
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4 pt-2">
                        <Label htmlFor="address" className="text-right pt-2">Address</Label>
                        <div className="col-span-3">
                           <MapAddressPicker value={address} onChange={setAddress} />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button type="submit">Save Location</Button>
                </DialogFooter>
            </form>
        );
    };
    
    const Locations = () => {
        const { locations, addLocation, updateLocation, deleteLocation, loading } = useLocation();
        const { toast } = useToast();
        const [isFormOpen, setIsFormOpen] = useState(false);
        const [editingLocation, setEditingLocation] = useState(null);
        const [locationToDelete, setLocationToDelete] = useState(null);
    
        const handleSave = async (name, address) => {
            if (name.trim() === '') {
                toast({ title: 'Error', description: 'Location name cannot be empty.', variant: 'destructive' });
                return;
            }
    
            if (editingLocation) {
                await updateLocation(editingLocation.id, name, address);
            } else {
                await addLocation(name, address);
            }
            
            setIsFormOpen(false);
            setEditingLocation(null);
        };
        
        const handleDelete = async () => {
            if(locationToDelete) {
                await deleteLocation(locationToDelete.id);
                setLocationToDelete(null);
            }
        };
    
        return (
            <>
                <Helmet>
                  <title>Manage Locations - PetSuite</title>
                  <meta name="description" content="Add, edit, or remove your business locations." />
                </Helmet>
                <motion.div
                    className="p-8 pt-6 space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Your Locations</CardTitle>
                                <CardDescription>A list of all your pet resort locations.</CardDescription>
                            </div>
                            <Button onClick={() => { setEditingLocation(null); setIsFormOpen(true); }}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add New Location
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                 <div className="flex items-center justify-center h-40">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {locations.map(location => (
                                        <motion.div
                                            key={location.id}
                                            className="flex items-center justify-between p-4 border rounded-lg"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="flex items-start gap-4">
                                                <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                                <div>
                                                    <p className="font-medium">{location.name}</p>
                                                    <p className="text-sm text-muted-foreground">{location.address}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => { setEditingLocation(location); setIsFormOpen(true); }}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setLocationToDelete(location)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {locations.length === 0 && (
                                        <div className="text-center text-muted-foreground py-10">
                                            <MapPin className="mx-auto h-12 w-12" />
                                            <p className="mt-4">No locations found. Click "Add New Location" to get started.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
                
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="sm:max-w-[625px]">
                        <DialogHeader>
                            <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
                            <DialogDescription>
                                {editingLocation ? 'Update the details of your location.' : 'Enter the details for your new pet resort location.'}
                            </DialogDescription>
                        </DialogHeader>
                        <LocationForm 
                            location={editingLocation}
                            onSave={handleSave}
                            onCancel={() => { setIsFormOpen(false); setEditingLocation(null); }}
                        />
                    </DialogContent>
                </Dialog>
    
                <AlertDialog open={!!locationToDelete} onOpenChange={() => setLocationToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the "{locationToDelete?.name}" location.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </>
        );
    };
    
    export default Locations;
  