
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Map, Truck, User, Calendar as CalendarIcon, PlusCircle, Loader2, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useLocation } from '@/contexts/LocationContext';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const RouteForm = ({ route, onSave, vehicles, drivers }) => {
    const [selectedVehicleId, setSelectedVehicleId] = useState(route?.vehicle_id || '');
    const [selectedDriverId, setSelectedDriverId] = useState(route?.driver_id || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSave = async () => {
        setIsSubmitting(true);
        await onSave({
            vehicle_id: selectedVehicleId,
            driver_id: selectedDriverId,
        });
        setIsSubmitting(false);
    };

    return (
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="vehicle" className="text-right">Vehicle</Label>
                <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a vehicle" /></SelectTrigger>
                    <SelectContent>
                        {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.name} ({v.plate_number})</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="driver" className="text-right">Driver</Label>
                <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                    <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a driver" /></SelectTrigger>
                    <SelectContent>
                        {drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                <Button onClick={handleSave} disabled={isSubmitting || !selectedVehicleId || !selectedDriverId}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Route
                </Button>
            </DialogFooter>
        </div>
    );
};

const Transport = () => {
    const { toast } = useToast();
    const { selectedLocation } = useLocation();
    const [date, setDate] = useState(new Date());
    const [routes, setRoutes] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRoute, setEditingRoute] = useState(null);
    const [routeToDelete, setRouteToDelete] = useState(null);

    const fetchData = useCallback(async () => {
        if (!selectedLocation || !date) return;
        setLoading(true);

        const formattedDate = format(date, 'yyyy-MM-dd');

        const routesPromise = supabase.from('routes').select('*, vehicles(*), profiles:driver_id(*)').eq('location_id', selectedLocation.id).eq('route_date', formattedDate);
        const bookingsPromise = supabase.from('bookings').select('*, clients!inner(name, location_id)').eq('clients.location_id', selectedLocation.id).eq('start_date', formattedDate);
        const vehiclesPromise = supabase.from('vehicles').select('*').eq('location_id', selectedLocation.id);
        const driversPromise = supabase.from('profiles').select('*').eq('location_id', selectedLocation.id);

        const [
            { data: routesData, error: routesError },
            { data: bookingsData, error: bookingsError },
            { data: vehiclesData, error: vehiclesError },
            { data: driversData, error: driversError },
        ] = await Promise.all([routesPromise, bookingsPromise, vehiclesPromise, driversPromise]);

        if (routesError) toast({ title: 'Error fetching routes', description: routesError.message, variant: 'destructive' });
        else setRoutes(routesData || []);

        if (bookingsError) toast({ title: 'Error fetching bookings', description: bookingsError.message, variant: 'destructive' });
        else setBookings(bookingsData || []);

        if (vehiclesError) toast({ title: 'Error fetching vehicles', description: vehiclesError.message, variant: 'destructive' });
        else setVehicles(vehiclesData || []);

        if (driversError) toast({ title: 'Error fetching drivers', description: driversError.message, variant: 'destructive' });
        else setDrivers(driversData || []);

        setLoading(false);
    }, [selectedLocation, date, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveRoute = async (routeData) => {
        const dataToSave = {
            ...routeData,
            route_date: format(date, 'yyyy-MM-dd'),
            location_id: selectedLocation.id,
        };

        const { error } = editingRoute
            ? await supabase.from('routes').update(dataToSave).eq('id', editingRoute.id)
            : await supabase.from('routes').insert(dataToSave);

        if (error) {
            toast({ title: 'Error saving route', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: `Route ${editingRoute ? 'Updated' : 'Created'}` });
            setDialogOpen(false);
            setEditingRoute(null);
            fetchData();
        }
    };

    const handleDeleteRoute = async (id) => {
        const { error } = await supabase.from('routes').delete().eq('id', id);
        if (error) {
            toast({ title: 'Error deleting route', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Route Deleted' });
            fetchData();
        }
        setRouteToDelete(null);
    };

    return (
        <>
            <Helmet>
                <title>Transport Management - PetSuite</title>
                <meta name="description" content="Manage daily transport routes and bookings." />
            </Helmet>
            <motion.div
                className="flex-1 space-y-4 p-8 pt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Transport</h1>
                    <div className="flex items-center space-x-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn("w-[280px] justify-start text-left font-normal", !date && "text-muted-foreground")}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { setEditingRoute(null); setDialogOpen(true); }}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> Create Route
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingRoute ? 'Edit Route' : 'Create New Route'}</DialogTitle>
                                    <DialogDescription>Assign a vehicle and driver for {format(date, "PPP")}.</DialogDescription>
                                </DialogHeader>
                                <RouteForm route={editingRoute} onSave={handleSaveRoute} vehicles={vehicles} drivers={drivers} />
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>Bookings for Transport</CardTitle>
                            <CardDescription>Pets needing pickup/drop-off on {format(date, "PPP")}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> :
                                bookings.length > 0 ? (
                                    <ul className="space-y-2">
                                        {bookings.map(booking => (
                                            <li key={booking.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                                <span>{booking.clients.name}'s Pet</span>
                                                <Button size="sm" variant="outline">Add to Route</Button>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p>No bookings for this date.</p>
                            }
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Active Routes</CardTitle>
                            <CardDescription>Routes scheduled for {format(date, "PPP")}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> :
                                routes.length > 0 ? (
                                    <div className="space-y-4">
                                        {routes.map(route => (
                                            <Card key={route.id}>
                                                <CardHeader className="flex flex-row items-center justify-between">
                                                    <div>
                                                        <CardTitle className="flex items-center"><Truck className="mr-2 h-5 w-5" /> {route.vehicles.name}</CardTitle>
                                                        <CardDescription className="flex items-center mt-1"><User className="mr-2 h-4 w-4" /> {route.profiles?.full_name || 'Unknown Driver'}</CardDescription>
                                                    </div>
                                                    <div>
                                                        <Button variant="ghost" size="icon" onClick={() => { setEditingRoute(route); setDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                                        <Button variant="ghost" size="icon" onClick={() => setRouteToDelete(route)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                        <Button size="sm" className="ml-2"><Map className="mr-2 h-4 w-4" /> View Route</Button>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground">Route stops will be shown here.</p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : <p>No routes created for this date.</p>
                            }
                        </CardContent>
                    </Card>
                </div>
            </motion.div>
            {routeToDelete && (
                <AlertDialog open={!!routeToDelete} onOpenChange={() => setRouteToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Delete this route?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the route for {routeToDelete.vehicles.name} driven by {routeToDelete.profiles?.full_name || 'Unknown Driver'}.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteRoute(routeToDelete.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
        </>
    );
};

export default Transport;
