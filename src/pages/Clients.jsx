import React, { useState, useEffect, useCallback } from 'react';
    import { Helmet } from 'react-helmet';
    import { motion } from 'framer-motion';
    import { PlusCircle, Loader2, User, Trash2, Dog, Cat } from 'lucide-react';
    import { useNavigate } from 'react-router-dom';
    import { Button } from '@/components/ui/button';
    import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
    import { Input } from '@/components/ui/input';
    import { Label } from '@/components/ui/label';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useLocation } from '@/contexts/LocationContext';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import { useUser } from '@/contexts/UserContext';
    import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
    import { Badge } from "@/components/ui/badge";
    import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
    import { getContrastYIQ } from '@/lib/utils';
    import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import MapAddressPicker from '@/components/MapAddressPicker';

    const emptyClient = { name: '', email: '', phone: '', address: '' };

    const Clients = () => {
      const { toast } = useToast();
      const navigate = useNavigate();
      const { selectedLocation } = useLocation();
      const { inviteUserByEmail } = useAuth();
      const { profile } = useUser();
      const [clients, setClients] = useState([]);
      const [roles, setRoles] = useState([]);
      const [loading, setLoading] = useState(true);
      const [isSubmitting, setIsSubmitting] = useState(false);
      
      const [isClientModalOpen, setIsClientModalOpen] = useState(false);
      const [currentClient, setCurrentClient] = useState(emptyClient);

      const fetchData = useCallback(async () => {
        if (!selectedLocation) {
            setLoading(false);
            setClients([]);
            return;
        }
        setLoading(true);

        const clientsPromise = supabase
          .from('clients')
          .select('*, pets(id, name, species, avatar_url), client_tag_assignments(client_tags(*))')
          .eq('location_id', selectedLocation.id)
          .order('name');
        
        const rolesPromise = supabase.from('roles').select('id, name');
          
        const [{ data: clientsData, error: clientsError }, { data: rolesData, error: rolesError }] = await Promise.all([clientsPromise, rolesPromise]);

        if (clientsError) {
          toast({ title: 'Error fetching clients', description: clientsError.message, variant: 'destructive' });
        } else {
          setClients(clientsData);
        }
        
        if (rolesError) {
            toast({ title: 'Error fetching roles', description: rolesError.message, variant: 'destructive' });
        } else {
            setRoles(rolesData);
        }

        setLoading(false);
      }, [selectedLocation, toast]);

      useEffect(() => {
        fetchData();
      }, [fetchData]);
      
      const handleSelectClient = (client) => {
        navigate(`/clients/${client.id}`);
      };

      const handlePetClick = (e, petId) => {
        e.stopPropagation();
        navigate(`/pets/${petId}`);
      }
      
      const openClientModal = () => {
        setCurrentClient(emptyClient);
        setIsClientModalOpen(true);
      };

      const handleClientSubmit = async () => {
        if (!selectedLocation) return;
        if (!currentClient.name || !currentClient.email) {
            toast({ title: 'Missing Information', description: 'Please provide a name and email for the client.', variant: 'destructive' });
            return;
        }
        setIsSubmitting(true);

        const clientRole = roles.find(r => r.name === 'Client');
        if (!clientRole) {
            toast({ title: 'Configuration Error', description: 'Client role not found. Please contact support.', variant: 'destructive' });
            setIsSubmitting(false);
            return;
        }

        const { error: inviteError } = await inviteUserByEmail(
          currentClient.email,
          {
            data: {
              full_name: currentClient.name,
              role_id: clientRole.id,
              location_id: selectedLocation.id,
            }
          }
        );

        if (inviteError && inviteError.message.includes('registered')) {
            toast({ title: 'Existing User', description: 'A user with this email already exists. You can link them to a new client profile from the User Management page.', variant: 'destructive' });
            setIsSubmitting(false);
            return;
        } else if (inviteError) {
            setIsSubmitting(false);
            return;
        }

        const clientPayload = { 
            ...currentClient, 
            location_id: selectedLocation.id 
        };
        
        const { data: newClient, error: clientError } = await supabase.from('clients').insert(clientPayload).select().single();

        if (clientError) {
          toast({ title: `Error adding client`, description: clientError.message, variant: 'destructive' });
        } else {
          toast({ title: `Client Added!`, description: `${newClient.name} has been successfully saved and an invitation email has been sent.` });
          setIsClientModalOpen(false);
          fetchData();
          navigate(`/clients/${newClient.id}`);
        }
        setIsSubmitting(false);
      };

      const handleDeleteClient = async (client) => {
        await supabase.from('client_tag_assignments').delete().eq('client_id', client.id);
        await supabase.from('pets').delete().eq('client_id', client.id);

        const { error: clientError } = await supabase.from('clients').delete().eq('id', client.id);

        if (clientError) {
            toast({ title: 'Error deleting client', description: clientError.message, variant: 'destructive' });
        } else {
            toast({ title: 'Client Deleted', description: `${client.name} has been removed.` });
            fetchData();
        }
      };

      const isAdmin = profile?.roles?.name === 'Admin';
      
      const getInitials = (name) => {
        if (!name) return '?';
        const names = name.split(' ');
        if (names.length > 1) {
          return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
      };

      return (
        <>
          <Helmet>
            <title>Clients - PetSuite</title>
            <meta name="description" content="Manage all your clients." />
          </Helmet>
          <motion.div className="flex-1 space-y-4 p-8 pt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                <Button onClick={openClientModal}><PlusCircle className="mr-2 h-4 w-4" /> Add Client</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Client List</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? <div className="flex justify-center items-center h-64"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Address</TableHead>
                                    <TableHead>Pets</TableHead>
                                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {clients.length > 0 ? clients.map(client => (
                                    <TableRow key={client.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleSelectClient(client)}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground"/>{client.name}</div>
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {client.client_tag_assignments.map(({ client_tags }) => (
                                                    client_tags && <Badge key={client_tags.id} style={{ backgroundColor: client_tags.color, color: getContrastYIQ(client_tags.color) }} className="text-xs">{client_tags.name}</Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {client.email}
                                            {client.phone && <><br/><span className="text-sm text-muted-foreground">{client.phone}</span></>}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">{client.address}</span>
                                        </TableCell>
                                        <TableCell>
                                          <TooltipProvider>
                                            <div className="flex items-center flex-wrap gap-4">
                                            {client.pets.map(pet => (
                                              <Tooltip key={pet.id}>
                                                <TooltipTrigger asChild>
                                                  <div onClick={(e) => handlePetClick(e, pet.id)} className="cursor-pointer relative">
                                                    <Avatar className="h-12 w-12 border-2 border-transparent hover:border-primary transition-all">
                                                      <AvatarImage src={pet.avatar_url} alt={pet.name} />
                                                      <AvatarFallback>
                                                        {pet.name ? pet.name.charAt(0).toUpperCase() : '?'}
                                                      </AvatarFallback>
                                                    </Avatar>
                                                    <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                                                        {pet.species === 'Dog' ? <Dog className="h-4 w-4 text-muted-foreground"/> : <Cat className="h-4 w-4 text-muted-foreground"/>}
                                                    </div>
                                                  </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  <p>{pet.name}</p>
                                                </TooltipContent>
                                              </Tooltip>
                                            ))}
                                            </div>
                                          </TooltipProvider>
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                This action cannot be undone. This will permanently delete the client <span className="font-semibold">{client.name}</span> and all associated data, including their pets and tags.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDeleteClient(client); }}>Delete Client</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                )) : (
                                    <TableRow><TableCell colSpan={isAdmin ? 5 : 4} className="h-24 text-center">No clients found for this location.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isClientModalOpen} onOpenChange={setIsClientModalOpen}>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>Add New Client</DialogTitle>
                        <DialogDescription>
                          Create a new client profile. An invitation will be sent to their email to set up their account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={currentClient.name} onChange={(e) => setCurrentClient({...currentClient, name: e.target.value})} /></div>
                        <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={currentClient.email} onChange={(e) => setCurrentClient({...currentClient, email: e.target.value})} /></div>
                        <div className="grid gap-2"><Label htmlFor="phone">Phone (Optional)</Label><Input id="phone" value={currentClient.phone} onChange={(e) => setCurrentClient({...currentClient, phone: e.target.value})} /></div>
                         <div className="grid gap-2"><Label htmlFor="address">Address (Optional)</Label><MapAddressPicker value={currentClient.address} onChange={(val) => setCurrentClient({...currentClient, address: val})} /></div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
                        <Button onClick={handleClientSubmit} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Client & Send Invite
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </motion.div>
        </>
      );
    };

    export default Clients;