import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const MyProfileRedirect = () => {
    const navigate = useNavigate();
    const { profile, loading: userLoading } = useUser();
    const { loading: authLoading } = useAuth();

    useEffect(() => {
        const isLoading = userLoading || authLoading;
        if (!isLoading && profile?.id) {
            navigate(`/users/${profile.id}`, { replace: true });
        }
    }, [profile, userLoading, authLoading, navigate]);
    
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Redirecting to your profile...</p>
        </div>
    );
};

export default MyProfileRedirect;