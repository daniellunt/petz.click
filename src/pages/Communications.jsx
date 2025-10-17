
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Mail, Loader2, Send, Paperclip, PlusCircle, Users, Archive, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useUser } from '@/contexts/UserContext';
import { useLocation as useAppLocation } from '@/contexts/LocationContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format, isToday, isYesterday } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

const getInitials = (name) => name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '';

const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    if (isToday(date)) return format(date, 'p');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
};

const ConversationList = ({ conversations, unreadCounts, onSelect, activeConversationId }) => {
    if (conversations.length === 0) {
        return <p className="text-muted-foreground text-center pt-10">No conversations yet.</p>;
    }
    return (
        <div className="space-y-1">
            {conversations.map(convo => {
                const unreadCount = unreadCounts.find(uc => uc.conversation_id === convo.id)?.unread_count || 0;
                return (
                    <div key={convo.id} onClick={() => onSelect(convo.id)}
                        className={cn(
                            "p-3 rounded-lg cursor-pointer transition-colors flex items-start gap-3",
                            convo.id === activeConversationId ? 'bg-primary/10' : 'hover:bg-muted/50'
                        )}>
                        <Avatar className="h-10 w-10 border">
                            <AvatarFallback>{getInitials(convo.client.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-baseline">
                                <p className="font-semibold truncate pr-2">{convo.client.name}</p>
                                <p className="text-xs text-muted-foreground whitespace-nowrap">{formatTimestamp(convo.last_message_at)}</p>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{convo.subject || 'No subject'}</p>
                            <div className="flex justify-end mt-1">
                                {unreadCount > 0 && <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs">{unreadCount}</Badge>}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const MessageBubble = ({ message, isCurrentUser }) => {
    return (
        <div className={cn("flex items-end gap-2", isCurrentUser ? 'justify-end' : 'justify-start')}>
            {!isCurrentUser && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={message.sender?.avatar_url} />
                    <AvatarFallback>{getInitials(message.sender?.full_name)}</AvatarFallback>
                </Avatar>
            )}
            <div className={cn(
                "max-w-xs lg:max-w-md p-3 rounded-2xl",
                isCurrentUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-muted rounded-bl-none'
            )}>
                <p className="text-sm">{message.content}</p>
                <p className={cn("text-xs mt-1 text-right", isCurrentUser ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
                    {format(new Date(message.created_at), 'p')}
                </p>
            </div>
        </div>
    );
};

const MessagingView = () => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { profile: currentUserProfile } = useUser();
    const { selectedLocation } = useAppLocation();

    const [conversations, setConversations] = useState([]);
    const [unreadCounts, setUnreadCounts] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);

    const isManagerOrAdmin = useMemo(() => ['Manager', 'Admin'].includes(currentUserProfile?.roles?.name), [currentUserProfile]);

    const activeConversation = useMemo(() => conversations.find(c => c.id === conversationId), [conversations, conversationId]);

    const fetchConversationsAndCounts = useCallback(async () => {
        if (!selectedLocation || !currentUserProfile) return;
        setLoadingConversations(true);

        const convosPromise = supabase
            .from('conversations')
            .select('*, client:clients(id, name)')
            .eq('location_id', selectedLocation.id)
            .eq('status', 'open')
            .order('last_message_at', { ascending: false });

        const countsPromise = supabase.rpc('get_unread_message_counts', {
            p_location_id: selectedLocation.id,
            p_user_id: currentUserProfile.user_id,
        });

        const [{ data: convosData, error: convosError }, { data: countsData, error: countsError }] = await Promise.all([convosPromise, countsPromise]);

        if (convosError) toast({ title: 'Error fetching conversations', description: convosError.message, variant: 'destructive' });
        else setConversations(convosData || []);
        
        if (countsError) toast({ title: 'Error fetching unread counts', description: countsError.message, variant: 'destructive' });
        else setUnreadCounts(countsData || []);

        setLoadingConversations(false);
    }, [selectedLocation, currentUserProfile, toast]);

    const fetchMessages = useCallback(async (convoId) => {
        if (!convoId) {
            setMessages([]);
            return;
        }
        setLoadingMessages(true);
        // Changed to use explicit foreign key relationship 'sender' which refers to profiles
        const { data, error } = await supabase
            .from('messages')
            .select('*, sender:profiles(user_id, full_name, avatar_url)')
            .eq('conversation_id', convoId)
            .order('created_at', { ascending: true });
        
        if (error) {
            toast({ title: 'Error fetching messages', description: error.message, variant: 'destructive' });
        } else {
            setMessages(data || []);
        }
        
        setLoadingMessages(false);
    }, [toast]);
    
    const markAsRead = useCallback(async (convoId) => {
        if (!convoId || !currentUserProfile) return;
        await supabase.from('conversation_participants').upsert({
            conversation_id: convoId,
            user_id: currentUserProfile.user_id,
            last_read_at: new Date().toISOString()
        }, { onConflict: 'conversation_id, user_id' });
    }, [currentUserProfile]);

    useEffect(() => {
        fetchConversationsAndCounts();
        const channel = supabase
            .channel('public:conversations')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, fetchConversationsAndCounts)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchConversationsAndCounts)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversation_participants' }, fetchConversationsAndCounts)
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [fetchConversationsAndCounts]);

    useEffect(() => {
        if (!conversationId) return;
        fetchMessages(conversationId);
        markAsRead(conversationId);
        
        const channel = supabase.channel(`messages:${conversationId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, 
            () => {
                fetchMessages(conversationId);
                markAsRead(conversationId);
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [conversationId, fetchMessages, markAsRead]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, loadingMessages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !currentUserProfile || !conversationId) return;
        setIsSending(true);

        const { error } = await supabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: currentUserProfile.user_id,
            content: newMessage,
        });

        if (error) toast({ title: 'Error sending message', description: error.message, variant: 'destructive' });
        else setNewMessage('');

        setIsSending(false);
    };

    const handleSelectConversation = (convoId) => {
        navigate(`/communications/messaging/${convoId}`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-[calc(100vh-140px)] gap-4">
            <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Inbox</CardTitle>
                    <NewConversationDialog onNewConversation={(c) => handleSelectConversation(c.id)}/>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto">
                    {loadingConversations ? <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div> :
                        <ConversationList conversations={conversations} unreadCounts={unreadCounts} onSelect={handleSelectConversation} activeConversationId={conversationId} />
                    }
                </CardContent>
            </Card>

            <div className="md:col-span-2 lg:col-span-3 flex flex-col h-full">
                {conversationId ? (
                <Card className="flex-1 flex flex-col">
                    <CardHeader className="border-b">
                         <div className="flex justify-between items-center">
                            <div>
                               <CardTitle>{activeConversation?.client?.name}</CardTitle>
                               <CardDescription>{activeConversation?.subject}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon"><Star className="h-5 w-5"/></Button>
                                <Button variant="ghost" size="icon"><Archive className="h-5 w-5"/></Button>
                                {isManagerOrAdmin && activeConversation && <ManageParticipantsDialog conversation={activeConversation} />}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                        {loadingMessages ? <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin"/></div> :
                         messages.map(msg => (
                            <MessageBubble key={msg.id} message={msg} isCurrentUser={msg.sender_id === currentUserProfile?.user_id} />
                         ))
                        }
                        <div ref={messagesEndRef} />
                    </CardContent>
                    <div className="p-4 border-t bg-background">
                        <div className="relative">
                            <Textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="pr-24" onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}/>
                            <div className="absolute top-1/2 -translate-y-1/2 right-2 flex gap-1">
                                <Button size="icon" variant="ghost"><Paperclip className="h-5 w-5"/></Button>
                                <Button size="icon" onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>{isSending ? <Loader2 className="h-5 w-5 animate-spin"/> : <Send className="h-5 w-5"/>}</Button>
                            </div>
                        </div>
                    </div>
                </Card>
                ) : (
                    <Card className="flex-1 flex items-center justify-center bg-muted/20">
                        <div className="text-center text-muted-foreground">
                            <MessageSquare className="h-16 w-16 mx-auto" />
                            <h2 className="mt-4 text-xl font-semibold">Select a conversation</h2>
                            <p className="mt-1">...or start a new one to begin chatting.</p>
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

const NewConversationDialog = ({ onNewConversation }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [clients, setClients] = useState([]);
    const [selectedClientId, setSelectedClientId] = useState('');
    const [subject, setSubject] = useState('');
    const [initialMessage, setInitialMessage] = useState('');

    const { selectedLocation } = useAppLocation();
    const { profile: currentUserProfile } = useUser();
    const { toast } = useToast();

    useEffect(() => {
        if (!isOpen || !selectedLocation) return;
        const fetchClients = async () => {
            const { data, error } = await supabase
                .from('clients')
                .select('id, name')
                .eq('location_id', selectedLocation.id);
            if (error) toast({ title: "Error fetching clients", description: error.message, variant: "destructive" });
            else setClients(data);
        };
        fetchClients();
    }, [isOpen, selectedLocation, toast]);

    const handleSubmit = async () => {
        if (!selectedClientId || !initialMessage.trim() || !currentUserProfile) {
            toast({ title: 'Missing information', description: 'Please select a client and write a message.', variant: 'destructive'});
            return;
        }
        setIsSubmitting(true);
        const { data: convoData, error: convoError } = await supabase.from('conversations').insert({
            client_id: selectedClientId,
            location_id: selectedLocation.id,
            subject: subject || `Conversation with ${clients.find(c => c.id === selectedClientId)?.name}`,
        }).select().single();

        if (convoError) {
            toast({ title: 'Failed to create conversation', description: convoError.message, variant: 'destructive' });
            setIsSubmitting(false);
            return;
        }

        await supabase.from('messages').insert({
            conversation_id: convoData.id,
            sender_id: currentUserProfile.user_id,
            content: initialMessage,
        });
        
        await supabase.from('conversation_participants').insert({
            conversation_id: convoData.id,
            user_id: currentUserProfile.user_id,
            last_read_at: new Date().toISOString(),
        });

        toast({ title: 'Conversation started!' });
        onNewConversation(convoData);
        setIsOpen(false);
        setSelectedClientId('');
        setSubject('');
        setInitialMessage('');
        setIsSubmitting(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button size="sm"><PlusCircle className="mr-2 h-4 w-4"/> New</Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>New Conversation</DialogTitle><DialogDescription>Start a new chat with a client.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                    <div><Label>Client</Label><Select onValueChange={setSelectedClientId} value={selectedClientId}><SelectTrigger><SelectValue placeholder="Select a client..." /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                    <div><Label>Subject (Optional)</Label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Question about Fido's stay" /></div>
                    <div><Label>Message</Label><Textarea value={initialMessage} onChange={e => setInitialMessage(e.target.value)} placeholder="Your initial message to the client..." /></div>
                </div>
                <DialogFooter><DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose><Button onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}Start Conversation</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const ManageParticipantsDialog = ({ conversation }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [staff, setStaff] = useState([]);
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(false);
    const { selectedLocation } = useAppLocation();
    const { toast } = useToast();

    const fetchStaffAndParticipants = useCallback(async () => {
        if (!selectedLocation || !conversation) return;
        setLoading(true);

        const staffPromise = supabase.from('profiles').select('user_id, full_name, avatar_url, roles(name)').eq('location_id', selectedLocation.id).neq('roles.name', 'Client');
        const participantsPromise = supabase.from('conversation_participants').select('user_id').eq('conversation_id', conversation.id);
        
        const [ { data: staffData, error: staffError }, { data: participantsData, error: participantsError } ] = await Promise.all([staffPromise, participantsPromise]);
        
        if (staffError) toast({ title: "Error fetching staff", description: staffError.message, variant: 'destructive' });
        else setStaff(staffData || []);

        if (participantsError) toast({ title: "Error fetching participants", description: participantsError.message, variant: 'destructive' });
        else setParticipants(participantsData.map(p => p.user_id) || []);
        
        setLoading(false);
    }, [selectedLocation, conversation, toast]);

    useEffect(() => {
        if (isOpen) {
            fetchStaffAndParticipants();
        }
    }, [isOpen, fetchStaffAndParticipants]);

    const handleToggleParticipant = async (staffMember) => {
        const isParticipant = participants.includes(staffMember.user_id);
        
        if (isParticipant) {
            const { error } = await supabase.from('conversation_participants').delete().match({ conversation_id: conversation.id, user_id: staffMember.user_id });
            if (error) toast({ title: "Error removing user", description: error.message, variant: 'destructive' });
            else setParticipants(prev => prev.filter(id => id !== staffMember.user_id));
        } else {
            const { error } = await supabase.from('conversation_participants').insert({ conversation_id: conversation.id, user_id: staffMember.user_id });
            if (error) toast({ title: "Error adding user", description: error.message, variant: 'destructive' });
            else setParticipants(prev => [...prev, staffMember.user_id]);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild><Button variant="ghost" size="icon"><Users className="h-5 w-5"/></Button></DialogTrigger>
            <DialogContent>
                <DialogHeader><DialogTitle>Manage Participants</DialogTitle><DialogDescription>Control which staff members are in this conversation.</DialogDescription></DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    {loading ? <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin"/></div> : (
                        <div className="space-y-3">
                            {staff.map(s => (
                                <div key={s.user_id} className="flex items-center justify-between p-2 rounded-md border">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10"><AvatarImage src={s.avatar_url} /><AvatarFallback>{getInitials(s.full_name)}</AvatarFallback></Avatar>
                                        <div>
                                            <p className="font-medium">{s.full_name}</p>
                                            <p className="text-sm text-muted-foreground">{s.roles.name}</p>
                                        </div>
                                    </div>
                                    <Checkbox checked={participants.includes(s.user_id)} onCheckedChange={() => handleToggleParticipant(s)}/>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <DialogFooter><DialogClose asChild><Button>Done</Button></DialogClose></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const EmailMarketingView = () => {
    return (
        <Card className="flex-1 flex items-center justify-center h-[calc(100vh-140px)]">
            <div className="text-center text-muted-foreground">
                <Mail className="h-16 w-16 mx-auto" />
                <h2 className="mt-4 text-2xl font-semibold">Email Marketing Suite</h2>
                <p className="mt-2">This feature is coming soon!</p>
                <p>You'll be able to create campaigns, target clients, and track results right here.</p>
                <Button className="mt-6" disabled>Create First Campaign</Button>
            </div>
        </Card>
    );
};


const Communications = () => {
    const { tab = 'messaging' } = useParams();
    const navigate = useNavigate();

    const handleTabChange = (value) => {
        navigate(`/communications/${value}`);
    }

    return (
        <>
            <Helmet>
                <title>Communications - PetSuite</title>
                <meta name="description" content="Communicate with your clients and manage email campaigns." />
            </Helmet>
            <motion.div
                className="flex-1 space-y-4 p-8 pt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-center justify-between space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
                </div>

                 <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="messaging"><MessageSquare className="mr-2 h-4 w-4" /> In-App Messaging</TabsTrigger>
                        <TabsTrigger value="email-marketing"><Mail className="mr-2 h-4 w-4" /> Email Marketing</TabsTrigger>
                    </TabsList>
                    <TabsContent value="messaging" className="mt-4">
                        <MessagingView />
                    </TabsContent>
                    <TabsContent value="email-marketing" className="mt-4">
                        <EmailMarketingView />
                    </TabsContent>
                </Tabs>
            </motion.div>
        </>
    );
};

export default Communications;
  