import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { Dog, Loader2, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const UpdatePassword = () => {
    const navigate = useNavigate();
    const { updateUserPassword } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }
        if(password.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setLoading(true);
        setError('');
        
        const { error: updateError } = await updateUserPassword(password);
        
        if (!updateError) {
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } else {
            setError(updateError.message);
        }

        setLoading(false);
    };

    return (
        <>
            <Helmet>
                <title>Update Password - PetSuite</title>
                <meta name="description" content="Update your PetSuite account password." />
            </Helmet>
            <div className="flex items-center justify-center min-h-screen bg-background">
                <motion.div
                    className="mx-auto grid w-[380px] gap-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex justify-center items-center mb-4">
                                <KeyRound className="h-10 w-10 text-primary" />
                                <span className="ml-2 text-2xl font-bold">PetSuite</span>
                            </div>
                            <CardTitle className="text-2xl">Create New Password</CardTitle>
                            <CardDescription>Enter and confirm your new password below.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdatePassword} className="grid gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">New Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                                    <Input 
                                        id="confirm-password" 
                                        type="password" 
                                        placeholder="••••••••"
                                        required 
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                    />
                                </div>

                                {error && (
                                    <div className="text-sm font-medium text-destructive">{error}</div>
                                )}

                                <Button type="submit" className="w-full" disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </>
    );
};

export default UpdatePassword;