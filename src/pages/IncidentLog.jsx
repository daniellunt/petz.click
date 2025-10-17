
    import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useToast } from '@/components/ui/use-toast';
    import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
    import { Button } from '@/components/ui/button';
    import { Loader2, PlusCircle, Calendar as CalendarIcon, X, Video, Image as ImageIcon, Trash2, ShieldAlert, User, Dog, Clipboard, Edit } from 'lucide-react';
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
    import { Input } from "@/components/ui/input";
    import { Label } from "@/components/ui/label";
    import { Textarea } from "@/components/ui/textarea";
    import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
    import { Calendar } from "@/components/ui/calendar";
    import { format, parseISO } from 'date-fns';
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
    import { Badge } from '@/components/ui/badge';
    import { useLocation } from '@/contexts/LocationContext';
    import { useUser } from '@/contexts/UserContext';
    import MediaUpload from '@/components/MediaUpload';
    import { Link } from 'react-router-dom';
    import { Separator } from '@/components/ui/separator';
    
    const severityLevels = [
        { value: 1, label: 'Minor', color: 'bg-blue-500' },
        { value: 2, label: 'Low', color: 'bg-green-500' },
        { value: 3, label: 'Medium', color: 'bg-yellow-500' },
        { value: 4, label: 'High', color: 'bg-orange-500' },
        { value: 5, label: 'Critical', color: 'bg-red-500' },
    ];
    
    const IncidentForm = ({ incident, onSave, staffList, petList, locationId, onClose, incidentIdForUpload }) => {
        const [selectedPet, setSelectedPet] = useState(null);
        const [incidentDate, setIncidentDate] = useState(new Date());
        const [incidentType, setIncidentType] = useState('');
        const [description, setDescription] = useState('');
        const [resolution, setResolution] = useState('');
        const [severity, setSeverity] = useState(3);
        const [involvedStaff, setInvolvedStaff] = useState([]);
        const [involvedPets, setInvolvedPets] = useState([]);
        const [media, setMedia] = useState([]);
        const [isSubmitting, setIsSubmitting] = useState(false);
        const { user } = useUser();
    
        useEffect(() => {
            if (incident) {
                setSelectedPet(incident.pet_id);
                setIncidentDate(incident.incident_date ? parseISO(incident.incident_date) : new Date());
                setIncidentType(incident.incident_type || '');
                setDescription(incident.description || '');
                setResolution(incident.resolution || '');
                setSeverity(incident.severity || 3);
                setInvolvedStaff(incident.incident_involved_staff?.map(s => s.user_id) || []);
                setInvolvedPets(incident.incident_involved_pets?.map(p => p.pet_id) || []);
                setMedia(incident.incident_media || []);
            } else {
                setSelectedPet(null);
                setIncidentDate(new Date());
                setIncidentType('');
                setDescription('');
                setResolution('');
                setSeverity(3);
                setInvolvedStaff([]);
                setInvolvedPets([]);
                setMedia([]);
            }
        }, [incident]);
    
        const handleSave = async () => {
            if (!selectedPet || !incidentType || !description) {
                alert('Please fill in all required fields: Primary Pet, Incident Type, and Description.');
                return;
            }
            setIsSubmitting(true);
            const finalInvolvedPets = [...new Set([selectedPet, ...involvedPets])];
            
            await onSave({
                id: incident?.id || incidentIdForUpload,
                pet_id: selectedPet,
                location_id: locationId,
                incident_date: format(incidentDate, 'yyyy-MM-dd'),
                incident_type: incidentType,
                description,
                resolution,
                severity,
                reported_by: incident?.reported_by || user.id,
                involved_staff: involvedStaff,
                involved_pets: finalInvolvedPets,
                media: media.map(m => ({ media_url: m.media_url, media_type: m.media_type }))
            });
            setIsSubmitting(false);
        };
        
        const handleMediaUpload = (uploadedMedia) => {
            setMedia(prev => [...prev, { media_url: uploadedMedia.url, media_type: uploadedMedia.type }]);
        };
    
        const removeMedia = (url) => {
            setMedia(prev => prev.filter(m => m.media_url !== url));
        };
    
        return (
            <div className="space-y-6 max-h-[80vh] overflow-y-auto p-1 pr-4">
                <div>
                    <h3 className="text-lg font-medium flex items-center mb-4"><ShieldAlert className="mr-2" />Incident Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="pet">Primary Pet Involved</Label>
                            <Select value={selectedPet} onValueChange={(val) => { setSelectedPet(val); if (!involvedPets.includes(val)) setInvolvedPets(prev => [val, ...prev]); }}>
                                <SelectTrigger id="pet"><SelectValue placeholder="Select a pet" /></SelectTrigger>
                                <SelectContent>{petList.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Date of Incident</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />{format(incidentDate, "PPP")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={incidentDate} onSelect={setIncidentDate} /></PopoverContent>
                            </Popover>
                        </div>
                        <div>
                            <Label htmlFor="type">Type of Incident</Label>
                            <Input id="type" value={incidentType} onChange={(e) => setIncidentType(e.target.value)} placeholder="e.g., Bite, Altercation" />
                        </div>
                        <div>
                            <Label htmlFor="severity">Severity Level</Label>
                            <Select value={severity.toString()} onValueChange={(v) => setSeverity(Number(v))}>
                                <SelectTrigger id="severity"><SelectValue placeholder="Select severity" /></SelectTrigger>
                                <SelectContent>{severityLevels.map(l => <SelectItem key={l.value} value={l.value.toString()}><div className="flex items-center"><span className={`h-2 w-2 rounded-full mr-2 ${l.color}`} />{l.label}</div></SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened..." />
                        </div>
                        <div className="col-span-1 md:col-span-2">
                            <Label htmlFor="resolution">Resolution / Actions Taken</Label>
                            <Textarea id="resolution" value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="Describe the steps taken to resolve the incident..." />
                        </div>
                    </div>
                </div>
    
                <Separator />
                
                <div>
                     <h3 className="text-lg font-medium flex items-center mb-4"><Dog className="mr-2" />Involved Pets</h3>
                     <Select onValueChange={(value) => !involvedPets.includes(value) && setInvolvedPets([...involvedPets, value])}>
                        <SelectTrigger><SelectValue placeholder="Add other pets involved..." /></SelectTrigger>
                        <SelectContent>
                            {petList.filter(p => !involvedPets.includes(p.id)).map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {involvedPets.map(petId => {
                            const iPet = petList.find(p => p.id === petId);
                            return iPet ? <Badge key={petId} variant="secondary" className="flex items-center gap-2">{iPet.name}{petId !== selectedPet && <button onClick={() => setInvolvedPets(involvedPets.filter(id => id !== petId))}><X className="h-3 w-3" /></button>}</Badge> : null;
                        })}
                    </div>
                </div>
    
                <div>
                     <h3 className="text-lg font-medium flex items-center mb-4"><User className="mr-2" />Involved Staff</h3>
                     <Select onValueChange={(value) => !involvedStaff.includes(value) && setInvolvedStaff([...involvedStaff, value])}>
                        <SelectTrigger><SelectValue placeholder="Add staff member..." /></SelectTrigger>
                        <SelectContent>
                            {staffList.filter(s => !involvedStaff.includes(s.id)).map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {involvedStaff.map(staffId => {
                            const iStaff = staffList.find(s => s.id === staffId);
                            return iStaff ? <Badge key={staffId} variant="secondary" className="flex items-center gap-2">{iStaff.full_name}<button onClick={() => setInvolvedStaff(involvedStaff.filter(id => id !== staffId))}><X className="h-3 w-3" /></button></Badge> : null;
                        })}
                    </div>
                </div>
    
                <Separator />
                
                <div>
                    <h3 className="text-lg font-medium flex items-center mb-4"><Clipboard className="mr-2" />Media</h3>
                    <MediaUpload onUploadComplete={handleMediaUpload} bucketName="incident-media" parentId={incidentIdForUpload} />
                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {media.map((m, index) => (
                            <div key={index} className="relative group">
                                {m.media_type.startsWith('image/') ? (
                                    <img src={m.media_url} alt="Incident media" className="w-full h-24 object-cover rounded-md" />
                                ) : (
                                    <div className="w-full h-24 bg-black rounded-md flex items-center justify-center">
                                        <Video className="h-8 w-8 text-white" />
                                    </div>
                                )}
                                <div className="absolute top-0 right-0 p-1 bg-black/50 rounded-bl-md">
                                    <Button size="icon" variant="destructive" className="h-6 w-6 opacity-80 hover:opacity-100" onClick={() => removeMedia(m.media_url)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
    
                <DialogFooter className="pt-6">
                    <Button onClick={onClose} variant="outline">Cancel</Button>
                    <Button onClick={handleSave} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Incident'}
                    </Button>
                </DialogFooter>
            </div>
        );
    };
    
    
    const IncidentLog = () => {
        const { toast } = useToast();
        const [incidents, setIncidents] = useState([]);
        const [loading, setLoading] = useState(true);
        const [isDialogOpen, setIsDialogOpen] = useState(false);
        const [activeIncident, setActiveIncident] = useState(null);
        const { selectedLocation } = useLocation();
        const [allPets, setAllPets] = useState([]);
        const [staffList, setStaffList] = useState([]);
        const [newIncidentId, setNewIncidentId] = useState(null);
    
        const incidentIdForUpload = useMemo(() => activeIncident?.id || newIncidentId, [activeIncident, newIncidentId]);
    
        const fetchIncidents = useCallback(async () => {
            setLoading(true);
            if (!selectedLocation) {
                setLoading(false);
                return;
            }
    
            const { data, error } = await supabase
                .from('pet_incidents')
                .select(`
                    *,
                    incident_involved_staff(*, profiles(id, full_name)),
                    incident_involved_pets(*, pet:pets(id, name, avatar_url)),
                    reporter:reported_by(full_name),
                    incident_media(*),
                    pet:pet_id(id, name, avatar_url)
                `)
                .eq('location_id', selectedLocation.id)
                .order('incident_date', { ascending: false });
    
            if (error) {
                toast({ title: 'Error fetching incidents', description: error.message, variant: 'destructive' });
            } else {
                setIncidents(data || []);
            }
            setLoading(false);
        }, [selectedLocation, toast]);
    
        const fetchDropdownData = useCallback(async () => {
            if (!selectedLocation) return;
            const { data: allPetsData, error: allPetsError } = await supabase.from('pets').select('id, name, avatar_url, clients!inner(location_id)').eq('clients.location_id', selectedLocation.id);
            if (allPetsError) console.error("Error fetching all pets:", allPetsError);
            else setAllPets(allPetsData || []);
    
            const { data: staffData } = await supabase.from('profiles').select('id, full_name').eq('location_id', selectedLocation.id);
            setStaffList(staffData || []);
        }, [selectedLocation]);
    
        useEffect(() => {
            if(selectedLocation) {
                fetchIncidents();
                fetchDropdownData();
            }
        }, [selectedLocation, fetchIncidents, fetchDropdownData]);
    
        const handleSaveIncident = async (data) => {
            const { id, involved_staff, involved_pets, media, ...incidentData } = data;
            const isUpdating = !!activeIncident;
        
            if (isUpdating) { // Update existing incident
                const { error } = await supabase.from('pet_incidents').update(incidentData).eq('id', id);
                if (error) {
                    toast({ title: 'Error updating incident', description: error.message, variant: 'destructive' });
                    return;
                }
            } else { // Create new incident
                const { error } = await supabase.from('pet_incidents').insert({ id, ...incidentData }).select().single();
                if (error) {
                    toast({ title: 'Error creating incident', description: 'Make sure you selected a pet and filled all required fields.', variant: 'destructive' });
                    return;
                }
            }
        
            if (!id) return; // Should not happen if new incident creation was successful
        
            // Handle relations
            await supabase.from('incident_involved_staff').delete().eq('incident_id', id);
            if (involved_staff?.length > 0) {
                const { error } = await supabase.from('incident_involved_staff').insert(involved_staff.map(user_id => ({ incident_id: id, user_id })));
                if(error) toast({ title: 'Error saving staff', description: error.message, variant: 'destructive' });
            }
        
            await supabase.from('incident_involved_pets').delete().eq('incident_id', id);
            if (involved_pets?.length > 0) {
                const { error } = await supabase.from('incident_involved_pets').insert(involved_pets.map(pet_id => ({ incident_id: id, pet_id })));
                if(error) toast({ title: 'Error saving pets', description: error.message, variant: 'destructive' });
            }
    
            await supabase.from('incident_media').delete().eq('incident_id', id);
            if (media?.length > 0) {
                const mediaToInsert = media.map(m => ({ incident_id: id, media_url: m.media_url, media_type: m.media_type }));
                const { error } = await supabase.from('incident_media').insert(mediaToInsert);
                if(error) toast({ title: 'Error saving media', description: error.message, variant: 'destructive' });
            }
        
            toast({ title: 'Incident saved!' });
            handleCloseDialog();
            fetchIncidents();
        };
    
        const handleAddIncident = () => {
            setActiveIncident(null);
            setNewIncidentId(crypto.randomUUID());
            setIsDialogOpen(true);
        };
    
        const handleEditIncident = (incident) => {
            setActiveIncident(incident);
            setNewIncidentId(null);
            setIsDialogOpen(true);
        };
        
        const handleCloseDialog = () => {
            setIsDialogOpen(false);
            setActiveIncident(null);
            setNewIncidentId(null);
        };
    
        const handleDeleteIncident = async (id) => {
            if (!window.confirm('Are you sure you want to delete this incident?')) return;
            
            await supabase.from('incident_involved_staff').delete().eq('incident_id', id);
            await supabase.from('incident_involved_pets').delete().eq('incident_id', id);
            await supabase.from('incident_media').delete().eq('incident_id', id);
    
            const { error } = await supabase.from('pet_incidents').delete().eq('id', id);
            
            if (error) {
                toast({ title: 'Error deleting incident', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Incident deleted!' });
                fetchIncidents();
            }
        };
    
        if (loading) {
            return <div className="flex h-full items-center justify-center"><Loader2 className="h-16 w-16 animate-spin" /></div>;
        }
    
        return (
            <>
                <Helmet>
                    <title>Incident Log - PetSuite</title>
                    <meta name="description" content="Log and manage all pet incidents." />
                </Helmet>
                <motion.div
                    className="flex-1 space-y-4 p-8 pt-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-between space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Incident Log</h1>
                        <Button onClick={handleAddIncident}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Log New Incident
                        </Button>
                    </div>
    
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {incidents.length === 0 ? (
                            <p className="md:col-span-3 text-center text-muted-foreground">No incidents logged yet.</p>
                        ) : (
                            incidents.map(incident => {
                                const severity = severityLevels.find(s => s.value === incident.severity);
                                return (
                                    <Card key={incident.id} className="relative overflow-hidden group">
                                        <div className={`absolute inset-y-0 left-0 w-2 ${severity?.color || 'bg-gray-400'}`}></div>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pl-4">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    {incident.incident_type}
                                                    {incident.pet && (
                                                        <span className="text-sm font-normal text-muted-foreground">
                                                            for <Link to={`/pets/${incident.pet.id}`} className="hover:underline text-primary">{incident.pet.name}</Link>
                                                        </span>
                                                    )}
                                                </CardTitle>
                                                <p className="text-sm text-muted-foreground">{format(parseISO(incident.incident_date), 'PPP')}</p>
                                            </div>
                                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditIncident(incident)}><Edit className="h-4 w-4" /></Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteIncident(incident.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pl-4">
                                            <p className="text-sm">{incident.description}</p>
                                            {incident.resolution && <p className="mt-2 text-xs text-green-600"><strong>Resolved:</strong> {incident.resolution}</p>}
                                            {incident.incident_involved_pets && incident.incident_involved_pets.length > 0 && (
                                                <div className="mt-2 flex flex-wrap gap-1 text-xs">
                                                    <strong className="mr-1">Involved:</strong>
                                                    {incident.incident_involved_pets.map(invPet => (
                                                        invPet.pet ? <Badge key={invPet.pet.id} variant="secondary">
                                                            <Link to={`/pets/${invPet.pet.id}`} className="hover:underline">{invPet.pet.name}</Link>
                                                        </Badge> : null
                                                    ))}
                                                </div>
                                            )}
                                            {incident.incident_media?.length > 0 && (
                                                <div className="mt-2 flex gap-2">
                                                    {incident.incident_media.map((m, idx) => (
                                                        <a key={idx} href={m.media_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                                                            {m.media_type.startsWith('image/')
                                                                ? <ImageIcon className="h-5 w-5" />
                                                                : <Video className="h-5 w-5" />}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })
                        )}
                    </div>
    
                    <Dialog open={isDialogOpen} onOpenChange={(isOpen) => !isOpen && handleCloseDialog()}>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">{activeIncident ? 'Edit Incident' : 'Log New Incident'}</DialogTitle>
                                <DialogDescription>
                                    Document any incident to maintain a safe and transparent environment.
                                </DialogDescription>
                            </DialogHeader>
                            <IncidentForm
                                incident={activeIncident}
                                onSave={handleSaveIncident}
                                staffList={allPets}
                                petList={allPets} // Changed to allPets to be consistent with the pet selection
                                locationId={selectedLocation?.id}
                                onClose={handleCloseDialog}
                                incidentIdForUpload={incidentIdForUpload}
                            />
                        </DialogContent>
                    </Dialog>
                </motion.div>
            </>
        );
    };
    
    export default IncidentLog;
  