
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, PawPrint, Edit, Loader2, Camera, Heart, Utensils, Shield, AlertTriangle, Users, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const PlaceholderContent = ({ title, icon }) => (
    <Card>
        <CardContent className="flex flex-col items-center justify-center h-64 text-center">
            {icon}
            <h3 className="text-xl font-semibold mt-4">{title}</h3>
            <p className="text-muted-foreground mt-2">This feature is coming soon!</p>
        </CardContent>
    </Card>
);

const PetProfile = () => {
    const { petId } = useParams();
    const { toast } = useToast();
    const [pet, setPet] = useState(null);
    const [client, setClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const fileInputRef = React.useRef(null);
    const [uploading, setUploading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        const { data: petData, error: petError } = await supabase
            .from('pets')
            .select('*, clients(*)')
            .eq('id', petId)
            .single();

        if (petError) {
            toast({ title: 'Error fetching pet data', description: petError.message, variant: 'destructive' });
        } else {
            setPet(petData);
            setClient(petData.clients);
        }
        setLoading(false);
    }, [petId, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAvatarClick = () => {
        fileInputRef.current.click();
    };

    const handleAvatarUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${petId}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage.from('pet-avatars').upload(filePath, file);

        if (uploadError) {
            toast({ title: "Upload Error", description: uploadError.message, variant: "destructive" });
            setUploading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage.from('pet-avatars').getPublicUrl(filePath);

        const { error: updateError } = await supabase
            .from('pets')
            .update({ avatar_url: publicUrl })
            .eq('id', petId);

        if (updateError) {
            toast({ title: "Update Error", description: updateError.message, variant: "destructive" });
        } else {
            toast({ title: "Avatar Updated!", description: "The new avatar has been saved." });
            fetchData();
        }
        setUploading(false);
    };


    if (loading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!pet) return <div className="text-center p-8">Pet not found.</div>;

    return (
        <>
            <Helmet>
                <title>{pet.name}'s Profile - PetSuite</title>
                <meta name="description" content={`Profile for pet ${pet.name}.`} />
            </Helmet>
            <motion.div className="flex-1 space-y-4 p-8 pt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex items-center justify-between">
                   {client && <Button asChild variant="outline"><Link to={`/clients/${client.id}`}><ChevronLeft className="mr-2 h-4 w-4" />Back to {client.name}'s Profile</Link></Button>}
                </div>

                <Card>
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                <AvatarImage src={pet.avatar_url} alt={pet.name} />
                                <AvatarFallback className="text-3xl"><PawPrint /></AvatarFallback>
                            </Avatar>
                            <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 rounded-full h-8 w-8" onClick={handleAvatarClick} disabled={uploading}>
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin"/> : <Camera className="h-4 w-4" />}
                                <span className="sr-only">Change Avatar</span>
                            </Button>
                            <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} accept="image/*" className="hidden" />
                        </div>
                        <div className="flex-grow">
                            <CardTitle className="text-3xl font-bold flex items-center gap-3">{pet.name}</CardTitle>
                            <CardDescription className="text-lg">{pet.breed} &bull; {pet.species}</CardDescription>
                            {client && <p className="text-sm text-muted-foreground">Owner: {client.name}</p>}
                        </div>
                    </CardHeader>
                </Card>

                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="medical">Medical</TabsTrigger>
                        <TabsTrigger value="dietary">Dietary</TabsTrigger>
                        <TabsTrigger value="incidents">Incidents</TabsTrigger>
                        <TabsTrigger value="relationships">Relationships</TabsTrigger>
                        <TabsTrigger value="tags">Tags</TabsTrigger>
                    </TabsList>
                    <TabsContent value="details">
                        <Card>
                            <CardHeader><CardTitle>Pet Details</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <p><strong>Name:</strong> {pet.name}</p>
                                <p><strong>Species:</strong> {pet.species}</p>
                                <p><strong>Breed:</strong> {pet.breed}</p>
                                <p><strong>Birth Date:</strong> {pet.birth_date ? new Date(pet.birth_date).toLocaleDateString() : 'N/A'}</p>
                                <p><strong>Notes:</strong> {pet.notes || 'No notes available.'}</p>
                                <Button variant="outline" disabled>
                                    <Edit className="mr-2 h-4 w-4" /> Edit Details (soon)
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="medical">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5"/>Allergies</CardTitle></CardHeader>
                                <CardContent><p className="text-muted-foreground">Feature coming soon.</p></CardContent>
                            </Card>
                             <Card>
                                <CardHeader><CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5"/>Vaccinations</CardTitle></CardHeader>
                                <CardContent><p className="text-muted-foreground">Feature coming soon.</p></CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                    <TabsContent value="dietary"><PlaceholderContent title="Dietary Preferences" icon={<Utensils className="h-12 w-12 text-muted-foreground" />} /></TabsContent>
                    <TabsContent value="incidents"><PlaceholderContent title="Incidents" icon={<AlertTriangle className="h-12 w-12 text-muted-foreground" />} /></TabsContent>
                    <TabsContent value="relationships"><PlaceholderContent title="Relationships" icon={<Users className="h-12 w-12 text-muted-foreground" />} /></TabsContent>
                    <TabsContent value="tags"><PlaceholderContent title="Tags" icon={<Tag className="h-12 w-12 text-muted-foreground" />} /></TabsContent>
                </Tabs>
            </motion.div>
        </>
    );
};

export default PetProfile;
