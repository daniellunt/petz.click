import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const UserContext = createContext();

export function UserProvider({ children }) {
    const { user: authUser, loading: authLoading } = useAuth();
    const [profile, setProfile] = useState(null);
    const [permissionsList, setPermissionsList] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const fetchPermissions = useCallback(async () => {
        const { data, error } = await supabase.from('permissions').select('*');
        if (!error) {
            setPermissionsList(data);
        }
    }, []);

    const fetchProfile = useCallback(async () => {
        if (authLoading) return;

        setLoading(true);
        if (authUser) {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                    *,
                    roles ( name )
                `)
                .eq('user_id', authUser.id)
                .single();

            if (!error && data) {
                setProfile(data);
            } else {
                setProfile(null);
            }
        } else {
            setProfile(null);
        }
        setLoading(false);
    }, [authUser, authLoading]);

    useEffect(() => {
        fetchPermissions();
        fetchProfile();
    }, [fetchPermissions, fetchProfile]);

    const value = useMemo(() => ({
        profile,
        permissionsList,
        loading,
        fetchProfile,
    }), [profile, permissionsList, loading, fetchProfile]);

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}