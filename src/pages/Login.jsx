import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Dog, Loader2, MailWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Login = () => {
    const navigate = useNavigate();
    const { signIn, resendConfirmationEmail, sendPasswordResetEmail, user, loading: authLoading } = useAuth();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showResend, setShowResend] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    useEffect(() => {
        if (!authLoading && user) {
            navigate('/', { replace: true });
        }
    }, [user, authLoading, navigate]);

    const handleInput = (setter) => (e) => {
        setter(e.target.value);
        if (loginError) setLoginError('');
        if (showResend) setShowResend(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setLoginError('');
        setShowResend(false);

        const { error } = await signIn(email, password);

        if (error) {
            if (error.message === 'Email not confirmed') {
                setShowResend(true);
                setLoginError("Please check your inbox to confirm your email address.");
            } else {
                setLoginError(error.message);
            }
        } else {
            navigate('/');
        }
        setLoading(false);
    };
    
    const handleResendConfirmation = async () => {
        setResendLoading(true);
        await resendConfirmationEmail(email);
        setResendLoading(false);
    };
    
    const handlePasswordReset = async () => {
        if (!email) {
            toast({
                variant: "destructive",
                title: "Email required",
                description: "Please enter your email address to reset your password.",
            });
            return;
        }
        await sendPasswordResetEmail(email);
    };

    if (authLoading || (!authLoading && user)) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-background">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    return (
        <>
            <Helmet>
                <title>Login - PetSuite</title>
                <meta name="description" content="Login to your PetSuite account." />
            </Helmet>
            <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2 xl:min-h-screen">
                <div className="flex items-center justify-center py-12">
                    <motion.div
                        className="mx-auto grid w-[350px] gap-6"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Card>
                            <CardHeader className="text-center">
                                <div className="flex justify-center items-center mb-4">
                                    <Dog className="h-10 w-10 text-primary" />
                                    <span className="ml-2 text-2xl font-bold">PetSuite</span>
                                </div>
                                <CardTitle className="text-2xl">Welcome Back!</CardTitle>
                                <CardDescription>Enter your email below to login to your account</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleLogin} className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="m@example.com"
                                            required
                                            value={email}
                                            onChange={handleInput(setEmail)}
                                            disabled={loading || resendLoading}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="flex items-center">
                                            <Label htmlFor="password">Password</Label>
                                            <Button
                                              type="button"
                                              variant="link"
                                              className="ml-auto inline-block text-sm"
                                              onClick={handlePasswordReset}
                                            >
                                              Forgot your password?
                                            </Button>
                                        </div>
                                        <Input 
                                            id="password" 
                                            type="password" 
                                            required 
                                            value={password}
                                            onChange={handleInput(setPassword)}
                                            disabled={loading || resendLoading}
                                        />
                                    </div>

                                    {loginError && (
                                        <div className="text-sm font-medium text-destructive">{loginError}</div>
                                    )}

                                    <Button type="submit" className="w-full" disabled={loading || resendLoading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Login
                                    </Button>
                                    
                                    {showResend && (
                                        <Button 
                                            variant="secondary" 
                                            className="w-full" 
                                            onClick={handleResendConfirmation}
                                            disabled={resendLoading || loading}
                                        >
                                            {resendLoading ? (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            ) : (
                                                <MailWarning className="mr-2 h-4 w-4" />
                                            )}
                                            Resend Confirmation
                                        </Button>
                                    )}
                                </form>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
                <div className="hidden bg-muted lg:block">
                     <img
                        alt="A happy dog being taken care of at a pet resort"
                        className="h-full w-full object-cover dark:brightness-[0.3]"
                     src="https://images.unsplash.com/photo-1605923755374-0b158735a75d" />
                </div>
            </div>
        </>
    );
};

export default Login;