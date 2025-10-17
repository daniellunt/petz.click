import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSession = useCallback(async (session) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      handleSession(session);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          // Don't set session for password recovery flow
          setLoading(false);
          return;
        }
        handleSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, [handleSession]);

  const signUp = useCallback(async (email, password, options) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options,
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { data, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign out Failed",
        description: error.message || "Something went wrong",
      });
    }

    return { error };
  }, [toast]);

  const resendConfirmationEmail = useCallback(async (email) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to Resend',
        description: error.message,
      });
    } else {
      toast({
        title: 'Email Sent!',
        description: 'A new confirmation link has been sent to your email address.',
      });
    }
    return { error };
  }, [toast]);
  
  const sendPasswordResetEmail = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error sending reset link',
        description: error.message,
      });
    } else {
      toast({
        title: 'Password Reset Email Sent',
        description: 'Check your email for a link to reset your password.',
      });
    }
    return { error };
  }, [toast]);
  
  const updateUserPassword = useCallback(async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    
    if(error){
       toast({
        variant: 'destructive',
        title: 'Error updating password',
        description: error.message,
      });
    } else {
       toast({
        title: 'Password Updated Successfully',
        description: 'Your password has been changed. Please log in again.',
      });
    }
    return { data, error };
  }, [toast]);

  const inviteUserByEmail = useCallback(async (email, options) => {
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, options);
    if (error) {
      toast({
        variant: "destructive",
        title: "Invite Failed",
        description: error.message || "Something went wrong",
      });
    }
    return { data, error };
  }, [toast]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resendConfirmationEmail,
    sendPasswordResetEmail,
    updateUserPassword,
    inviteUserByEmail,
  }), [user, session, loading, signUp, signIn, signOut, resendConfirmationEmail, sendPasswordResetEmail, updateUserPassword, inviteUserByEmail]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};