
import React, { useState } from 'react';
import { Building, Save, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

const useSettings = (key, initialValue) => {
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(error);
            return initialValue;
        }
    });

    const setValue = (value) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            window.dispatchEvent(new Event('storage'));
        } catch (error) {
            console.error(error);
        }
    };

    return [storedValue, setValue];
};


const CompanyBrandingSettings = () => {
    const { toast } = useToast();
    
    const [companyDetails, setCompanyDetails] = useSettings('settings_company', {
        name: 'PetSuite Inc.',
        address: '123 Doggo Lane, Petville, PV 54321',
        phone: '555-123-4567',
        email: 'contact@petsuite.com',
    });
    
    const [branding, setBranding] = useSettings('settings_branding', {
        logoUrl: '',
        primaryColor: '#6D28D9',
    });

    const [currencySettings, setCurrencySettings] = useSettings('settings_currency', {
        symbol: '€',
        code: 'EUR',
    });

    const handleFormChange = (setter, field) => (e) => {
        setter(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSave = (section) => {
        toast({
            title: 'Settings Saved!',
            description: `Your ${section} settings have been updated.`,
        });
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Company Details</CardTitle>
                    <CardDescription>Update your company's information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input id="company-name" value={companyDetails.name} onChange={handleFormChange(setCompanyDetails, 'name')} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="address">Address</Label>
                        <Input id="address" value={companyDetails.address} onChange={handleFormChange(setCompanyDetails, 'address')} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" value={companyDetails.phone} onChange={handleFormChange(setCompanyDetails, 'phone')} />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" value={companyDetails.email} onChange={handleFormChange(setCompanyDetails, 'email')} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => handleSave('company')}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Branding</CardTitle>
                    <CardDescription>Customize the look and feel of your application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>Company Logo</Label>
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 rounded-md bg-muted flex items-center justify-center">
                                {branding.logoUrl ? <img-replace src={branding.logoUrl} alt="Company Logo" className="h-full w-full object-contain rounded-md" /> : <Building className="h-10 w-10 text-muted-foreground" />}
                            </div>
                            <Button variant="outline" onClick={() => toast({ title: 'Heads up!', description: "🚧 This feature isn't implemented yet—but don't worry! You can request it in your next prompt! 🚀", variant: 'destructive'})}><Upload className="mr-2 h-4 w-4" /> Upload Logo</Button>
                        </div>
                        <p className="text-sm text-muted-foreground">Recommended size: 256x256px, PNG or JPG.</p>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="primary-color">Primary Color</Label>
                        <div className="flex items-center gap-2">
                            <Input id="primary-color" value={branding.primaryColor} onChange={handleFormChange(setBranding, 'primaryColor')} className="w-40" />
                            <div className="h-10 w-10 rounded-md border" style={{ backgroundColor: branding.primaryColor }}></div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => handleSave('branding')}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Currency Settings</CardTitle>
                    <CardDescription>Set the default currency for your business.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="currency-symbol">Currency Symbol</Label>
                        <Input id="currency-symbol" value={currencySettings.symbol} onChange={handleFormChange(setCurrencySettings, 'symbol')} className="w-20" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="currency-code">Currency Code (e.g., USD, EUR)</Label>
                        <Input id="currency-code" value={currencySettings.code} onChange={handleFormChange(setCurrencySettings, 'code')} className="w-32" />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => handleSave('currency')}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                </CardFooter>
            </Card>
        </div>
    );
};

export default CompanyBrandingSettings;