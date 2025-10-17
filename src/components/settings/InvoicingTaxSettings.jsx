
import React, { useState } from 'react';
import { Save, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';

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

const InvoicingTaxSettings = () => {
    const { toast } = useToast();

    const [invoiceSettings, setInvoiceSettings] = useSettings('settings_invoice', {
        prefix: 'INV-',
        nextNumber: '0001',
        footerText: 'Thank you for your business!',
    });

    const [taxSettings, setTaxSettings] = useSettings('settings_tax', [
        { id: 1, name: 'Standard VAT', rate: 20 },
    ]);

    const [isTaxDialogOpen, setIsTaxDialogOpen] = useState(false);
    const [newTaxName, setNewTaxName] = useState('');
    const [newTaxRate, setNewTaxRate] = useState('');

    const handleFormChange = (setter, field) => (e) => {
        setter(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSave = (section) => {
        toast({
            title: 'Settings Saved!',
            description: `Your ${section} settings have been updated.`,
        });
    };
    
    const handleAddTax = () => {
        if (!newTaxName || !newTaxRate) {
            toast({ title: "Error", description: "Please provide a name and rate.", variant: "destructive" });
            return;
        }
        setTaxSettings(prev => [...prev, { id: Date.now(), name: newTaxName, rate: parseFloat(newTaxRate) }]);
        toast({ title: "Success", description: "New tax rate added." });
        setNewTaxName('');
        setNewTaxRate('');
        setIsTaxDialogOpen(false);
    };

    const handleDeleteTax = (taxId) => {
        setTaxSettings(prev => prev.filter(tax => tax.id !== taxId));
        toast({ title: "Success", description: "Tax rate removed." });
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Invoice Settings</CardTitle>
                    <CardDescription>Configure how your invoices are generated.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="inv-prefix">Invoice Prefix</Label>
                        <Input id="inv-prefix" value={invoiceSettings.prefix} onChange={handleFormChange(setInvoiceSettings, 'prefix')} className="w-40" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="inv-next">Next Invoice Number</Label>
                        <Input id="inv-next" value={invoiceSettings.nextNumber} onChange={handleFormChange(setInvoiceSettings, 'nextNumber')} className="w-40" />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="inv-footer">Invoice Footer Text</Label>
                        <Input id="inv-footer" value={invoiceSettings.footerText} onChange={handleFormChange(setInvoiceSettings, 'footerText')} />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={() => handleSave('invoice')}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
                </CardFooter>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Tax Settings</CardTitle>
                        <CardDescription>Manage tax rates for your services.</CardDescription>
                    </div>
                    <Dialog open={isTaxDialogOpen} onOpenChange={setIsTaxDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2 h-4 w-4" />Add Tax Rate</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Tax Rate</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="tax-name" className="text-right">Name</Label>
                                    <Input id="tax-name" value={newTaxName} onChange={(e) => setNewTaxName(e.target.value)} className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="tax-rate" className="text-right">Rate (%)</Label>
                                    <Input id="tax-rate" type="number" value={newTaxRate} onChange={(e) => setNewTaxRate(e.target.value)} className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleAddTax}>Save Tax Rate</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tax Name</TableHead>
                                <TableHead>Rate</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {taxSettings.map(tax => (
                                <TableRow key={tax.id}>
                                    <TableCell className="font-medium">{tax.name}</TableCell>
                                    <TableCell>{tax.rate}%</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTax(tax.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};

export default InvoicingTaxSettings;