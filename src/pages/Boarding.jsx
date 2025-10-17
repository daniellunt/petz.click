import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion, AnimatePresence } from 'framer-motion';
    import { PlusCircle, Loader2, Dog, Edit, Trash2, Cat, BedDouble, Sparkles, ArrowLeft, ArrowRight, Car } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
    import { useToast } from '@/components/ui/use-toast';
    import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
    import { Label } from "@/components/ui/label";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { Calendar } from "@/components/ui/calendar";
    import { format, differenceInDays, addDays } from "date-fns";
    import { supabase } from '@/lib/customSupabaseClient';
    import { useLocation } from '@/contexts/LocationContext';
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
    import useCurrency from '@/lib/useCurrency';
    import { Checkbox } from '@/components/ui/checkbox';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
    import { Progress } from "@/components/ui/progress";
    import { Separator } from '@/components/ui/separator';

    const BoardingForm = ({ booking, onSave, clients, pets, services, addons, bookingAddons, locationDetails }) => {
        const [currentStep, setCurrentStep] = useState(1);
        const [formData, setFormData] = useState({
            clientId: '',
            petId: '',
            serviceId: '',
            dateRange: { from: undefined, to: undefined },
            selectedAddons: new Set(),
        });
        const [priceDetails, setPriceDetails] = useState({ subtotal: 0, taxAmount: 0, total: 0, taxBreakdown: [] });
        const [isSubmitting, setIsSubmitting] = useState(false);
        const { symbol } = useCurrency();
        const { toast } = useToast();
        const [taxSettings, setTaxSettings] = useState([]);

        const totalSteps = 4;

        useEffect(() => {
            try {
                const item = window.localStorage.getItem('settings_tax');
                setTaxSettings(item ? JSON.parse(item) : []);
            } catch (error) {
                console.error("Error reading tax settings from localStorage", error);
                setTaxSettings([]);
            }
        }, []);

        useEffect(() => {
            if (booking) {
                setFormData({
                    clientId: booking.client_id || '',
                    petId: booking.pet_id || '',
                    serviceId: booking.service_id || '',
                    dateRange: {
                        from: booking.start_date ? new Date(booking.start_date) : undefined,
                        to: booking.end_date ? new Date(booking.end_date) : undefined
                    },
                    selectedAddons: new Set(bookingAddons.filter(ba => ba.booking_id === booking.id).map(ba => ba.addon_id)),
                });
            } else {
                 setFormData({
                    clientId: '',
                    petId: '',
                    serviceId: '',
                    dateRange: { from: addDays(new Date(), 1), to: addDays(new Date(), 2) },
                    selectedAddons: new Set(),
                });
            }
        }, [booking, bookingAddons]);


        const filteredPets = useMemo(() => pets.filter(p => p.client_id === formData.clientId), [pets, formData.clientId]);
        const selectedPet = useMemo(() => pets.find(p => p.id === formData.petId), [pets, formData.petId]);
        const selectedClient = useMemo(() => clients.find(c => c.id === formData.clientId), [clients, formData.clientId]);

        const availableServices = useMemo(() => {
            if (!selectedPet) return [];
            return services.filter(s => s.booking_type === 'overnight' && (s.species === 'all' || s.species === selectedPet.species));
        }, [services, selectedPet]);

        const availableAddons = useMemo(() => {
            return addons.filter(a => a.applicable_service_types.includes('boarding') || a.applicable_service_types.includes('overnight'));
        }, [addons]);

        const handleFormChange = (field, value) => {
            setFormData(prev => ({ ...prev, [field]: value }));
        };

        const handleAddonToggle = (addonId) => {
            const newSelection = new Set(formData.selectedAddons);
            if (newSelection.has(addonId)) {
                newSelection.delete(addonId);
            } else {
                newSelection.add(addonId);
            }
            handleFormChange('selectedAddons', newSelection);
        };

         useEffect(() => {
            if (selectedPet && !availableServices.some(s => s.id === formData.serviceId)) {
                handleFormChange('serviceId', '');
            }
        }, [selectedPet, availableServices, formData.serviceId]);

        useEffect(() => {
            const calculatePrice = () => {
                let total = 0;
                let itemsForTax = [];

                const { dateRange, serviceId, petId, selectedAddons: currentSelectedAddons } = formData;
                const numberOfNights = (dateRange.from && dateRange.to) ? differenceInDays(dateRange.to, dateRange.from) : 0;

                if (serviceId && numberOfNights > 0) {
                    const service = services.find(s => s.id === serviceId);
                    const pet = pets.find(p => p.id === petId);
                    if (service && pet) {
                        let pricePerNight = 0;
                        if (service.pricing.type === 'fixed') {
                            pricePerNight = service.pricing.amount;
                        } else if (service.pricing.type === 'per_size' && pet.size) {
                            pricePerNight = service.pricing.prices[pet.size] || 0;
                        }
                        const serviceTotal = pricePerNight * numberOfNights;
                        total += serviceTotal;
                        itemsForTax.push({ amount: serviceTotal, tax_rate_id: service.tax_rate_id });
                    }
                }

                currentSelectedAddons.forEach(addonId => {
                    const addon = addons.find(a => a.id === addonId);
                    if (addon) {
                        let addonTotal = 0;
                        if (addon.pricing.type === 'fixed' || addon.pricing.type === 'one_off') {
                            addonTotal = addon.pricing.amount;
                        } else if ((addon.pricing.type === 'per_night' || addon.pricing.type === 'per_day') && numberOfNights > 0) {
                            addonTotal = addon.pricing.amount * numberOfNights;
                        } else if (addon.pricing.type === 'per_km') {
                            if (locationDetails?.address && selectedClient?.address) {
                                const simulatedDistance = Math.floor(Math.random() * (50 - 5 + 1)) + 5; 
                                addonTotal = addon.pricing.amount * simulatedDistance;
                            }
                        }
                        total += addonTotal;
                        itemsForTax.push({ amount: addonTotal, tax_rate_id: addon.tax_rate_id });
                    }
                });

                const taxSummary = {};
                let subtotal = 0;

                itemsForTax.forEach(item => {
                    if (item.tax_rate_id) {
                        const tax = taxSettings.find(t => t.id === item.tax_rate_id);
                        if (tax) {
                            const taxRate = tax.rate / 100;
                            const basePrice = item.amount / (1 + taxRate);
                            const taxAmount = item.amount - basePrice;
                            subtotal += basePrice;

                            if (!taxSummary[tax.id]) {
                                taxSummary[tax.id] = { name: tax.name, rate: tax.rate, amount: 0 };
                            }
                            taxSummary[tax.id].amount += taxAmount;
                        } else {
                            subtotal += item.amount;
                        }
                    } else {
                        subtotal += item.amount;
                    }
                });

                const taxBreakdown = Object.values(taxSummary);
                const totalTaxAmount = taxBreakdown.reduce((sum, tax) => sum + tax.amount, 0);

                setPriceDetails({
                    subtotal: subtotal,
                    taxAmount: totalTaxAmount,
                    total: total,
                    taxBreakdown: taxBreakdown,
                });
            };
            calculatePrice();
        }, [formData, services, pets, addons, locationDetails, selectedClient, taxSettings]);

        const handleSave = async () => {
            setIsSubmitting(true);
            const { clientId, petId, serviceId, dateRange, selectedAddons: formAddons } = formData;
            const bookingData = {
                client_id: clientId,
                pet_id: petId,
                service_id: serviceId,
                room_id: null,
                start_date: format(dateRange.from, 'yyyy-MM-dd'),
                end_date: dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : format(dateRange.from, 'yyyy-MM-dd'),
                total_price: priceDetails.total,
                status: 'Confirmed',
                appointment_type: 'boarding',
            };

            const addonsData = Array.from(formAddons).map(addonId => {
                const addon = addons.find(a => a.id === addonId);
                const numberOfNights = (dateRange.from && dateRange.to) ? differenceInDays(dateRange.to, dateRange.from) : 0;
                let price = 0;
                if(addon) {
                  if(addon.pricing.type === 'fixed' || addon.pricing.type === 'one_off') {
                    price = addon.pricing.amount;
                  } else if ((addon.pricing.type === 'per_night' || addon.pricing.type === 'per_day') && numberOfNights > 0) {
                    price = addon.pricing.amount * numberOfNights;
                  } else if (addon.pricing.type === 'per_km') {
                    if (locationDetails?.address && selectedClient?.address) {
                        const simulatedDistance = Math.floor(Math.random() * (50 - 5 + 1)) + 5;
                        price = addon.pricing.amount * simulatedDistance;
                    }
                  }
                }
                return { addon_id: addonId, price, quantity: 1 };
            });

            await onSave(bookingData, addonsData);
            setIsSubmitting(false);
        };

        const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps + 1));
        const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

        const isStepValid = () => {
            switch(currentStep) {
                case 1: return formData.clientId && formData.petId && formData.serviceId;
                case 2: return formData.dateRange.from && formData.dateRange.to;
                case 3: return true;
                case 4: return true;
                default: return false;
            }
        }

        const stepVariants = {
          hidden: { opacity: 0, x: 50 },
          visible: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: -50 },
        };
        
        const AddonItem = ({ addon }) => {
            const isPerKm = addon.pricing.type === 'per_km';
            const canCalculate = isPerKm ? locationDetails?.address && selectedClient?.address : true;
            let displayPrice;
            let simulatedDistance;

            if (isPerKm && canCalculate) {
                simulatedDistance = Math.floor(Math.random() * (50 - 5 + 1)) + 5;
                displayPrice = (addon.pricing.amount * simulatedDistance).toFixed(2);
            } else {
                displayPrice = addon.pricing.amount.toFixed(2);
            }

            return (
                <div className={`flex items-center space-x-2 p-2 rounded-lg border ${formData.selectedAddons.has(addon.id) ? 'bg-accent' : ''}`}>
                    <Checkbox id={`addon-${addon.id}`} checked={formData.selectedAddons.has(addon.id)} onCheckedChange={() => handleAddonToggle(addon.id)} />
                    <label htmlFor={`addon-${addon.id}`} className="text-sm font-medium leading-none cursor-pointer w-full">
                        {addon.name}
                        {isPerKm ? (
                            <div className="text-muted-foreground">
                                {canCalculate ? (
                                    <span>
                                        {symbol}{displayPrice} ({symbol}{addon.pricing.amount.toFixed(2)}/km for {simulatedDistance} km)
                                    </span>
                                ) : (
                                    <span className="text-destructive-foreground bg-destructive p-1 rounded-md text-xs">
                                        Missing address data
                                    </span>
                                )}
                            </div>
                        ) : (
                            <span className="text-muted-foreground">
                                ({symbol}{displayPrice}{addon.pricing.type === 'per_night' || addon.pricing.type === 'per_day' ? '/day' : ''})
                            </span>
                        )}
                    </label>
                </div>
            );
        };

        return (
            <div className="flex flex-col gap-6 py-4 max-h-[80vh]">
                <Progress value={(currentStep / (totalSteps + 1)) * 100} className="w-full" />
                <div className="flex-grow overflow-y-auto px-1 min-h-[40vh]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      variants={stepVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ duration: 0.3 }}
                    >
                        {currentStep === 1 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Step 1: Booking Details</h3>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="client">Client</Label>
                                    <Select value={formData.clientId} onValueChange={(val) => { handleFormChange('clientId', val); handleFormChange('petId', ''); handleFormChange('serviceId', ''); }}><SelectTrigger><SelectValue placeholder="Select a client" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select>
                                </div>
                                {formData.clientId && (
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="pet">Pet</Label>
                                        <Select value={formData.petId} onValueChange={(val) => { handleFormChange('petId', val); handleFormChange('serviceId', ''); }}><SelectTrigger><SelectValue placeholder="Select a pet" /></SelectTrigger><SelectContent>{filteredPets.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                )}
                                {formData.petId && (
                                    <div className="grid w-full items-center gap-1.5">
                                        <Label htmlFor="service">Service</Label>
                                        <Select value={formData.serviceId} onValueChange={(val) => handleFormChange('serviceId', val)}><SelectTrigger><SelectValue placeholder="Select a boarding service" /></SelectTrigger><SelectContent>{availableServices.length > 0 ? availableServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>) : <p className="p-4 text-sm text-muted-foreground">No overnight services for this pet's species.</p>}</SelectContent></Select>
                                    </div>
                                )}
                            </div>
                        )}
                        {currentStep === 2 && (
                            <div className="space-y-4 flex flex-col items-center">
                                <h3 className="font-semibold text-lg text-center">Step 2: Select Dates</h3>
                                 <Calendar
                                    initialFocus
                                    mode="range"
                                    numberOfMonths={1}
                                    defaultMonth={formData.dateRange.from}
                                    selected={formData.dateRange}
                                    onSelect={(val) => handleFormChange('dateRange', val)}
                                    className="p-0 rounded-md border"
                                    classNames={{
                                      day_range_start: "day-range-start",
                                      day_range_end: "day-range-end",
                                    }}
                                />
                                {formData.dateRange.from && formData.dateRange.to && <p className="text-sm text-muted-foreground text-center pt-2">Total stay: {differenceInDays(formData.dateRange.to, formData.dateRange.from)} nights</p>}
                            </div>
                        )}
                        {currentStep === 3 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center"><Sparkles className="h-5 w-5 mr-2 text-primary"/>Step 3: Add-ons</h3>
                                {availableAddons.length > 0 ? (
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                      {availableAddons.map(addon => <AddonItem key={addon.id} addon={addon} />)}
                                  </div>
                                ) : (
                                    <p className="text-muted-foreground">No add-ons available for boarding services.</p>
                                )}
                            </div>
                        )}
                        {currentStep === 4 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Step 4: Review Booking</h3>
                                <Card>
                                    <CardContent className="pt-6 grid gap-4">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Client:</span>
                                            <span className="font-medium">{clients.find(c => c.id === formData.clientId)?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Pet:</span>
                                            <span className="font-medium">{pets.find(p => p.id === formData.petId)?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Service:</span>
                                            <span className="font-medium">{services.find(s => s.id === formData.serviceId)?.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Dates:</span>
                                            <span className="font-medium">{formData.dateRange.from && format(formData.dateRange.from, 'PP')} to {formData.dateRange.to && format(formData.dateRange.to, 'PP')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Nights:</span>
                                            <span className="font-medium">{formData.dateRange.from && formData.dateRange.to ? differenceInDays(formData.dateRange.to, formData.dateRange.from) : 0}</span>
                                        </div>
                                        {formData.selectedAddons.size > 0 && (
                                            <div className="pt-2">
                                                <h4 className="font-medium mb-2">Add-ons:</h4>
                                                {Array.from(formData.selectedAddons).map(addonId => {
                                                    const addon = addons.find(a => a.id === addonId);
                                                    if (!addon) return null;

                                                    let priceText = '';
                                                    if (addon.pricing.type === 'per_km') {
                                                        if (locationDetails?.address && selectedClient?.address) {
                                                            const simulatedDistance = Math.floor(Math.random() * (50 - 5 + 1)) + 5;
                                                            const transportCost = addon.pricing.amount * simulatedDistance;
                                                            priceText = `${symbol}${transportCost.toFixed(2)} (${simulatedDistance} km)`;
                                                        } else {
                                                            priceText = 'Address missing';
                                                        }
                                                    } else {
                                                         priceText = `${symbol}${addon.pricing.amount.toFixed(2)}${addon.pricing.type === 'per_night' || addon.pricing.type === 'per_day' ? '/day' : ''}`;
                                                    }

                                                    return <div key={addonId} className="flex justify-between text-sm"><span className="text-muted-foreground">{addon?.name}</span><span>{priceText}</span></div>
                                                })}
                                            </div>
                                        )}
                                        <Separator className="my-2" />
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Subtotal:</span>
                                            <span className="font-medium">{symbol}{priceDetails.subtotal.toFixed(2)}</span>
                                        </div>
                                        {priceDetails.taxBreakdown.map((tax, index) => (
                                          <div key={index} className="flex justify-between text-sm">
                                              <span className="text-muted-foreground">{tax.name} ({tax.rate}%):</span>
                                              <span className="font-medium">{symbol}{tax.amount.toFixed(2)}</span>
                                          </div>
                                        ))}
                                        <Separator className="my-2" />
                                        <div className="flex justify-between items-center text-lg font-bold">
                                            <span>Total Price:</span>
                                            <span>{symbol}{priceDetails.total.toFixed(2)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                <DialogFooter className="pt-4 border-t">
                    {currentStep > 1 && (
                        <Button variant="outline" onClick={prevStep}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    )}
                    <div className="flex-grow"></div>
                    {currentStep < totalSteps + 1 && currentStep !== 4 && (
                        <Button onClick={nextStep} disabled={!isStepValid()}>
                            Next
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                    {currentStep === 4 && (
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {booking ? 'Update Booking' : 'Save Booking'}
                        </Button>
                    )}
                </DialogFooter>
            </div>
        );
    };


    const Boarding = () => {
        const { toast } = useToast();
        const { selectedLocation } = useLocation();
        const [bookings, setBookings] = useState([]);
        const [clients, setClients] = useState([]);
        const [pets, setPets] = useState([]);
        const [services, setServices] = useState([]);
        const [addons, setAddons] = useState([]);
        const [bookingAddons, setBookingAddons] = useState([]);
        const [rooms, setRooms] = useState([]);
        const [loading, setLoading] = useState(true);
        const [dialogOpen, setDialogOpen] = useState(false);
        const [editingBooking, setEditingBooking] = useState(null);
        const [bookingToDelete, setBookingToDelete] = useState(null);
        const { symbol } = useCurrency();

        const fetchData = useCallback(async () => {
            if (!selectedLocation) return;
            setLoading(true);
            const bookingsPromise = supabase.from('bookings').select('*, clients!inner(name, location_id), pets(name, species), services(name), rooms(name)').eq('appointment_type', 'boarding').eq('clients.location_id', selectedLocation.id).order('start_date', { ascending: false });
            const clientsPromise = supabase.from('clients').select('*').eq('location_id', selectedLocation.id);
            const petsPromise = supabase.from('pets').select('*, clients!inner(id, location_id)').eq('clients.location_id', selectedLocation.id);
            const servicesPromise = supabase.from('services').select('*').eq('location_id', selectedLocation.id);
            const addonsPromise = supabase.from('service_addons').select('*').eq('location_id', selectedLocation.id);
            const bookingAddonsPromise = supabase.from('booking_addons').select('*');
            const roomsPromise = supabase.from('rooms').select('*').eq('location_id', selectedLocation.id);

            const [
                { data: bookingsData, error: bookingsError },
                { data: clientsData, error: clientsError },
                { data: petsData, error: petsError },
                { data: servicesData, error: servicesError },
                { data: addonsData, error: addonsError },
                { data: bookingAddonsData, error: bookingAddonsError },
                { data: roomsData, error: roomsError }
            ] = await Promise.all([bookingsPromise, clientsPromise, petsPromise, servicesPromise, addonsPromise, bookingAddonsPromise, roomsPromise]);

            if (bookingsError) toast({ title: 'Error fetching bookings', description: bookingsError.message, variant: 'destructive' }); else setBookings(bookingsData || []);
            if (clientsError) toast({ title: 'Error fetching clients', description: clientsError.message, variant: 'destructive' }); else setClients(clientsData || []);
            if (petsError) toast({ title: 'Error fetching pets', description: petsError.message, variant: 'destructive' }); else setPets(petsData || []);
            if (servicesError) toast({ title: 'Error fetching services', description: servicesError.message, variant: 'destructive' }); else setServices(servicesData || []);
            if (addonsError) toast({ title: 'Error fetching addons', description: addonsError.message, variant: 'destructive' }); else setAddons(addonsData || []);
            if (bookingAddonsError) toast({ title: 'Error fetching booking addons', description: bookingAddonsError.message, variant: 'destructive' }); else setBookingAddons(bookingAddonsData || []);
            if (roomsError) toast({ title: 'Error fetching rooms', description: roomsError.message, variant: 'destructive' }); else setRooms(roomsData || []);
            setLoading(false);
        }, [selectedLocation, toast]);

        useEffect(() => { fetchData(); }, [fetchData]);

        const handleSaveBooking = async (bookingData, addonsData) => {
            let savedBookingId = editingBooking?.id;

            if (editingBooking) {
                const { error } = await supabase.from('bookings').update(bookingData).eq('id', editingBooking.id);
                if (error) {
                    toast({ title: 'Error updating booking', description: error.message, variant: 'destructive' });
                    return;
                }
            } else {
                const { data, error } = await supabase.from('bookings').insert(bookingData).select('id').single();
                if (error) {
                    toast({ title: 'Error creating booking', description: error.message, variant: 'destructive' });
                    return;
                }
                savedBookingId = data.id;
            }

            if (savedBookingId) {
                const { error: deleteAddonsError } = await supabase.from('booking_addons').delete().eq('booking_id', savedBookingId);
                if (deleteAddonsError) {
                     toast({ title: 'Error clearing old addons', description: deleteAddonsError.message, variant: 'destructive' });
                }

                if (addonsData.length > 0) {
                    const addonsToInsert = addonsData.map(ad => ({ ...ad, booking_id: savedBookingId }));
                    const { error: insertAddonsError } = await supabase.from('booking_addons').insert(addonsToInsert);
                    if (insertAddonsError) {
                        toast({ title: 'Error saving addons', description: insertAddonsError.message, variant: 'destructive' });
                    }
                }
            }

            toast({ title: `Booking ${editingBooking ? 'Updated' : 'Created'}` });
            setDialogOpen(false);
            setEditingBooking(null);
            fetchData();
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
                    <title>Boarding Bookings - PetSuite</title>
                    <meta name="description" content="Manage all your boarding bookings." />
                </Helmet>
                <motion.div className="flex-1 space-y-4 p-8 pt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="flex items-center justify-between space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Boarding Bookings</h1>
                        <Dialog open={dialogOpen} onOpenChange={(isOpen) => { if (!isOpen) setEditingBooking(null); setDialogOpen(isOpen); }}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { setEditingBooking(null); setDialogOpen(true); }}>
                                    <PlusCircle className="mr-2 h-4 w-4" /> New Boarding Booking
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>{editingBooking ? 'Edit Booking' : 'Create Boarding Booking'}</DialogTitle>
                                    <DialogDescription>Follow the steps to create or edit a boarding booking.</DialogDescription>
                                </DialogHeader>
                                <BoardingForm booking={editingBooking} onSave={handleSaveBooking} clients={clients} pets={pets} services={services} addons={addons} bookingAddons={bookingAddons} locationDetails={selectedLocation} />
                            </DialogContent>
                        </Dialog>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle>Upcoming Stays</CardTitle>
                            <CardDescription>A list of all scheduled boarding stays.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Pet</TableHead>
                                        <TableHead>Room</TableHead>
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
                                                <TableCell><BedDouble className="inline-block h-4 w-4 mr-2 text-muted-foreground" />{booking.rooms?.name || 'N/A'}</TableCell>
                                                <TableCell>{format(new Date(booking.start_date), "LLL dd, y")} - {format(new Date(booking.end_date), "LLL dd, y")}</TableCell>
                                                <TableCell>{symbol}{Number(booking.total_price).toFixed(2)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => { setEditingBooking(booking); setDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setBookingToDelete(booking)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan="6" className="text-center">No boarding bookings found.</TableCell></TableRow>
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
                                <AlertDialogDescription>This action cannot be undone. This will permanently delete the booking for {bookingToDelete.pets.name}.</AlertDialogDescription>
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

    export default Boarding;