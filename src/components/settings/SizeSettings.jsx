import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useLocation as useAppLocation } from '@/contexts/LocationContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const SizeForm = ({ onSave, size, locationId }) => {
    const [formData, setFormData] = useState({
        name: size?.name || '',
        min_weight: size?.min_weight || '',
        max_weight: size?.max_weight || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const upsertData = {
            ...formData,
            location_id: locationId,
            min_weight: parseFloat(formData.min_weight),
            max_weight: parseFloat(formData.max_weight),
        };

        let query = supabase.from('pet_sizes');
        if (size?.id) {
            query = query.update(upsertData).eq('id', size.id);
        } else {
            query = query.insert(upsertData);
        }

        const { error } = await query;
        setIsSubmitting(false);

        if (error) {
            toast({ title: 'Error saving size', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: `Size ${size?.id ? 'updated' : 'created'} successfully` });
            onSave();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">Size Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="min_weight">Min Weight (kg)</Label>
                    <Input id="min_weight" name="min_weight" type="number" step="0.1" value={formData.min_weight} onChange={handleChange} required />
                </div>
                <div>
                    <Label htmlFor="max_weight">Max Weight (kg)</Label>
                    <Input id="max_weight" name="max_weight" type="number" step="0.1" value={formData.max_weight} onChange={handleChange} required />
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save'}
                </Button>
            </DialogFooter>
        </form>
    );
};

const SizeSettings = () => {
    const { selectedLocation } = useAppLocation();
    const { toast } = useToast();
    const [sizes, setSizes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingSize, setEditingSize] = useState(null);
    const [sizeToDelete, setSizeToDelete] = useState(null);

    const fetchSizes = useCallback(async () => {
        if (!selectedLocation) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('pet_sizes')
            .select('*')
            .eq('location_id', selectedLocation.id)
            .order('min_weight', { ascending: true });
        
        if (error) {
            toast({ title: 'Error fetching pet sizes', description: error.message, variant: 'destructive' });
        } else {
            setSizes(data);
        }
        setLoading(false);
    }, [selectedLocation, toast]);

    useEffect(() => {
        fetchSizes();
    }, [fetchSizes]);

    const handleOpenDialog = (size = null) => {
        setEditingSize(size);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingSize(null);
    };

    const handleSave = () => {
        handleCloseDialog();
        fetchSizes();
    };

    const handleDelete = async (sizeId) => {
        const { error } = await supabase.from('pet_sizes').delete().eq('id', sizeId);
        if (error) {
            toast({ title: 'Error deleting size', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Size deleted successfully' });
            fetchSizes();
        }
        setSizeToDelete(null);
    };

    if (!selectedLocation) {
        return <p>Please select a location first.</p>;
    }

    if (loading) {
        return <div className="flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pet Size Definitions</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Size
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingSize ? 'Edit' : 'Add'} Pet Size</DialogTitle>
                        </DialogHeader>
                        <SizeForm onSave={handleSave} size={editingSize} locationId={selectedLocation.id} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Min Weight (kg)</TableHead>
                            <TableHead>Max Weight (kg)</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sizes.length > 0 ? (
                            sizes.map(size => (
                                <TableRow key={size.id}>
                                    <TableCell className="font-medium">{size.name}</TableCell>
                                    <TableCell>{size.min_weight}</TableCell>
                                    <TableCell>{size.max_weight}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(size)}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setSizeToDelete(size)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    No pet sizes defined yet.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>

            {sizeToDelete && (
                <AlertDialog open={!!sizeToDelete} onOpenChange={() => setSizeToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the "{sizeToDelete.name}" size definition. This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(sizeToDelete.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </Card>
    );
};

export default SizeSettings;