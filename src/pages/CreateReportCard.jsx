
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Loader2, PawPrint, Save, Smile, Meh, Frown, Utensils, Droplets, StickyNote, Users, Camera, Video, PlusCircle, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/contexts/UserContext';
import { Combobox } from '@/components/ui/combobox';
import { useLocation } from '@/contexts/LocationContext';
import MediaUpload from '@/components/MediaUpload';

const CreateReportCard = () => {
    const { petId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { profile } = useUser();
    const { selectedLocation } = useLocation();

    const [pet, setPet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [reportData, setReportData] = useState({
        overall_mood: '',
        eating_habits: '',
        potty_breaks: '',
        staff_notes: '',
    });
    const [playmates, setPlaymates] = useState([]);
    const [bestFriend, setBestFriend] = useState(null);
    const [media, setMedia] = useState([]);
    
    const [allPets, setAllPets] = useState([]);

    const reportCardIdForUpload = useMemo(() => `new-report-${Date.now()}`, []);

    const fetchPetData = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('pets')
            .select('*, clients(*)')
            .eq('id', petId)
            .single();

        if (error) {
            toast({ title: 'Error fetching pet data', description: error.message, variant: 'destructive' });
            navigate('/clients');
        } else {
            setPet(data);
        }
        setLoading(false);
    }, [petId, toast, navigate]);

    const fetchAllPetsInLocation = useCallback(async () => {
        if (!selectedLocation) return;
        const { data, error } = await supabase
            .from('pets')
            .select('id, name, clients(name)')
            .eq('clients.location_id', selectedLocation.id)
            .neq('id', petId); // Exclude the current pet

        if (error) {
            toast({ title: 'Error fetching pets', description: error.message, variant: 'destructive' });
        } else {
            setAllPets(data.map(p => ({
                value: p.id,
                label: `${p.name} (${p.clients.name})`
            })));
        }
    }, [selectedLocation, petId, toast]);

    useEffect(() => {
        fetchPetData();
        fetchAllPetsInLocation();
    }, [fetchPetData, fetchAllPetsInLocation]);

    const handleInputChange = (field, value) => {
        setReportData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddPlaymate = () => {
        setPlaymates([...playmates, { pet_id: '', notes: '' }]);
    };

    const handlePlaymateChange = (index, value) => {
        const newPlaymates = [...playmates];
        newPlaymates[index].pet_id = value;
        setPlaymates(newPlaymates);
    };

    const handleRemovePlaymate = (index) => {
        setPlaymates(playmates.filter((_, i) => i !== index));
    };

    const handleMediaUpload = (uploadedMedia) => {
        setMedia(prev => [...prev, { media_url: uploadedMedia.url, media_type: uploadedMedia.type }]);
    };
    
    const removeMedia = (url) => {
        setMedia(prev => prev.filter(m => m.media_url !== url));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        
        const { data: report, error: reportError } = await supabase
            .from('report_cards')
            .insert({
                pet_id: petId,
                created_by: profile.user_id,
                report_date: new Date().toISOString().split('T')[0],
                ...reportData
            })
            .select()
            .single();

        if (reportError) {
            toast({ title: 'Error saving report card', description: reportError.message, variant: 'destructive' });
            setIsSubmitting(false);
            return;
        }

        const reportId = report.id;

        const promises = [];
        if (bestFriend) {
            promises.push(supabase.from('report_card_playmates').insert({
                report_card_id: reportId,
                playmate_pet_id: bestFriend,
                relationship_type: 'Best Friend'
            }));
        }
        playmates.forEach(pm => {
            if (pm.pet_id) {
                promises.push(supabase.from('report_card_playmates').insert({
                    report_card_id: reportId,
                    playmate_pet_id: pm.pet_id,
                    relationship_type: 'Played With'
                }));
            }
        });

        if (media.length > 0) {
            promises.push(supabase.from('report_card_media').insert(
                media.map(m => ({
                    report_card_id: reportId,
                    media_url: m.media_url,
                    media_type: m.media_type,
                }))
            ));
        }

        const results = await Promise.all(promises);
        const errors = results.map(r => r.error).filter(Boolean);

        if (errors.length > 0) {
            toast({ title: 'Error saving some details', description: errors[0].message, variant: 'destructive' });
        }

        toast({ title: 'Report Card Saved!', description: `The report for ${pet.name} has been created.` });
        navigate(`/pets/${petId}`);
        setIsSubmitting(false);
    };

    if (loading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!pet) return null;

    return (
        <>
            <Helmet>
                <title>Create Report Card for {pet.name}</title>
                <meta name="description" content={`Create a new daily report card for ${pet.name}.`} />
            </Helmet>
            <motion.div className="flex-1 space-y-4 p-8 pt-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex items-center justify-between">
                    <Button asChild variant="outline" onClick={() => navigate(-1)}><span className="cursor-pointer"><ChevronLeft className="mr-2 h-4 w-4" />Back to Pet Profile</span></Button>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Report Card
                    </Button>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={pet.avatar_url} alt={pet.name} />
                            <AvatarFallback><PawPrint /></AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-2xl">New Report Card for {pet.name}</CardTitle>
                            <CardDescription>Owner: {pet.clients.name} &bull; Date: {new Date().toLocaleDateString()}</CardDescription>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Smile /> Overall Mood</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-4">
                                    <Button variant={reportData.overall_mood === 'Happy' ? 'default' : 'outline'} onClick={() => handleInputChange('overall_mood', 'Happy')}><Smile className="mr-2 h-4 w-4" /> Happy & Playful</Button>
                                    <Button variant={reportData.overall_mood === 'Calm' ? 'default' : 'outline'} onClick={() => handleInputChange('overall_mood', 'Calm')}><Meh className="mr-2 h-4 w-4" /> Calm & Relaxed</Button>
                                    <Button variant={reportData.overall_mood === 'Shy' ? 'default' : 'outline'} onClick={() => handleInputChange('overall_mood', 'Shy')}><Frown className="mr-2 h-4 w-4" /> A Bit Shy</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Users /> Play & Socialization</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label>Who was their best friend today?</Label>
                                    <Combobox options={allPets} value={bestFriend} onChange={setBestFriend} placeholder="Select a best friend..." searchPlaceholder="Search pets..." notFoundMessage="No pets found." />
                                </div>
                                <div>
                                    <Label>Who else did they play with?</Label>
                                    {playmates.map((pm, index) => (
                                        <div key={index} className="flex items-center gap-2 mt-2">
                                            <Combobox options={allPets.filter(p => p.value !== bestFriend && !playmates.some(pl => pl.pet_id === p.value))} value={pm.pet_id} onChange={(val) => handlePlaymateChange(index, val)} placeholder="Select a playmate..." searchPlaceholder="Search pets..." notFoundMessage="No pets found." />
                                            <Button variant="ghost" size="icon" onClick={() => handleRemovePlaymate(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" className="mt-2" onClick={handleAddPlaymate}><PlusCircle className="mr-2 h-4 w-4" /> Add Playmate</Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Camera /> Media</CardTitle></CardHeader>
                            <CardContent>
                                <MediaUpload onUploadComplete={handleMediaUpload} bucketName="report-card-media" parentId={reportCardIdForUpload} />
                                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {media.map((m, index) => (
                                        <div key={index} className="relative group">
                                            {m.media_type.startsWith('image/') ? (
                                                <img src={m.media_url} alt="Report card media" className="w-full h-24 object-cover rounded-md" />
                                            ) : (
                                                <div className="w-full h-24 bg-black rounded-md flex items-center justify-center">
                                                    <Video className="h-8 w-8 text-white" />
                                                </div>
                                            )}
                                            <div className="absolute top-0 right-0 p-1">
                                                <Button size="icon" variant="destructive" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeMedia(m.media_url)}>
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Utensils /> Eating Habits</CardTitle></CardHeader>
                            <CardContent>
                                <Textarea placeholder="e.g., Ate all their lunch, was a bit picky..." value={reportData.eating_habits} onChange={(e) => handleInputChange('eating_habits', e.target.value)} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><Droplets /> Potty Breaks</CardTitle></CardHeader>
                            <CardContent>
                                <Textarea placeholder="e.g., Normal potty breaks, no issues." value={reportData.potty_breaks} onChange={(e) => handleInputChange('potty_breaks', e.target.value)} />
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><StickyNote /> Staff Notes</CardTitle></CardHeader>
                            <CardContent>
                                <Textarea placeholder="Any other notes for the owner..." value={reportData.staff_notes} onChange={(e) => handleInputChange('staff_notes', e.target.value)} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default CreateReportCard;
  