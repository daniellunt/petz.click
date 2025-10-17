import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { PlusCircle, Loader2, Calendar as CalendarIcon, Dog, DollarSign, Edit, Trash2, Cat } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
    import { useToast } from '@/components/ui/use-toast';
    import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { Calendar } from "@/components/ui/calendar";
    import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
    import { format, differenceInDays } from "date-fns";
    import { supabase } from '@/lib/customSupabaseClient';
    import { useLocation } from '@/contexts/LocationContext';
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
    import useCurrency from '@/lib/useCurrency';
    import { cn } from "@/lib/utils";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

    const BookingForm = ({ booking, onSave, clients, pets, services, dogSizes }) => {
        const [selectedClientId, setSelectedClientId] = useState(booking?.client_id || '');
        const [selectedPetId, setSelectedPetId] = useState(booking?.pet_id || '');
        const [selectedServiceId, setSelectedServiceId] = useState(booking?.service_id || '');
        const [dateRange, setDateRange] = useState({ from: booking?.start_date ? new Date(booking.start_date) : new Date(), to: booking?.end_date ? new Date(booking.end_date) : new Date() });
        const [totalPrice, setTotalPrice] = useState(booking?.total_price || 0);
        const [isSubmitting, setIsSubmitting] = useState(false);
        const { symbol } = useCurrency();

        const filteredPets = pets.filter(p => p.client_id === selectedClientId);
        
        const selectedPet = useMemo(() => pets.find(p => p.id === selectedPetId), [pets, selectedPetId]);

        const availableServices = useMemo(() => {
            if (!selectedPet) return [];
            return services.filter(s => s.booking_type === 'daycare' && (s.species === 'all' || s.species === selectedPet.species));
        }, [services, selectedPet]);

        useEffect(() => {
          if (selectedPet && !availableServices.find(s => s.id === selectedServiceId)) {
            setSelectedServiceId('');
          }
        }, [selectedPet, availableServices, selectedServiceId]);

        useEffect(() => {
            const calculatePrice = () => {
                if (!selectedServiceId || !dateRange.from) return;

                const service = services.find(s => s.id === selectedServiceId);
                const pet = pets.find(p => p.id === selectedPetId);
                if (!service || !pet) {
                    setTotalPrice(0);
                    return;
                }

                const numberOfDays = dateRange.to ? differenceInDays(dateRange.to, dateRange.from) + 1 : 1;
                let pricePerDay = 0;

                if (service.pricing.type === 'fixed') {
                    pricePerDay = service.pricing.amount;
                } else if (service.pricing.type === 'per_size' && pet.size) {
                    pricePerDay = service.pricing.prices[pet.size] || 0;
                }

                setTotalPrice(pricePerDay * numberOfDays);
            };
            calculatePrice();
        }, [selectedServiceId, selectedPetId, dateRange, services, pets]);
        
        useEffect(() => {
            if(booking){
                setSelectedClientId(booking.client_id || '');
                setSelectedPetId(booking.pet_id || '');
                setSelectedServiceId(booking.service_id || '');
                setDateRange({ from: booking.start_date ? new Date(booking.start_date) : new Date(), to: booking.end_date ? new Date(booking.end_date) : new Date() });
                setTotalPrice(booking.total_price || 0);
            }
        }, [booking]);


        const handleSave = async () => {
            setIsSubmitting(true);
            const bookingData = {
                client_id: selectedClientId,
                pet_id: selectedPetId,
                service_id: selectedServiceId,
                start_date: format(dateRange.from, 'yyyy-MM-dd'),
                end_date: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(dateRange.from, 'yyyy-MM-dd'),
                total_price: totalPrice,
                status: 'Confirmed',
                appointment_type: 'daycare',
            };
            await onSave(bookingData);
            setIsSubmitting(false);
        };

        return (
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="client" className="text-right">Client</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                        <SelectContent>
                            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                {selectedClientId && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="pet" className="text-right">Pet</Label>
                        <Select value={selectedPetId} onValueChange={setSelectedPetId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a pet" />
                            </SelectTrigger>
                            <SelectContent>
                                {filteredPets.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {selectedPetId && (
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="service" className="text-right">Service</Label>
                        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select a daycare service" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableServices.length > 0 ? (
                                    availableServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                                ) : (
                                    <p className="p-4 text-sm text-muted-foreground">No daycare services available for this pet's species.</p>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {selectedServiceId && (
                    <>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="date" className="text-right">Date(s)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn("col-span-3 justify-start text-left font-normal", !dateRange.from && "text-muted-foreground")}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateRange.from ? (
                                            dateRange.to ? (
                                                <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                                            ) : (
                                                format(dateRange.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={dateRange.from}
                                        selected={dateRange}
                                        onSelect={setDateRange}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right font-bold">Total Price</Label>
                            <div className="col-span-3 flex items-center">
                               <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                               <span className="font-semibold text-lg">{symbol}{totalPrice.toFixed(2)}</span>
                            </div>
                        </div>
                    </>
                )}

                <DialogFooter>
                    <Button onClick={handleSave} disabled={isSubmitting || !selectedPetId || !selectedServiceId}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save Booking
                    </Button>
                </DialogFooter>
            </div>
        );
    };


    const Bookings = () => {
        const { toast } = useToast();
        const { selectedLocation } = useLocation();
        const [bookings, setBookings] = useState([]);
        const [clients, setClients] = useState([]);
        const [pets, setPets] = useState([]);
        const [services, setServices] = useState([]);
        const [dogSizes, setDogSizes] = useState([]);
        const [loading, setLoading] = useState(true);
        const [dialogOpen, setDialogOpen] = useState(false);
        const [editingBooking, setEditingBooking] = useState(null);
        const [bookingToDelete, setBookingToDelete] = useState(null);
        const { symbol } = useCurrency();

        const fetchData = useCallback(async () => {
            if (!selectedLocation) return;
            setLoading(true);

            const bookingsPromise = supabase.from('bookings').select('*, clients!inner(name, location_id), pets(name, species), services(name)').eq('appointment_type', 'daycare').eq('clients.location_id', selectedLocation.id).order('start_date', { ascending: false });
            const clientsPromise = supabase.from('clients').select('*').eq('location_id', selectedLocation.id);
            const petsPromise = supabase.from('pets').select('*, clients!inner(id, location_id)').eq('clients.location_id', selectedLocation.id);
            const servicesPromise = supabase.from('services').select('*').eq('location_id', selectedLocation.id);
            const sizesPromise = supabase.from('dog_sizes').select('*');

            const [
                { data: bookingsData, error: bookingsError },
                { data: clientsData, error: clientsError },
                { data: petsData, error: petsError },
                { data: servicesData, error: servicesError },
                { data: sizesData, error: sizesError }
            ] = await Promise.all([bookingsPromise, clientsPromise, petsPromise, servicesPromise, sizesPromise]);

            if (bookingsError) toast({ title: 'Error fetching bookings', description: bookingsError.message, variant: 'destructive' });
            else setBookings(bookingsData || []);

            if (clientsError) toast({ title: 'Error fetching clients', description: clientsError.message, variant: 'destructive' });
            else setClients(clientsData || []);

            if (petsError) toast({ title: 'Error fetching pets', description: petsError.message, variant: 'destructive' });
            else setPets(petsData || []);
            
            if (servicesError) toast({ title: 'Error fetching services', description: servicesError.message, variant: 'destructive' });
            else setServices(servicesData || []);
            
            if (sizesError) toast({ title: 'Error fetching dog sizes', description: sizesError.message, variant: 'destructive' });
            else setDogSizes(sizesData || []);

            setLoading(false);
        }, [selectedLocation, toast]);

        useEffect(() => {
            fetchData();
        }, [fetchData]);

        const handleSaveBooking = async (bookingData) => {
            const { error } = editingBooking
                ? await supabase.from('bookings').update(bookingData).eq('id', editingBooking.id)
                : await supabase.from('bookings').insert(bookingData);
            
            if (error) {
                toast({ title: 'Error saving booking', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: `Booking ${editingBooking ? 'Updated' : 'Created'}` });
                setDialogOpen(false);
                setEditingBooking(null);
                fetchData();
            }
        };
        
        const handleDeleteBooking = async (id) => {
            const { error } = await supabase.from('bookings').delete().eq('id', id);
            if (error) {
                toast({ title: 'Error deleting booking', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Booking Deleted' });
                fetchData();
            }
            setBookingToDelete(null);
        };

        return (
            <>
                <Helmet>
                    <title>Daycare Bookings - PetSuite</title>
                    <meta name="description" content="Manage all your daycare bookings." />
                </Helmet>
                <motion.div
                    className="flex-1 space-y-4 p-8 pt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-between space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Daycare Bookings</h1>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { setEditingBooking(null); setDialogOpen(true); }}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> New Daycare Booking
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>{editingBooking ? 'Edit Booking' : 'Create Daycare Booking'}</DialogTitle>
                                    <DialogDescription>
                                        Fill in the details for the daycare booking below.
                                    </DialogDescription>
                                </DialogHeader>
                                <BookingForm 
                                    booking={editingBooking} 
                                    onSave={handleSaveBooking} 
                                    clients={clients} 
                                    pets={pets}
                                    services={services}
                                    dogSizes={dogSizes}
                                />
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Bookings</CardTitle>
                            <CardDescription>A list of all scheduled daycare visits.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Pet</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Dates</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow><TableCell colSpan="6" className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                                    ) : bookings.length > 0 ? (
                                        bookings.map(booking => (
                                            <TableRow key={booking.id}>
                                                <TableCell className="font-medium">{booking.clients.name}</TableCell>
                                                <TableCell className="flex items-center">
                                                    {booking.pets.species === 'Dog' && <Dog className="h-4 w-4 mr-2 text-muted-foreground" />}
                                                    {booking.pets.species === 'Cat' && <Cat className="h-4 w-4 mr-2 text-muted-foreground" />}
                                                    {booking.pets.name}
                                                </TableCell>
                                                <TableCell>{booking.services.name}</TableCell>
                                                <TableCell>
                                                    {format(new Date(booking.start_date), "LLL dd, y")} - {format(new Date(booking.end_date), "LLL dd, y")}
                                                </TableCell>
                                                <TableCell>{symbol}{Number(booking.total_price).toFixed(2)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingBooking(booking); setDialogOpen(true); }}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setBookingToDelete(booking)}>
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan="6" className="text-center">No bookings found.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </motion.div>
                
                {bookingToDelete && (
                    <AlertDialog open={!!bookingToDelete} onOpenChange={() => setBookingToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Delete this booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the booking for {bookingToDelete.pets.name} from {format(new Date(bookingToDelete.start_date), "PPP")}.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteBooking(bookingToDelete.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                )}
            </>
        );
    };

    export default Bookings;