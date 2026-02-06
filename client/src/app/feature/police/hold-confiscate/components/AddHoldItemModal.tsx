import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Search, X } from 'lucide-react';
import { inventoryApi, InventoryItem } from '@/app/core/api/inventoryApi';
import { pawnTicketApi, TicketByControlNumber } from '@/app/core/api/pawnTicketApi';
import * as categoryApi from '@/app/core/api/categoryApi';
import { CategoryOption } from '@/app/core/api/categoryApi';
import { PoliceHoldItem } from '@/app/core/api/policeApi';
import { Checkbox } from '@/components/ui/checkbox'; // User asked for Radio button in table, but typical is radio for single select

interface AddHoldItemModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddItems: (items: PoliceHoldItem[], sourceStr: string) => void;
}

export const AddHoldItemModal = ({ isOpen, onClose, onAddItems }: AddHoldItemModalProps) => {
    const [mode, setMode] = useState<'INVENTORY' | 'TRANSACTION'>('INVENTORY');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Inventory Search State
    const [invNumber, setInvNumber] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [modelNumber, setModelNumber] = useState('');

    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [subcategories, setSubcategories] = useState<CategoryOption[]>([]);
    const [brands, setBrands] = useState<CategoryOption[]>([]);

    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');

    const [inventoryResults, setInventoryResults] = useState<InventoryItem[]>([]);
    const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);

    // Transaction Search State
    const [ticketNumber, setTicketNumber] = useState('');

    // Load Categories on mount
    useEffect(() => {
        if (isOpen) {
            loadRootCategories();
        }
    }, [isOpen]);

    const loadRootCategories = async () => {
        try {
            const cats = await categoryApi.getRootCategories();
            setCategories(cats);
        } catch (e) {
            console.error("Failed to load categories", e);
        }
    };

    const handleCategoryChange = async (catId: string) => {
        setSelectedCategory(catId);
        setSelectedSubcategory('');
        setSelectedBrand('');
        try {
            const [subs, brs] = await Promise.all([
                categoryApi.getSubcategories(catId),
                categoryApi.getBrands(catId)
            ]);
            setSubcategories(subs);
            setBrands(brs);
        } catch (e) {
            console.error("Failed to load subcategories/brands", e);
        }
    };

    const handleInventorySearch = async () => {
        setLoading(true);
        setError(null);
        setInventoryResults([]);
        setSelectedInventoryId(null);

        try {
            if (invNumber) {
                const item = await inventoryApi.findAvailableItemByNumber(invNumber);
                if (item) {
                    setInventoryResults([item]);
                    setSelectedInventoryId(item.id); // Default select first
                } else {
                    setError('No item found with that Inventory #');
                }
            } else {
                const items = await inventoryApi.findByParams({
                    serialNumber,
                    modelNumber,
                    categoryId: selectedCategory,
                    subcategoryId: selectedSubcategory,
                    brandId: selectedBrand
                });
                setInventoryResults(items);
                if (items.length > 0) {
                    setSelectedInventoryId(items[0].id);
                }
            }
        } catch (e) {
            console.error(e);
            setError('Failed to search inventory');
        } finally {
            setLoading(false);
        }
    };

    const handleTransactionSearch = async () => {
        setLoading(true);
        setError(null);

        try {
            const results = await pawnTicketApi.findByControlNumber(ticketNumber);
            if (results && results.length > 0) {
                const ticket = results[0];
                const items: PoliceHoldItem[] = ticket.items.map(item => ({
                    inventoryItemId: item.id,
                    inventoryNumber: item.inventoryNumber || '',
                    model: item.model || '',
                    serialNumber: item.serialNumber || '',
                    itemDescription: item.itemDescription || '',
                    quantity: item.quantity || 1,
                    amount: item.priceAmount || 0,
                    priceAmount: item.priceAmount || 0
                }));

                onAddItems(items, `Ticket #: ${ticket.controlNumber}`);
                onClose();
            } else {
                setError('Ticket not found');
            }
        } catch (e) {
            console.error(e);
            setError('Failed to search ticket');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectInventory = () => {
        const item = inventoryResults.find(i => i.id === selectedInventoryId);
        if (item) {
            const holdItem: PoliceHoldItem = {
                inventoryItemId: item.id,
                inventoryNumber: item.inventoryNumber,
                model: '', // Not in basic InventoryItem interface, might need extra fetch or cast
                serialNumber: item.serialNumber,
                itemDescription: item.itemDescription || item.description || '',
                quantity: item.quantity || 1,
                amount: item.priceAmount || 0

            };
            onAddItems([holdItem], `Inventory #: ${item.inventoryNumber}`);
            onClose();
        }
    };

    const resetForm = () => {
        setInvNumber('');
        setSerialNumber('');
        setModelNumber('');
        setSelectedCategory('');
        setSelectedSubcategory('');
        setSelectedBrand('');
        setTicketNumber('');
        setInventoryResults([]);
        setSelectedInventoryId(null);
        setError(null);
    };

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Item(s)</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-6">
                    <div className="flex justify-center">
                        <RadioGroup
                            value={mode}
                            onValueChange={(v: 'INVENTORY' | 'TRANSACTION') => { setMode(v); setError(null); }}
                            className="flex gap-6"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="INVENTORY" id="mode-inv" />
                                <Label htmlFor="mode-inv">Inventory</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="TRANSACTION" id="mode-trans" />
                                <Label htmlFor="mode-trans">Transaction</Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {error && (
                        <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {mode === 'INVENTORY' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4 border-r pr-6">
                                <div className="space-y-2">
                                    <Label>Inventory #</Label>
                                    <div className="relative">
                                        <Input
                                            value={invNumber}
                                            onChange={e => setInvNumber(e.target.value)}
                                            placeholder="Search by Inventory #"
                                            disabled={!!selectedCategory || !!serialNumber || !!modelNumber}
                                            className="pr-8"
                                            onKeyDown={(e) => e.key === 'Enter' && handleInventorySearch()}
                                        />
                                        {invNumber && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                                onClick={() => setInvNumber('')}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <span className="w-full border-t" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-background px-2 text-muted-foreground">Or</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label>Type</Label>
                                        <div className="relative">
                                            <Select
                                                value={selectedCategory}
                                                onValueChange={handleCategoryChange}
                                                disabled={!!invNumber || !!serialNumber || !!modelNumber}
                                            >
                                                <SelectTrigger className="pr-8">
                                                    <SelectValue placeholder="Select Type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            {selectedCategory && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCategoryChange('');
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <div className="relative">
                                            <Select
                                                value={selectedSubcategory}
                                                onValueChange={setSelectedSubcategory}
                                                disabled={!selectedCategory || !!invNumber || !!serialNumber || !!modelNumber}
                                            >
                                                <SelectTrigger className="pr-8">
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {subcategories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            {selectedSubcategory && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedSubcategory('');
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Brand</Label>
                                    <div className="relative">
                                        <Select
                                            value={selectedBrand}
                                            onValueChange={setSelectedBrand}
                                            disabled={!selectedCategory || !selectedSubcategory || !!invNumber || !!serialNumber || !!modelNumber}
                                        >
                                            <SelectTrigger className="pr-8">
                                                <SelectValue placeholder="Select Brand" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        {selectedBrand && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-8 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground z-10"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedBrand('');
                                                }}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Serial #</Label>
                                    <div className="relative">
                                        <Input
                                            value={serialNumber}
                                            onChange={e => setSerialNumber(e.target.value)}
                                            disabled={!!invNumber || !!selectedCategory || !!modelNumber}
                                            className="pr-8"
                                            onKeyDown={(e) => e.key === 'Enter' && handleInventorySearch()}
                                        />
                                        {serialNumber && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                                onClick={() => setSerialNumber('')}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Model #</Label>
                                    <div className="relative">
                                        <Input
                                            value={modelNumber}
                                            onChange={e => setModelNumber(e.target.value)}
                                            disabled={!!invNumber || !!selectedCategory || !!serialNumber}
                                            className="pr-8"
                                            onKeyDown={(e) => e.key === 'Enter' && handleInventorySearch()}
                                        />
                                        {modelNumber && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                                onClick={() => setModelNumber('')}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <Button className="flex-1" onClick={handleInventorySearch} disabled={loading}>
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        <Search className="mr-2 h-4 w-4" />
                                        Search
                                    </Button>
                                    <Button variant="outline" size="icon" onClick={resetForm} title="Clear form">
                                        Clear
                                    </Button>
                                </div>
                            </div>

                            <div className="flex flex-col h-full">
                                <div className="border rounded-md flex-1 overflow-auto min-h-[300px]">
                                    <Table stickyHeader>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead sticky className="w-[50px] bg-background z-20"></TableHead>
                                                <TableHead sticky className="bg-background z-20">Status</TableHead>
                                                <TableHead sticky className="bg-background z-20">On Hand</TableHead>
                                                <TableHead sticky className="bg-background z-20">Description</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {inventoryResults.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                        No items found.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                            {inventoryResults.map(item => (
                                                <TableRow
                                                    key={item.id}
                                                    className="cursor-pointer"
                                                    onClick={() => setSelectedInventoryId(item.id)}
                                                >
                                                    <TableCell>
                                                        <Checkbox
                                                            checked={selectedInventoryId === item.id}
                                                            onCheckedChange={() => setSelectedInventoryId(item.id)}
                                                            id={`rb-${item.id}`}
                                                            className="rounded-full" // Make it look like a radio
                                                        />
                                                    </TableCell>
                                                    <TableCell>{item.status}</TableCell>
                                                    <TableCell>{item.quantity || 1}</TableCell>
                                                    <TableCell>{item.itemDescription || item.description}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <Button onClick={handleSelectInventory} disabled={!selectedInventoryId}>
                                        Select
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 gap-6">
                            <div className="w-full max-w-sm space-y-4">
                                <div className="space-y-2">
                                    <Label>Ticket #</Label>
                                    <Input
                                        value={ticketNumber}
                                        onChange={e => setTicketNumber(e.target.value)}
                                        placeholder="Enter Ticket Number"
                                        onKeyDown={e => e.key === 'Enter' && handleTransactionSearch()}
                                    />
                                </div>
                                <Button className="w-full" onClick={handleTransactionSearch} disabled={loading || !ticketNumber}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Find Ticket
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
