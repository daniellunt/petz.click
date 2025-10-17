import React, { useState, useEffect, useCallback, useMemo } from 'react';
    import { Helmet } from 'react-helmet';
    import { useParams, Link, useNavigate } from 'react-router-dom';
    import { motion } from 'framer-motion';
    import { ChevronLeft, User, PawPrint, Edit, Trash2, PlusCircle, Loader2, Dog, Cat, FileText, Receipt, BookOpen, History, Tag, X, MapPin } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
    import { Badge } from "@/components/ui/badge";
    import { Combobox } from "@/components/ui/combobox";
    import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
    import { useLocation } from '@/contexts/LocationContext';
    import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
    import { HexColorPicker } from "react-colorful";
    import { getContrastYIQ } from '@/lib/utils';
    import { useUser } from '@/contexts/UserContext';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Separator } from '@/components/ui/separator';
    import MapAddressPicker from '@/components/MapAddressPicker';

    const emptyPet = { name: '', species: 'Dog', breed: '', birth_date: '', notes: '' };

    const PetModalContent = ({ currentPet, setCurrentPet, handlePetSubmit, modalMode }) => {
      const [breeds, setBreeds] = useState([]);
      const [breedLoading, setBreedLoading] = useState(false);

      useEffect(() => {
        const fetchBreeds = async () => {
          if (!currentPet.species) return;
          setBreedLoading(true);
          setBreeds([]);
          try {
            let url = '';
            if (currentPet.species === 'Dog') {
              url = 'https://dog.ceo/api/breeds/list/all';
              const response = await fetch(url);
              const data = await response.json();
              const breedList = Object.keys(data.message).map(breed => ({ value: breed, label: breed.charAt(0).toUpperCase() + breed.slice(1) }));
              setBreeds(breedList);
            } else if (currentPet.species === 'Cat') {
              url = 'https://api.thecatapi.com/v1/breeds';
              const response = await fetch(url);
              const data = await response.json();
              const breedList = data.map(breed => ({ value: breed.name, label: breed.name }));
              setBreeds(breedList);
            }
          } catch (error) {
            console.error("Failed to fetch breeds:", error);
          } finally {
            setBreedLoading(false);
          }
        };
        fetchBreeds();
      }, [currentPet.species]);

      return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{modalMode === 'add' ? 'Add New Pet' : 'Edit Pet'}</DialogTitle>
                <DialogDescription>Fill in the details for the pet.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label htmlFor="pet-name">Name</Label><Input id="pet-name" value={currentPet.name} onChange={(e) => setCurrentPet({...currentPet, name: e.target.value})} /></div>
                <div className="grid gap-2">
                    <Label>Species</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant={currentPet.species === 'Dog' ? 'default' : 'outline'} onClick={() => setCurrentPet({ ...currentPet, species: 'Dog', breed: '' })}><Dog className="mr-2 h-4 w-4" /> Dog</Button>
                        <Button variant={currentPet.species === 'Cat' ? 'default' : 'outline'} onClick={() => setCurrentPet({ ...currentPet, species: 'Cat', breed: '' })}><Cat className="mr-2 h-4 w-4" /> Cat</Button>
                    </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pet-breed">Breed</Label>
                  {breedLoading ? <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/><span>Loading breeds...</span></div> :
                    <Combobox options={breeds} value={currentPet.breed} onChange={(value) => setCurrentPet({ ...currentPet, breed: value })} placeholder="Select a breed..." searchPlaceholder="Search breeds..." notFoundMessage="No breed found." />
                  }
                </div>
                <div className="grid gap-2"><Label htmlFor="pet-birthdate">Birth Date</Label><Input id="pet-birthdate" type="date" value={currentPet.birth_date || ''} onChange={(e) => setCurrentPet({...currentPet, birth_date: e.target.value})} /></div>
                <div className="grid gap-2"><Label htmlFor="pet-notes">Notes</Label><Input id="pet-notes" value={currentPet.notes} onChange={(e) => setCurrentPet({...currentPet, notes: e.target.value})} /></div>
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                <Button onClick={handlePetSubmit}>{modalMode === 'add' ? 'Add Pet' : 'Save Changes'}</Button>
            </DialogFooter>
        </DialogContent>
      );
    };

    const PlaceholderContent = ({ title, icon }) => (
        <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                {icon}
                <h3 className="text-xl font-semibold mt-4">{title}</h3>
                <p className="text-muted-foreground mt-2">This feature is coming soon!</p>
            </CardContent>
        </Card>
    );

    const ClientTagsManager = ({ client, allTags, setAllTags, clientTags, setClientTags }) => {
        const { toast } = useToast();
        const { profile } = useUser();
        const { selectedLocation } = useLocation();
        const [newTagName, setNewTagName] = useState('');
        const [newTagColor, setNewTagColor] = useState('#aabbcc');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [tagToDelete, setTagToDelete] = useState(null);
        const isAdmin = profile?.roles?.name === 'Admin';

        const availableTags = useMemo(() => {
            const clientTagIds = new Set(clientTags.map(t => t.id));
            return allTags.filter(t => !clientTagIds.has(t.id));
        }, [allTags, clientTags]);

        const handleCreateTag = async () => {
            if (!newTagName.trim() || !selectedLocation) return;
            setIsSubmitting(true);
            const { data, error } = await supabase
                .from('client_tags')
                .insert({ name: newTagName, color: newTagColor, location_id: selectedLocation.id })
                .select('*, client_tag_assignments(count)')
                .single();
            if (error) {
                toast({ title: "Error creating tag", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "Tag Created", description: `Tag "${data.name}" has been created.` });
                setAllTags(prev => [...prev, data]);
                setNewTagName('');
            }
            setIsSubmitting(false);
        };

        const handleAssignTag = async (tag) => {
            const { error } = await supabase.from('client_tag_assignments').insert({ client_id: client.id, tag_id: tag.id });
            if (error) {
                toast({ title: "Error assigning tag", description: error.message, variant: "destructive" });
            } else {
                setClientTags(prev => [...prev, tag]);
            }
        };
        
        const handleUnassignTag = async (tag) => {
            const { error } = await supabase.from('client_tag_assignments').delete().match({ client_id: client.id, tag_id: tag.id });
            if (error) {
                toast({ title: "Error unassigning tag", description: error.message, variant: "destructive" });
            } else {
                setClientTags(prev => prev.filter(t => t.id !== tag.id));
            }
        };

        const handleDeleteTag = async (tagId) => {
            const { error } = await supabase.from('client_tags').delete().eq('id', tagId);
            if (error) {
                toast({ title: "Error deleting tag", description: error.message, variant: "destructive" });
            } else {
                toast({ title: "Tag Deleted" });
                setAllTags(prev => prev.filter(t => t.id !== tagId));
                setClientTags(prev => prev.filter(t => t.id !== tagId));
                setTagToDelete(null);
            }
        };

        return (
            <>
                <div className="grid gap-6 md:grid-cols-2 mt-6">
                    <Card>
                        <CardHeader><CardTitle>Manage Client Tags</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <h4 className="font-medium">Create New Tag</h4>
                                <div className="flex gap-2 items-center">
                                    <Input placeholder="Tag name" value={newTagName} onChange={e => setNewTagName(e.target.value)} />
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="icon" style={{ backgroundColor: newTagColor, width: '36px', height: '36px' }} />
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <HexColorPicker color={newTagColor} onChange={setNewTagColor} />
                                        </PopoverContent>
                                    </Popover>
                                    <Button onClick={handleCreateTag} disabled={isSubmitting || !newTagName.trim()}>
                                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">Assigned to {client.name}</h4>
                                <div className="flex flex-wrap gap-2">
                                    {clientTags.map(tag => (
                                        <Badge key={tag.id} style={{ backgroundColor: tag.color, color: getContrastYIQ(tag.color) }} className="flex items-center gap-1.5">
                                            {tag.name}
                                            <button onClick={() => handleUnassignTag(tag)} className="rounded-full hover:bg-black/20 p-0.5" style={{ color: getContrastYIQ(tag.color) }}>
                                                <X className="h-3 w-3"/>
                                            </button>
                                        </Badge>
                                    ))}
                                    {clientTags.length === 0 && <p className="text-sm text-muted-foreground">No tags assigned.</p>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Available Tags</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map(tag => (
                                    <div key={tag.id} className="flex items-center">
                                        <Badge variant="secondary" onClick={() => handleAssignTag(tag)} className="cursor-pointer hover:bg-primary/20" style={{ border: `1px solid ${tag.color}`, color: 'inherit' }}>
                                            {tag.name}
                                        </Badge>
                                        {isAdmin && (
                                        <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={() => setTagToDelete(tag)}>
                                            <Trash2 className="h-3 w-3 text-destructive"/>
                                        </Button>
                                        )}
                                    </div>
                                ))}
                                {availableTags.length === 0 && <p className="text-sm text-muted-foreground">No more tags to assign.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                {tagToDelete && (
                    <AlertDialog open={!!tagToDelete} onOpenChange={() => setTagToDelete(null)}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Tag "{tagToDelete.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the tag and unassign it from all clients.
                                    <br/>
                                    <br/>
                                    This tag is currently assigned to <span className="font-bold">{tagToDelete.client_tag_assignments[0]?.count || 0}</span> client(s).
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteTag(tagToDelete.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </>
        );
    };

    const ClientProfile = () => {
        const { clientId } = useParams();
        const navigate = useNavigate();
        const { toast } = useToast();
        const [client, setClient] = useState(null);
        const [loading, setLoading] = useState(true);
        const { selectedLocation } = useLocation();

        const [allClientTags, setAllClientTags] = useState([]);
        const [clientTags, setClientTags] = useState([]);
        
        const [isPetModalOpen, setIsPetModalOpen] = useState(false);
        const [currentPet, setCurrentPet] = useState(emptyPet);
        const [petModalMode, setPetModalMode] = useState('add');

        const [isEditingDetails, setIsEditingDetails] = useState(false);
        const [editableClient, setEditableClient] = useState(null);
        const [isSubmittingDetails, setIsSubmittingDetails] = useState(false);

        const fetchData = useCallback(async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('clients')
                .select('*, pets(*, pet_tag_assignments(pet_tags(*))), client_tag_assignments(client_tags(*))')
                .eq('id', clientId)
                .single();
                
            if (error) {
                toast({ title: 'Error fetching client data', description: error.message, variant: 'destructive' });
            } else {
                setClient(data);
                setEditableClient(data);
                setClientTags(data.client_tag_assignments.map(item => item.client_tags).filter(Boolean));
            }

            if (selectedLocation) {
                const { data: tagsData, error: tagsError } = await supabase
                    .from('client_tags')
                    .select('*, client_tag_assignments!left(client_id)')
                    .eq('location_id', selectedLocation.id);
                    
                if (tagsError) toast({ title: 'Error fetching tags', description: tagsError.message, variant: "destructive" });
                else {
                    const tagCounts = tagsData.reduce((acc, tag) => {
                        acc[tag.id] = tag.client_tag_assignments.length;
                        return acc;
                    }, {});

                    const finalTags = tagsData.map(tag => ({
                        ...tag,
                        client_tag_assignments: [{ count: tagCounts[tag.id] || 0 }]
                    }));
                    setAllClientTags(finalTags);
                }
            }

            setLoading(false);
        }, [clientId, toast, selectedLocation]);

        useEffect(() => {
            fetchData();
        }, [fetchData]);

        const openPetModal = (mode, pet = null) => {
            setPetModalMode(mode);
            setCurrentPet(pet ? { ...pet, birth_date: pet.birth_date || '' } : { ...emptyPet });
            setIsPetModalOpen(true);
        };

        const handlePetSubmit = async () => {
            const petPayload = { ...currentPet, client_id: clientId, birth_date: currentPet.birth_date || null };
            delete petPayload.pet_tag_assignments;
            
            let result;
            if (petModalMode === 'add') {
                result = await supabase.from('pets').insert(petPayload).select();
            } else {
                result = await supabase.from('pets').update(petPayload).eq('id', currentPet.id).select();
            }
            
            const { data, error } = result;
            if (error) {
                toast({ title: `Error ${petModalMode === 'add' ? 'adding' : 'updating'} pet`, description: error.message, variant: 'destructive' });
            } else {
                toast({ title: `Pet ${petModalMode === 'add' ? 'Added' : 'Updated'}!`, description: `${data[0].name} has been successfully saved.` });
                setIsPetModalOpen(false);
                fetchData();
            }
        };

        const handleDeletePet = async (petId) => {
            const { error } = await supabase.from('pets').delete().eq('id', petId);
            if (error) {
                toast({ title: 'Error deleting pet', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Pet Deleted', description: 'The pet has been removed.' });
                fetchData();
            }
        };
        
        const handlePetClick = (petId) => {
            navigate(`/pets/${petId}`);
        };

        const handleUpdateDetails = async () => {
            setIsSubmittingDetails(true);
            const { name, email, phone, address } = editableClient;
            const { error } = await supabase.from('clients').update({ name, email, phone, address }).eq('id', clientId);
            if (error) {
                toast({ title: 'Error updating details', description: error.message, variant: 'destructive' });
            } else {
                toast({ title: 'Details Updated!', description: "Client information has been saved." });
                setIsEditingDetails(false);
                fetchData();
            }
            setIsSubmittingDetails(false);
        };

        if (loading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
        if (!client) return <div className="text-center p-8">Client not found.</div>;

        return (
            <>
                <Helmet>
                    <title>{client.name}'s Profile - PetSuite</title>
                    <meta name="description" content={`Profile for client ${client.name}.`} />
                </Helmet>
                <motion.div className="flex-1 space-y-4 p-8 pt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="flex items-center justify-between">
                        <Button asChild variant="outline"><Link to="/clients"><ChevronLeft className="mr-2 h-4 w-4" />Back to Clients</Link></Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-3"><User className="h-8 w-8" /> {client.name}</CardTitle>
                            <CardDescription>{client.email} &bull; {client.phone}</CardDescription>
                             <div className="flex flex-wrap gap-2 mt-2">
                                {clientTags.map(tag => (
                                    tag && <Badge key={tag.id} style={{ backgroundColor: tag.color, color: getContrastYIQ(tag.color) }}>{tag.name}</Badge>
                                ))}
                            </div>
                        </CardHeader>
                    </Card>

                    <Tabs defaultValue="details" className="w-full">
                        <TabsList className="grid w-full grid-cols-6">
                            <TabsTrigger value="details">Details & Tags</TabsTrigger>
                            <TabsTrigger value="pets">Pets</TabsTrigger>
                            <TabsTrigger value="bookings">Bookings</TabsTrigger>
                            <TabsTrigger value="invoices">Invoices</TabsTrigger>
                            <TabsTrigger value="notes">Notes</TabsTrigger>
                            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
                        </TabsList>
                        <TabsContent value="details">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Client Details</CardTitle>
                                    {!isEditingDetails && (
                                        <Button variant="outline" onClick={() => setIsEditingDetails(true)}>
                                            <Edit className="mr-2 h-4 w-4" /> Edit Details
                                        </Button>
                                    )}
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {isEditingDetails ? (
                                        <div className="space-y-4">
                                            <div className="grid gap-2"><Label htmlFor="edit-name">Name</Label><Input id="edit-name" value={editableClient.name} onChange={(e) => setEditableClient({...editableClient, name: e.target.value})} /></div>
                                            <div className="grid gap-2"><Label htmlFor="edit-email">Email</Label><Input id="edit-email" type="email" value={editableClient.email} onChange={(e) => setEditableClient({...editableClient, email: e.target.value})} /></div>
                                            <div className="grid gap-2"><Label htmlFor="edit-phone">Phone</Label><Input id="edit-phone" value={editableClient.phone} onChange={(e) => setEditableClient({...editableClient, phone: e.target.value})} /></div>
                                            <div className="grid gap-2"><Label htmlFor="edit-address">Address</Label><MapAddressPicker value={editableClient.address} onChange={(val) => setEditableClient({...editableClient, address: val})} /></div>
                                            <div className="flex gap-2">
                                                <Button onClick={handleUpdateDetails} disabled={isSubmittingDetails}>{isSubmittingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : 'Save Changes'}</Button>
                                                <Button variant="outline" onClick={() => { setIsEditingDetails(false); setEditableClient(client); }}>Cancel</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 text-sm">
                                            <p><strong>Name:</strong> {client.name}</p>
                                            <p><strong>Email:</strong> {client.email}</p>
                                            <p><strong>Phone:</strong> {client.phone || 'N/A'}</p>
                                            <p><strong>Address:</strong> {client.address || 'N/A'}</p>
                                            <p><strong>Client Since:</strong> {new Date(client.created_at).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                    <Separator className="my-6" />
                                    <ClientTagsManager client={client} allTags={allClientTags} setAllTags={setAllClientTags} clientTags={clientTags} setClientTags={setClientTags} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="pets">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2"><PawPrint /> Pets</CardTitle>
                                    <Button size="sm" onClick={() => openPetModal('add')}><PlusCircle className="mr-2 h-4 w-4" /> Add Pet</Button>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {client.pets.length > 0 ? client.pets.map(pet => (
                                            <div key={pet.id} className="flex items-center justify-between p-3 rounded-md border hover:bg-muted/50 transition-colors">
                                                <div onClick={() => handlePetClick(pet.id)} className="flex-grow cursor-pointer flex items-center gap-4">
                                                    <Avatar className="h-16 w-16 border-2 border-transparent">
                                                        <AvatarImage src={pet.avatar_url} alt={pet.name} />
                                                        <AvatarFallback>
                                                          {pet.name ? pet.name.charAt(0).toUpperCase() : (pet.species === 'Dog' ? <Dog className="h-8 w-8"/> : <Cat className="h-8 w-8"/>)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-semibold">{pet.name} <Badge variant="outline">{pet.species}</Badge></p>
                                                        <p className="text-sm text-muted-foreground">{pet.breed}</p>
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {pet.pet_tag_assignments.map(({ pet_tags }) => (
                                                                pet_tags && <Badge key={pet_tags.id} style={{ backgroundColor: pet_tags.color, color: getContrastYIQ(pet_tags.color) }} className="text-xs">{pet_tags.name}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => openPetModal('edit', pet)}><Edit className="h-4 w-4"/></Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive"/></Button></AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {pet.name}.</AlertDialogDescription></AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeletePet(pet.id)}>Delete Pet</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        )) : (
                                            <p className="text-center text-muted-foreground py-4">No pets found for this client.</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="bookings"><PlaceholderContent title="Bookings" icon={<BookOpen className="h-12 w-12 text-muted-foreground" />} /></TabsContent>
                        <TabsContent value="invoices"><PlaceholderContent title="Invoices" icon={<Receipt className="h-12 w-12 text-muted-foreground" />} /></TabsContent>
                        <TabsContent value="notes"><PlaceholderContent title="Notes" icon={<FileText className="h-12 w-12 text-muted-foreground" />} /></TabsContent>
                        <TabsContent value="audit"><PlaceholderContent title="Audit Trail" icon={<History className="h-12 w-12 text-muted-foreground" />} /></TabsContent>
                    </Tabs>

                    <Dialog open={isPetModalOpen} onOpenChange={setIsPetModalOpen}>
                        <PetModalContent currentPet={currentPet} setCurrentPet={setCurrentPet} handlePetSubmit={handlePetSubmit} modalMode={petModalMode} />
                    </Dialog>
                </motion.div>
            </>
        );
    };

    export default ClientProfile;