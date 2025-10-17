
    import React, { useState, useEffect, useCallback } from 'react';
    import { motion } from 'framer-motion';
    import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { PlusCircle, Loader2, Trash2, Edit, Clock, BedDouble, Sun, CalendarClock as CalendarTime, Car, Calendar, Tag, Home, Dog, Cat } from 'lucide-react';
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
    import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Textarea } from "@/components/ui/textarea";
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { supabase } from '@/lib/customSupabaseClient';
    import { useLocation } from '@/contexts/LocationContext';
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
    import { Badge } from '@/components/ui/badge';
    import useCurrency from '@/lib/useCurrency';
    import { Checkbox } from '@/components/ui/checkbox';

    const pricingTypes = [
      { id: 'fixed', label: 'Fixed Price Per Night/Service' },
      { id: 'per_size', label: 'Price Per Size Per Night/Service' },
    ];

    const serviceTypes = [
      { id: 'time_slot', label: 'Time-Based', icon: <CalendarTime className="h-4 w-4 mr-2" /> },
      { id: 'overnight', label: 'Overnight Stay', icon: <BedDouble className="h-4 w-4 mr-2" /> },
      { id: 'daycare', label: 'Daycare', icon: <Sun className="h-4 w-4 mr-2" /> },
    ];

    const addonPricingTypes = [
        { id: 'one_off', label: 'One-off fee', icon: <Tag className="h-4 w-4 mr-2" /> },
        { id: 'per_day', label: 'Per day fee', icon: <Calendar className="h-4 w-4 mr-2" /> },
        { id: 'per_km', label: 'Per kilometer fee', icon: <Car className="h-4 w-4 mr-2" /> },
    ];

    const speciesTypes = [
      { id: 'all', label: 'All Species' },
      { id: 'dog', label: 'Dogs Only' },
      { id: 'cat', label: 'Cats Only' },
    ];

    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const ServiceForm = ({ service, onSave, dogSizes, rooms, taxSettings }) => {
      const [name, setName] = useState(service?.name || '');
      const [description, setDescription] = useState(service?.description || '');
      const [bookingType, setBookingType] = useState(service?.booking_type || 'time_slot');
      const [species, setSpecies] = useState(service?.species || 'all');
      const [duration, setDuration] = useState(service?.duration_minutes || '');
      const [pricingType, setPricingType] = useState(service?.pricing?.type || 'fixed');
      const [fixedPrice, setFixedPrice] = useState(service?.pricing?.amount || '');
      const [sizePrices, setSizePrices] = useState(service?.pricing?.prices || {});
      const [schedule, setSchedule] = useState(service?.schedule || {
        days: {},
        start_time: '09:00',
        end_time: '17:00',
        check_in_time: '14:00',
        check_out_time: '11:00',
        drop_off_start: '07:00',
        drop_off_end: '09:00',
        pick_up_start: '16:00',
        pick_up_end: '18:00',
      });
      const [roomId, setRoomId] = useState(service?.room_id || null);
      const [taxRateId, setTaxRateId] = useState(service?.tax_rate_id || null);
      const [isSubmitting, setIsSubmitting] = useState(false);

      useEffect(() => {
        if (service) {
          setName(service.name || '');
          setDescription(service.description || '');
          setBookingType(service.booking_type || 'time_slot');
          setSpecies(service.species || 'all');
          setDuration(service.duration_minutes || '');
          setPricingType(service.pricing?.type || 'fixed');
          setFixedPrice(service.pricing?.amount || '');
          setSizePrices(service.pricing?.prices || {});
          setTaxRateId(service.tax_rate_id || null);
          setSchedule(s => ({
            ...s,
            days: service.schedule?.days || {},
            start_time: service.schedule?.start_time || '09:00',
            end_time: service.schedule?.end_time || '17:00',
            check_in_time: service.schedule?.check_in_time || '14:00',
            check_out_time: service.schedule?.check_out_time || '11:00',
            drop_off_start: service.schedule?.drop_off_start || '07:00',
            drop_off_end: service.schedule?.drop_off_end || '09:00',
            pick_up_start: service.schedule?.pick_up_start || '16:00',
            pick_up_end: service.schedule?.pick_up_end || '18:00',
          }));
          setRoomId(service.room_id || null);
        }
      }, [service]);

      const handleSave = async () => {
        setIsSubmitting(true);
        let pricingData = {};
        if (pricingType === 'fixed' || species === 'cat') {
            pricingData = { type: 'fixed', amount: parseFloat(fixedPrice) || 0 };
        } else {
            const parsedSizePrices = Object.keys(sizePrices).reduce((acc, key) => {
                acc[key] = parseFloat(sizePrices[key] || 0);
                return acc;
            }, {});
            pricingData = { type: 'per_size', prices: parsedSizePrices };
        }

        const serviceData = {
          name,
          description,
          booking_type: bookingType,
          species,
          duration_minutes: bookingType === 'time_slot' && duration ? parseInt(duration) : null,
          pricing: pricingData,
          schedule,
          room_id: roomId || null,
          tax_rate_id: taxRateId || null,
        };

        await onSave(serviceData);
        setIsSubmitting(false);
      };

      const handleDayToggle = (day) => {
        setSchedule(prev => {
          const newDays = { ...prev.days };
          if (newDays[day]) {
            delete newDays[day];
          } else {
            newDays[day] = true;
          }
          return { ...prev, days: newDays };
        });
      };

      return (
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">Description</Label>
            <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="species" className="text-right">For Species</Label>
            <Select value={species} onValueChange={setSpecies}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select species" />
                </SelectTrigger>
                <SelectContent>
                    {speciesTypes.map(st => <SelectItem key={st.id} value={st.id}>{st.label}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>

          <div className="col-span-full border-t my-2"></div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="bookingType" className="text-right">Service Type</Label>
            <Select value={bookingType} onValueChange={setBookingType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select service type" />
              </SelectTrigger>
              <SelectContent>
                {serviceTypes.map(st => <SelectItem key={st.id} value={st.id}>{st.icon}{st.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {bookingType === 'time_slot' && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="duration" className="text-right">Duration (mins)</Label>
              <Input id="duration" type="number" value={duration} onChange={e => setDuration(e.target.value)} className="col-span-3" />
            </div>
          )}
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tax-rate" className="text-right">Tax Rate</Label>
            <Select value={taxRateId ? taxRateId.toString() : 'none'} onValueChange={value => setTaxRateId(value === 'none' ? null : Number(value))}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a tax rate" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">No Tax</SelectItem>
                    {taxSettings.map(tax => <SelectItem key={tax.id} value={tax.id.toString()}>{tax.name} ({tax.rate}%)</SelectItem>)}
                </SelectContent>
            </Select>
          </div>

          <div className="col-span-full border-t my-2"></div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="pricingType" className="text-right">Pricing</Label>
            <Select value={pricingType} onValueChange={setPricingType} disabled={species === 'cat'}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select pricing type" />
              </SelectTrigger>
              <SelectContent>
                {pricingTypes.map(pt => <SelectItem key={pt.id} value={pt.id}>{pt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           {species === 'cat' && <p className="col-start-2 col-span-3 text-sm text-muted-foreground -mt-2">Per-size pricing is only for dogs.</p>}


          {(pricingType === 'fixed' || species === 'cat') && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="fixedPrice" className="text-right">Price (tax incl.)</Label>
              <Input id="fixedPrice" type="number" value={fixedPrice} onChange={e => setFixedPrice(e.target.value)} className="col-span-3" placeholder="e.g., 25.50" />
            </div>
          )}

          {pricingType === 'per_size' && species !== 'cat' && (
            <div className="space-y-4 rounded-md border p-4 col-span-full">
              <h4 className="font-medium text-center">Set Prices for Each Size</h4>
              {dogSizes.map(size => (
                <div key={size.id} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={`price-${size.id}`} className="text-right capitalize">{size.label} ({size.min_weight}-{size.max_weight} kg)</Label>
                  <Input
                    id={`price-${size.id}`}
                    type="number"
                    value={sizePrices[size.id] || ''}
                    onChange={e => setSizePrices(prev => ({ ...prev, [size.id]: e.target.value }))}
                    className="col-span-3"
                    placeholder={`Price for ${size.label} (tax incl.)`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="col-span-full border-t my-2"></div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="room" className="text-right">Assigned Room</Label>
            <Select value={roomId || ''} onValueChange={value => setRoomId(value === 'none' ? null : value)}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a room (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific room</SelectItem>
                {rooms.map(room => <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-full border-t my-2"></div>

          <div className="space-y-4 rounded-md border p-4 col-span-full">
            <h4 className="font-medium text-center">Availability</h4>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Available On</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <Button
                    key={day}
                    variant={schedule.days && schedule.days[day] ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleDayToggle(day)}
                    className="capitalize"
                  >
                    {day.substring(0, 3)}
                  </Button>
                ))}
              </div>
            </div>
            {bookingType === 'time_slot' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right pt-2">Operating Hours</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input type="time" value={schedule.start_time} onChange={e => setSchedule(prev => ({ ...prev, start_time: e.target.value }))} />
                  <span>-</span>
                  <Input type="time" value={schedule.end_time} onChange={e => setSchedule(prev => ({ ...prev, end_time: e.target.value }))} />
                </div>
              </div>
            )}
            {bookingType === 'overnight' && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right pt-2">Check-in / Out</Label>
                <div className="col-span-3 flex items-center gap-2">
                  <Input type="time" value={schedule.check_in_time} onChange={e => setSchedule(prev => ({ ...prev, check_in_time: e.target.value }))} />
                  <span>-</span>
                  <Input type="time" value={schedule.check_out_time} onChange={e => setSchedule(prev => ({ ...prev, check_out_time: e.target.value }))} />
                </div>
              </div>
            )}
            {bookingType === 'daycare' && (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right pt-2">Drop-off Window</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input type="time" value={schedule.drop_off_start} onChange={e => setSchedule(prev => ({ ...prev, drop_off_start: e.target.value }))} />
                    <span>-</span>
                    <Input type="time" value={schedule.drop_off_end} onChange={e => setSchedule(prev => ({ ...prev, drop_off_end: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right pt-2">Pick-up Window</Label>
                  <div className="col-span-3 flex items-center gap-2">
                    <Input type="time" value={schedule.pick_up_start} onChange={e => setSchedule(prev => ({ ...prev, pick_up_start: e.target.value }))} />
                    <span>-</span>
                    <Input type="time" value={schedule.pick_up_end} onChange={e => setSchedule(prev => ({ ...prev, pick_up_end: e.target.value }))} />
                  </div>
                </div>
              </>
            )}
            <p className="text-xs text-muted-foreground text-center">If no days are selected, the service is considered available everyday.</p>
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </div>
      );
    };

    const AddonForm = ({ addon, onSave, taxSettings }) => {
      const [name, setName] = useState(addon?.name || '');
      const [description, setDescription] = useState(addon?.description || '');
      const [pricingType, setPricingType] = useState(addon?.pricing?.type || 'one_off');
      const [amount, setAmount] = useState(addon?.pricing?.amount || '');
      const [applicableServiceTypes, setApplicableServiceTypes] = useState(addon?.applicable_service_types || []);
      const [taxRateId, setTaxRateId] = useState(addon?.tax_rate_id || null);
      const [isSubmitting, setIsSubmitting] = useState(false);

      useEffect(() => {
        if (addon) {
          setName(addon.name || '');
          setDescription(addon.description || '');
          setPricingType(addon.pricing?.type || 'one_off');
          setAmount(addon.pricing?.amount || '');
          setApplicableServiceTypes(addon.applicable_service_types || []);
          setTaxRateId(addon.tax_rate_id || null);
        } else {
          setName('');
          setDescription('');
          setPricingType('one_off');
          setAmount('');
          setApplicableServiceTypes([]);
          setTaxRateId(null);
        }
      }, [addon]);

      const handleSave = async () => {
        setIsSubmitting(true);
        const addonData = {
          name,
          description,
          pricing: {
            type: pricingType,
            amount: parseFloat(amount) || 0,
          },
          applicable_service_types: applicableServiceTypes.length > 0 ? applicableServiceTypes : null,
          tax_rate_id: taxRateId || null,
        };
        await onSave(addonData);
        setIsSubmitting(false);
      };

      const handleServiceTypeToggle = (typeId) => {
        setApplicableServiceTypes(prev =>
          prev.includes(typeId)
            ? prev.filter(t => t !== typeId)
            : [...prev, typeId]
        );
      };

      return (
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="addon-name" className="text-right">Name</Label>
            <Input id="addon-name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="addon-description" className="text-right">Description</Label>
            <Textarea id="addon-description" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" />
          </div>

          <div className="col-span-full border-t my-2"></div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="addon-tax-rate" className="text-right">Tax Rate</Label>
            <Select value={taxRateId ? taxRateId.toString() : 'none'} onValueChange={value => setTaxRateId(value === 'none' ? null : Number(value))}>
                <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a tax rate" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="none">No Tax</SelectItem>
                    {taxSettings.map(tax => <SelectItem key={tax.id} value={tax.id.toString()}>{tax.name} ({tax.rate}%)</SelectItem>)}
                </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="addon-pricing-type" className="text-right">Pricing</Label>
            <Select value={pricingType} onValueChange={setPricingType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select pricing type" />
              </SelectTrigger>
              <SelectContent>
                {addonPricingTypes.map(pt => <SelectItem key={pt.id} value={pt.id}>{pt.icon}{pt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="addon-amount" className="text-right">
              {pricingType === 'per_km' ? 'Price / km (tax incl.)' : 'Price (tax incl.)'}
            </Label>
            <Input id="addon-amount" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="col-span-3" placeholder="e.g., 1.50" />
          </div>

          <div className="col-span-full border-t my-2"></div>

          <div className="space-y-4 rounded-md border p-4 col-span-full">
            <h4 className="font-medium text-center">Availability</h4>
            <p className="text-sm text-muted-foreground text-center">Restrict this add-on to specific service types. Leave blank to apply to all.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              {serviceTypes.map(type => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.id}`}
                    checked={applicableServiceTypes.includes(type.id)}
                    onCheckedChange={() => handleServiceTypeToggle(type.id)}
                  />
                  <label htmlFor={`type-${type.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center">
                    {type.icon} {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </div>
      );
    };

    const Services = () => {
      const { toast } = useToast();
      const { selectedLocation } = useLocation();
      const { symbol } = useCurrency();
      const [services, setServices] = useState([]);
      const [addons, setAddons] = useState([]);
      const [dogSizes, setDogSizes] = useState([]);
      const [rooms, setRooms] = useState([]);
      const [taxSettings, setTaxSettings] = useState([]);
      const [loading, setLoading] = useState(true);
      const [dialogOpen, setDialogOpen] = useState(false);
      const [editingService, setEditingService] = useState(null);
      const [serviceToDelete, setServiceToDelete] = useState(null);
      const [addonDialogOpen, setAddonDialogOpen] = useState(false);
      const [editingAddon, setEditingAddon] = useState(null);
      const [addonToDelete, setAddonToDelete] = useState(null);

      useEffect(() => {
        try {
            const item = window.localStorage.getItem('settings_tax');
            setTaxSettings(item ? JSON.parse(item) : []);
        } catch (error) {
            console.error("Error reading tax settings from localStorage", error);
            setTaxSettings([]);
        }
      }, []);

      const fetchServicesAndAddons = useCallback(async () => {
        if (!selectedLocation) return;
        setLoading(true);

        const servicesPromise = supabase.from('services').select('*, rooms(name)').eq('location_id', selectedLocation.id).order('name');
        const addonsPromise = supabase.from('service_addons').select('*').eq('location_id', selectedLocation.id).order('name');
        const sizesPromise = supabase.from('pet_sizes').select('*').eq('location_id', selectedLocation.id);
        const roomsPromise = supabase.from('rooms').select('*').eq('location_id', selectedLocation.id).order('name');

        const [{ data: servicesData, error: servicesError }, { data: addonsData, error: addonsError }, { data: sizesData, error: sizesError }, { data: roomsData, error: roomsError }] = await Promise.all([servicesPromise, addonsPromise, sizesPromise, roomsPromise]);

        if (servicesError) toast({ title: 'Error fetching services', description: servicesError.message, variant: 'destructive' });
        else setServices(servicesData || []);

        if (addonsError) toast({ title: 'Error fetching add-ons', description: addonsError.message, variant: 'destructive' });
        else setAddons(addonsData || []);

        if (sizesError) {
          toast({ title: 'Error fetching pet sizes', description: sizesError.message, variant: 'destructive' });
        } else {
          setDogSizes(sizesData.map(s => ({ id: s.id, label: s.name, min_weight: s.min_weight, max_weight: s.max_weight })) || []);
        }

        if (roomsError) toast({ title: 'Error fetching rooms', description: roomsError.message, variant: 'destructive' });
        else setRooms(roomsData || []);

        setLoading(false);
      }, [selectedLocation, toast]);

      useEffect(() => {
        fetchServicesAndAddons();
      }, [fetchServicesAndAddons]);

      const handleSaveService = async (serviceData) => {
        const dataToSave = { ...serviceData, location_id: selectedLocation.id };
        const { error } = editingService
          ? await supabase.from('services').update(dataToSave).eq('id', editingService.id)
          : await supabase.from('services').insert(dataToSave);

        if (error) {
          toast({ title: 'Error saving service', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: `Service ${editingService ? 'Updated' : 'Created'}` });
          setDialogOpen(false);
          setEditingService(null);
          fetchServicesAndAddons();
        }
      };

      const handleDeleteService = async (id) => {
        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) {
          toast({ title: 'Error deleting service', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Service Deleted' });
          fetchServicesAndAddons();
        }
        setServiceToDelete(null);
      };

      const handleSaveAddon = async (addonData) => {
        const dataToSave = { ...addonData, location_id: selectedLocation.id };
        const { error } = editingAddon
          ? await supabase.from('service_addons').update(dataToSave).eq('id', editingAddon.id)
          : await supabase.from('service_addons').insert(dataToSave);

        if (error) {
          toast({ title: 'Error saving add-on', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: `Add-on ${editingAddon ? 'Updated' : 'Created'}` });
          setAddonDialogOpen(false);
          setEditingAddon(null);
          fetchServicesAndAddons();
        }
      };

      const handleDeleteAddon = async (id) => {
        const { error } = await supabase.from('service_addons').delete().eq('id', id);
        if (error) {
          toast({ title: 'Error deleting add-on', description: error.message, variant: 'destructive' });
        } else {
          toast({ title: 'Add-on Deleted' });
          fetchServicesAndAddons();
        }
        setAddonToDelete(null);
      };

      const formatPrice = (pricing, bookingType) => {
        const perText = bookingType === 'overnight' ? '/night' : (bookingType === 'daycare' ? '/day' : '/service');
        if (!pricing) return 'N/A';
        if (pricing.type === 'fixed') {
          return `${symbol}${Number(pricing.amount).toFixed(2)} ${perText}`;
        }
        if (pricing.type === 'per_size') {
          const prices = Object.values(pricing.prices || {}).filter(p => p > 0);
          if (prices.length === 0) return 'Not set';
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          return `${symbol}${min.toFixed(2)} - ${symbol}${max.toFixed(2)} ${perText}`;
        }
        return 'N/A';
      };

      const formatAddonPrice = (pricing) => {
        if (!pricing || typeof pricing.amount === 'undefined') return 'N/A';
        const price = Number(pricing.amount).toFixed(2);
        switch (pricing.type) {
          case 'one_off':
            return `${symbol}${price}`;
          case 'per_day':
            return `${symbol}${price} / day`;
          case 'per_km':
            return `${symbol}${price} / km`;
          default:
            return 'N/A';
        }
      };

      const formatSchedule = (service) => {
        if (!service.schedule) {
          return <Badge variant="secondary">Anytime</Badge>;
        }

        const availableDays = service.schedule.days ? Object.keys(service.schedule.days).filter(d => service.schedule.days[d]) : [];
        
        const dayBadges = (
            availableDays.length > 0 && availableDays.length < 7 && (
                <div className="flex flex-wrap gap-1">
                  {availableDays.map(day => <Badge key={day} variant="outline" className="capitalize">{day.substring(0, 3)}</Badge>)}
                </div>
              )
        );

        if (service.booking_type === 'overnight') {
          return (
            <div className="flex flex-col gap-1 items-start">
              {dayBadges}
              <Badge variant="outline" className="text-xs">
                Check-in: {service.schedule.check_in_time} / Check-out: {service.schedule.check_out_time}
              </Badge>
            </div>
          );
        }

        if (service.booking_type === 'daycare') {
            return (
              <div className="flex flex-col gap-1 items-start">
                {dayBadges}
                <Badge variant="outline" className="text-xs">
                  Drop-off: {service.schedule.drop_off_start}-{service.schedule.drop_off_end}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  Pick-up: {service.schedule.pick_up_start}-{service.schedule.pick_up_end}
                </Badge>
              </div>
            );
          }

        // Time-slot
        if (availableDays.length === 0 && service.schedule.start_time && service.schedule.end_time) {
          return <Badge variant="secondary">Everyday {service.schedule.start_time}-{service.schedule.end_time}</Badge>;
        }

        return (
          <div className="flex flex-col gap-1 items-start">
            {dayBadges}
            {service.schedule.start_time && service.schedule.end_time && <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{service.schedule.start_time}-{service.schedule.end_time}</Badge>}
          </div>
        );
      };

      return (
        <>
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Tabs defaultValue="services" className="space-y-4">
              <TabsList>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="addons">Add-ons</TabsTrigger>
              </TabsList>
              <TabsContent value="services" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Main Services</CardTitle>
                    <CardDescription>
                      These are the primary services you offer, like daycare, boarding, and grooming.
                    </CardDescription>
                    <div className="flex items-center justify-end pt-4">
                      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={() => { setEditingService(null); setDialogOpen(true); }}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>{editingService ? 'Edit Service' : 'Create New Service'}</DialogTitle>
                            <DialogDescription>
                              Fill in the details for your service below.
                            </DialogDescription>
                          </DialogHeader>
                          <ServiceForm service={editingService} onSave={handleSaveService} dogSizes={dogSizes} rooms={rooms} taxSettings={taxSettings} />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Service</TableHead>
                          <TableHead>Service Type</TableHead>
                          <TableHead>Species</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Tax</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead>Room</TableHead>
                          <TableHead>Schedule</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow><TableCell colSpan="9" className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                        ) : services.length > 0 ? (
                          services.map(service => {
                            const serviceType = serviceTypes.find(st => st.id === service.booking_type);
                            const tax = taxSettings.find(t => t.id === service.tax_rate_id);
                            return (
                            <TableRow key={service.id}>
                              <TableCell className="font-medium">
                                {service.name}
                              </TableCell>
                              <TableCell>
                                {serviceType && (
                                  <Badge variant="outline" className="flex items-center w-fit">
                                    {serviceType.icon}
                                    {serviceType.label}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                    {service.species === 'dog' && <Dog className="h-4 w-4 mr-1"/>}
                                    {service.species === 'cat' && <Cat className="h-4 w-4 mr-1"/>}
                                    {service.species || 'All'}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatPrice(service.pricing, service.booking_type)}</TableCell>
                              <TableCell>
                                {tax ? <Badge variant="secondary">{tax.name} ({tax.rate}%)</Badge> : <Badge variant="outline">No Tax</Badge>}
                              </TableCell>
                              <TableCell>
                                {service.booking_type === 'time_slot' && service.duration_minutes
                                  ? `${service.duration_minutes} mins`
                                  : service.booking_type === 'overnight'
                                  ? 'Per Night'
                                  : service.booking_type === 'daycare'
                                  ? 'Full Day'
                                  : 'N/A'}
                              </TableCell>
                              <TableCell>
                                {service.rooms ? (
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <Home className="h-3 w-3" /> {service.rooms.name}
                                    </Badge>
                                ) : (
                                    <Badge variant="outline">Any</Badge>
                                )}
                              </TableCell>
                              <TableCell>{formatSchedule(service)}</TableCell>
                              <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => { setEditingService(service); setDialogOpen(true); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => setServiceToDelete(service)}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )})
                        ) : (
                          <TableRow><TableCell colSpan="9" className="text-center">No services created yet.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="addons" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Service Add-ons</CardTitle>
                    <CardDescription>
                      Optional extras that can be added to a main service.
                    </CardDescription>
                     <div className="flex items-center justify-end pt-4">
                        <Dialog open={addonDialogOpen} onOpenChange={setAddonDialogOpen}>
                            <DialogTrigger asChild>
                                <Button onClick={() => { setEditingAddon(null); setAddonDialogOpen(true); }}><PlusCircle className="mr-2 h-4 w-4" />Add New Add-on</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                    <DialogTitle>{editingAddon ? 'Edit Add-on' : 'Create New Add-on'}</DialogTitle>
                                </DialogHeader>
                                <AddonForm addon={editingAddon} onSave={handleSaveAddon} taxSettings={taxSettings} />
                            </DialogContent>
                        </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Tax</TableHead>
                          <TableHead>Applies To</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan="5" className="text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>
                        ) : addons.length > 0 ? (
                            addons.map(addon => {
                                const tax = taxSettings.find(t => t.id === addon.tax_rate_id);
                                return (
                                <TableRow key={addon.id}>
                                    <TableCell className="font-medium">{addon.name}</TableCell>
                                    <TableCell>{formatAddonPrice(addon.pricing)}</TableCell>
                                    <TableCell>
                                        {tax ? <Badge variant="secondary">{tax.name} ({tax.rate}%)</Badge> : <Badge variant="outline">No Tax</Badge>}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {addon.applicable_service_types && addon.applicable_service_types.length > 0
                                                ? addon.applicable_service_types.map(typeId => {
                                                    const type = serviceTypes.find(t => t.id === typeId);
                                                    return <Badge key={typeId} variant="secondary">{type ? type.label : ''}</Badge>;
                                                })
                                                : <Badge variant="outline">All Services</Badge>
                                            }
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => { setEditingAddon(addon); setAddonDialogOpen(true); }}>
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setAddonToDelete(addon)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )})
                        ) : (
                            <TableRow><TableCell colSpan="5" className="text-center">No add-ons created yet.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
          {serviceToDelete && (
            <AlertDialog open={!!serviceToDelete} onOpenChange={() => setServiceToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{serviceToDelete.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone. This will permanently delete the service.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteService(serviceToDelete.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          {addonToDelete && (
            <AlertDialog open={!!addonToDelete} onOpenChange={() => setAddonToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete "{addonToDelete.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone. This will permanently delete the add-on.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDeleteAddon(addonToDelete.id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </>
      );
    };

    export default Services;
  