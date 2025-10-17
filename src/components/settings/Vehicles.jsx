import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, Edit, Trash2, Loader2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useLocation } from '@/contexts/LocationContext';
import { supabase } from '@/lib/customSupabaseClient';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const VehicleForm = ({ vehicle, onSave, locationId }) => {
    const [formData, setFormData] = useState({
        name: vehicle?.name || '',
        capacity: vehicle?.capacity || '',
        plate_number: vehicle?.plate_number || '',
        make_model: vehicle?.make_model || '',
        vin: vehicle?.vin || '',
        insurance_expiry: vehicle?.insurance_expiry || '',
        min_age: vehicle?.min_age || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.capacity || !formData.plate_number) {
            toast({ title: "Validation Error", description: "Name, capacity, and plate number are required.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        await onSave({ ...formData, location_id: locationId });
        setIsSubmitting(false);
    };

    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Vehicle Name</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input id="capacity" name="capacity" type="number" value={formData.capacity} onChange={handleChange} />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="plate_number">Plate Number</Label>
                    <Input id="plate_number" name="plate_number" value={formData.plate_number} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="make_model">Make & Model</Label>
                    <Input id="make_model" name="make_model" value={formData.make_model} onChange={handleChange} />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="vin">VIN</Label>
                <Input id="vin" name="vin" value={formData.vin} onChange={handleChange} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="insurance_expiry">Insurance Expiry</Label>
                    <Input id="insurance_expiry" name="insurance_expiry" type="date" value={formData.insurance_expiry} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="min_age">Min. Driver Age</Label>
                    <Input id="min_age" name="min_age" type="number" value={formData.min_age} onChange={handleChange} />
                </div>
            </div>
            <DialogFooter>
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Vehicle
                </Button>
            </DialogFooter>
        </div>
    );
};

const Vehicles = () => {
    const { toast } = useToast();
    const { selectedLocation } = useLocation();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [vehicleToDelete, setVehicleToDelete] = useState(null);

    const fetchVehicles = useCallback(async () => {
        if (!selectedLocation) {
            setVehicles([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('vehicles')
            .select('*')
            .eq('location_id', selectedLocation.id)
            .order('created_at', { ascending: false });

        if (error) {
            toast({ title: "Error fetching vehicles", description: error.message, variant: "destructive" });
        } else {
            setVehicles(data);
        }
        setLoading(false);
    }, [selectedLocation, toast]);

    useEffect(() => {
        fetchVehicles();
    }, [fetchVehicles]);

    const handleSaveVehicle = async (vehicleData) => {
        const { error } = editingVehicle
            ? await supabase.from('vehicles').update(vehicleData).eq('id', editingVehicle.id)
            : await supabase.from('vehicles').insert(vehicleData);

        if (error) {
            toast({ title: 'Error saving vehicle', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: `Vehicle ${editingVehicle ? 'Updated' : 'Created'}` });
            setIsDialogOpen(false);
            setEditingVehicle(null);
            fetchVehicles();
        }
    };

    const handleDeleteVehicle = async (id) => {
        const { error } = await supabase.from('vehicles').delete().eq('id', id);
        if (error) {
            toast({ title: 'Error deleting vehicle', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Vehicle Deleted' });
            fetchVehicles();
        }
        setVehicleToDelete(null);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Manage Vehicles</CardTitle>
                        <CardDescription>Add, edit, or remove vehicles for your location.</CardDescription>
                    </div>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => { setEditingVehicle(null); setIsDialogOpen(true); }} disabled={!selectedLocation}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Vehicle
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[625px]">
                            <DialogHeader>
                                <DialogTitle>{editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                                <DialogDescription>Fill in the details for the vehicle.</DialogDescription>
                            </DialogHeader>
                            <VehicleForm vehicle={editingVehicle} onSave={handleSaveVehicle} locationId={selectedLocation?.id} />
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : !selectedLocation ? (
                         <div className="text-center py-12 text-muted-foreground">
                            <Truck className="mx-auto h-12 w-12" />
                            <p className="mt-4 text-lg font-semibold">No Location Selected</p>
                            <p>Please select a location to manage vehicles.</p>
                        </div>
                    ) : vehicles.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Truck className="mx-auto h-12 w-12" />
                            <p className="mt-4 text-lg font-semibold">No Vehicles Found</p>
                            <p>Get started by adding your first vehicle.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Plate Number</TableHead>
                                    <TableHead>Capacity</TableHead>
                                    <TableHead>Make/Model</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vehicles.map(vehicle => (
                                    <TableRow key={vehicle.id}>
                                        <TableCell className="font-medium">{vehicle.name}</TableCell>
                                        <TableCell>{vehicle.plate_number}</TableCell>
                                        <TableCell>{vehicle.capacity}</TableCell>
                                        <TableCell>{vehicle.make_model || 'N/A'}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" onClick={() => { setEditingVehicle(vehicle); setIsDialogOpen(true); }}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => setVehicleToDelete(vehicle)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
            {vehicleToDelete && (
                <AlertDialog open={!!vehicleToDelete} onOpenChange={() => setVehicleToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the vehicle "{vehicleToDelete.name}". This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteVehicle(vehicleToDelete.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </motion.div>
    );
};

export default Vehicles;