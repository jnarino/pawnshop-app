import { useEffect, useMemo, useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertModal } from '@/app/shared/components/AlertModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { AddHoldItemModal } from './AddHoldItemModal';

import { CreatePoliceHoldPayload, PoliceHoldItem, policeApi } from '@/app/core/api/policeApi';
import { Loader2 } from 'lucide-react';
import { useHoldConfiscateWorkflow } from '../contexts/HoldConfiscateWorkflowContext';
import { formatCurrency } from '@/lib/utils';

export const HoldConfiscateTab = () => {
    const {
        holdConfiscateDraft,
        updateHoldConfiscateDraft,
        selectedHold,
        resetHoldConfiscateDraft,
        navigateToTab
    } = useHoldConfiscateWorkflow();

    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);
    const [isAddItemsModalOpen, setIsAddItemsModalOpen] = useState(false);
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());

    // Populate form if viewing existing hold
    useEffect(() => {
        if (selectedHold) {
            updateHoldConfiscateDraft({
                type: selectedHold.isHold ? 'HOLD' : 'CONFISCATE',
                holdDate: selectedHold.holdDate,
                releasedDate: selectedHold.dateOut,
                caseNumber: selectedHold.caseNumber,
                agency: selectedHold.agency,
                jurisdiction: selectedHold.jurisdiction,
                agentFirstName: selectedHold.agentFirstName,
                agentLastName: selectedHold.agentLastName,
                agentMiddleInitial: selectedHold.agentMiddleInitial,
                badgeNumber: selectedHold.badgeNumber,
                phoneAreaCode: selectedHold.phoneAreaCode,
                phoneNumber: selectedHold.phoneNumber,
                phoneExtension: selectedHold.phoneExtension,
                comment: selectedHold.comment,
                items: selectedHold.items,
                employee: selectedHold.updatedBy,
            });
        }
    }, [selectedHold, updateHoldConfiscateDraft]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload: CreatePoliceHoldPayload = {
                holdDate: holdConfiscateDraft.holdDate,
                agency: holdConfiscateDraft.agency,
                caseNumber: holdConfiscateDraft.caseNumber,
                isHold: holdConfiscateDraft.type === 'HOLD',
                isInventory: false, // Default to false? Or derive?
                comment: holdConfiscateDraft.comment,
                agentLastName: holdConfiscateDraft.agentLastName,
                agentFirstName: holdConfiscateDraft.agentFirstName,
                agentMiddleInitial: holdConfiscateDraft.agentMiddleInitial || '',
                badgeNumber: holdConfiscateDraft.badgeNumber,
                phoneAreaCode: holdConfiscateDraft.phoneAreaCode,
                phoneNumber: holdConfiscateDraft.phoneNumber,
                phoneExtension: holdConfiscateDraft.phoneExtension || '',
                jurisdiction: holdConfiscateDraft.jurisdiction,
                itemIds: Array.from(selectedItemIds)
            };

            if (selectedHold && selectedHold.id) {
                await policeApi.updateHold(selectedHold.id, payload);
                setAlertMessage('Hold / Confiscate updated successfully');
            } else {
                await policeApi.createHold(payload);
                setAlertMessage('Hold / Confiscate saved successfully');
            }
            resetHoldConfiscateDraft();
            setSelectedItemIds(new Set());
            navigateToTab('list');
        } catch (error) {
            console.error('Failed to save hold', error);
            setAlertMessage('Failed to save hold / confiscate');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItemsFromModal = (items: PoliceHoldItem[], sourceStr: string) => {
        updateHoldConfiscateDraft({
            items,
            fromInput: sourceStr
        });
    };

    // Removed isViewMode to allow editing


    const isFormValid = useMemo(() => {
        const {
            holdDate,
            agentLastName,
            caseNumber,
            type,
            agency,
            fromInput,
            items
        } = holdConfiscateDraft;

        return (
            !!holdDate &&
            !!agentLastName &&
            !!caseNumber &&
            !!type &&
            !!agency &&
            !!fromInput &&
            selectedItemIds.size > 0
        );
    }, [holdConfiscateDraft, selectedItemIds]);

    const handleToggleItem = (itemId: string) => {
        const newSelected = new Set(selectedItemIds);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItemIds(newSelected);
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const allIds = holdConfiscateDraft.items?.map(i => i.inventoryItemId) || [];
            setSelectedItemIds(new Set(allIds));
        } else {
            setSelectedItemIds(new Set());
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            <AlertModal
                open={!!alertMessage}
                onOpenChange={(open) => !open && setAlertMessage(null)}
                title="Result"
                message={alertMessage || ''}
            />
            <Card className="h-fit">
                <CardHeader>
                    <CardTitle>Hold Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Dates, Case, Employee */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="holdDate">Started <span className="text-destructive">*</span></Label>
                            <Input
                                id="holdDate"
                                type="date"
                                value={holdConfiscateDraft.holdDate ? new Date(holdConfiscateDraft.holdDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => updateHoldConfiscateDraft({ holdDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="releasedDate">Released</Label>
                            <Input
                                id="releasedDate"
                                type="date"
                                value={holdConfiscateDraft.releasedDate ? new Date(holdConfiscateDraft.releasedDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => updateHoldConfiscateDraft({ releasedDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="caseNumber">Case # <span className="text-destructive">*</span></Label>
                            <Input
                                id="caseNumber"
                                value={holdConfiscateDraft.caseNumber}
                                onChange={(e) => updateHoldConfiscateDraft({ caseNumber: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="employee">Employee</Label>
                            <Input
                                id="employee"
                                value={holdConfiscateDraft.employee}
                                readOnly
                                className="bg-muted"
                            />
                        </div>
                    </div>

                    {/* Column 2: Agency, Jurisdiction, Agent Details */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="agency">Agency <span className="text-destructive">*</span></Label>
                            <Input
                                id="agency"
                                value={holdConfiscateDraft.agency}
                                onChange={(e) => updateHoldConfiscateDraft({ agency: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jurisdiction">Jurisdiction</Label>
                            <Input
                                id="jurisdiction"
                                value={holdConfiscateDraft.jurisdiction}
                                onChange={(e) => updateHoldConfiscateDraft({ jurisdiction: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Agent Name <span className="text-destructive">*</span></Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="First"
                                    value={holdConfiscateDraft.agentFirstName}
                                    onChange={(e) => updateHoldConfiscateDraft({ agentFirstName: e.target.value })}
                                />
                                <Input
                                    placeholder="Middle"
                                    className="w-20"
                                    value={holdConfiscateDraft.agentMiddleInitial}
                                    onChange={(e) => updateHoldConfiscateDraft({ agentMiddleInitial: e.target.value })}
                                />
                                <Input
                                    placeholder="Last"
                                    value={holdConfiscateDraft.agentLastName}
                                    onChange={(e) => updateHoldConfiscateDraft({ agentLastName: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="w-1/3 space-y-2">
                                <Label htmlFor="badge">Badge</Label>
                                <Input
                                    id="badge"
                                    value={holdConfiscateDraft.badgeNumber}
                                    onChange={(e) => updateHoldConfiscateDraft({ badgeNumber: e.target.value })}
                                />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Label>Phone</Label>
                                <div className="flex gap-2 items-center">
                                    <span className="text-sm border p-2 rounded bg-muted">(</span>
                                    <Input
                                        className="w-16 text-center"
                                        maxLength={3}
                                        value={holdConfiscateDraft.phoneAreaCode}
                                        onChange={(e) => updateHoldConfiscateDraft({ phoneAreaCode: e.target.value })}
                                    />
                                    <span className="text-sm border p-2 rounded bg-muted">)</span>
                                    <Input
                                        className="flex-1"
                                        value={holdConfiscateDraft.phoneNumber}
                                        onChange={(e) => updateHoldConfiscateDraft({ phoneNumber: e.target.value })}
                                    />
                                    <span className="text-sm text-nowrap">Ext.</span>
                                    <Input
                                        className="w-16"
                                        value={holdConfiscateDraft.phoneExtension}
                                        onChange={(e) => updateHoldConfiscateDraft({ phoneExtension: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Comment, Type, From */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="comment">Comment</Label>
                            <Textarea
                                id="comment"
                                value={holdConfiscateDraft.comment}
                                onChange={(e) => updateHoldConfiscateDraft({ comment: e.target.value })}
                                className="min-h-[100px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type <span className="text-destructive">*</span></Label>
                            <RadioGroup
                                value={holdConfiscateDraft.type}
                                onValueChange={(val: 'HOLD' | 'CONFISCATE') => updateHoldConfiscateDraft({ type: val })}
                                className="flex gap-4"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="HOLD" id="r-hold" />
                                    <Label htmlFor="r-hold">Hold</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="CONFISCATE" id="r-confiscate" />
                                    <Label htmlFor="r-confiscate">Confiscate</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fromInput">From <span className="text-destructive">*</span></Label>
                            <Input
                                id="fromInput"
                                value={holdConfiscateDraft.fromInput}
                                readOnly
                                className="bg-muted"
                                placeholder="Inventory Item # or Transaction #"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="flex flex-col gap-4 h-full">
                <Card className="flex-1 flex flex-col min-h-0">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <div className="flex flex-col gap-1">
                            <CardTitle>Items</CardTitle>
                            <span className="text-sm text-muted-foreground">
                                Check item(s) to Hold or Confiscate
                            </span>
                        </div>
                        <Button variant="secondary" size="sm" onClick={() => setIsAddItemsModalOpen(true)}>
                            Add item(s)
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto min-h-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={holdConfiscateDraft.items?.length === selectedItemIds.size && holdConfiscateDraft.items?.length > 0}
                                            onCheckedChange={(checked) => handleSelectAll(!!checked)}
                                        />
                                    </TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-[80px]">Qty</TableHead>
                                    <TableHead className="w-[100px] text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {holdConfiscateDraft.items?.map((item) => (
                                    <TableRow key={item.inventoryItemId}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedItemIds.has(item.inventoryItemId)}
                                                onCheckedChange={() => handleToggleItem(item.inventoryItemId)}
                                            />
                                        </TableCell>
                                        <TableCell>{item.itemDescription}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell className="text-right">{formatCurrency(item.amount || item.priceAmount || 0)}</TableCell>
                                    </TableRow>
                                ))}
                                {(!holdConfiscateDraft.items || holdConfiscateDraft.items.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                            No items added. Click "Add item(s)" to search inventory.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <div className="justify-end flex gap-4 pt-4 border-t">
                    <Button onClick={handleSave} disabled={loading || !isFormValid}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {selectedHold ? 'Save Changes' : 'Save'}
                    </Button>
                </div>
            </div>

            <AddHoldItemModal
                isOpen={isAddItemsModalOpen}
                onClose={() => setIsAddItemsModalOpen(false)}
                onAddItems={handleAddItemsFromModal}
            />
        </div>
    );
};