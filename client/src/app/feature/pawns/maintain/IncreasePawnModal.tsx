import { useState, useMemo, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DollarInput } from "@/components/ui/dollar-input";
import { formatCurrency } from "@/lib/utils";

interface IncreaseItem {
    id: string;
    description: string;
    quantity: number;
    amount: number;
}

interface IncreasePawnModalProps {
    open: boolean;
    onClose: () => void;
    items: IncreaseItem[];
    onSave: (increaseData: {
        amountFinanced: number;
        items: { id: string; priceAmount: number }[];
    }) => Promise<void>;
}

export function IncreasePawnModal({
    open,
    onClose,
    items,
    onSave,
}: IncreasePawnModalProps) {
    const [totalIncrease, setTotalIncrease] = useState<string>("");
    const [itemIncreases, setItemIncreases] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setTotalIncrease("");
            setItemIncreases({});
        }
    }, [open]);

    const handleTotalIncreaseChange = (value: string) => {
        setTotalIncrease(value);
    };

    const handleItemIncreaseChange = (itemId: string, value: string) => {
        setItemIncreases((prev) => ({
            ...prev,
            [itemId]: value,
        }));
    };

    const currentDistributedIncrease = useMemo(() => {
        return Object.values(itemIncreases).reduce(
            (sum, val) => sum + (parseFloat(val) || 0),
            0
        );
    }, [itemIncreases]);

    const totalIncreaseValue = parseFloat(totalIncrease) || 0;
    const remainingAmount = totalIncreaseValue - currentDistributedIncrease;

    // Use a small epsilon for float comparison
    const isValid =
        totalIncreaseValue > 0 && Math.abs(remainingAmount) < 0.01;

    const handleReset = () => {
        setTotalIncrease("");
        setItemIncreases({});
    };

    const handleSave = async () => {
        if (!isValid) return;

        const itemsPayload = Object.entries(itemIncreases)
            .map(([id, increaseAmount]) => {
                const item = items.find(i => i.id === id);
                if (!item) return null;
                return {
                    id,
                    priceAmount: item.amount + (parseFloat(increaseAmount) || 0),
                };
            })
            .filter((item): item is { id: string; priceAmount: number } => item !== null && item.priceAmount > 0);

        await onSave({
            amountFinanced: totalIncreaseValue,
            items: itemsPayload,
        });
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Increase Pawn Amount</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium whitespace-nowrap">
                                Total Increase Amount:
                            </label>
                            <div className="relative w-48">
                                <DollarInput
                                    value={totalIncrease}
                                    onChange={handleTotalIncreaseChange}
                                    className="pl-6!"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="text-sm text-muted-foreground ml-auto">
                                Remaining to distribute:{" "}
                                <span
                                    className={
                                        remainingAmount < -0.01
                                            ? "text-red-500"
                                            : Math.abs(remainingAmount) < 0.01
                                                ? "text-green-600"
                                                : "text-amber-600"
                                    }
                                >
                                    {formatCurrency(remainingAmount)}
                                </span>
                            </div>
                        </div>

                    </div>

                    <div className="border rounded-md max-h-[400px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="w-[100px]">Quantity</TableHead>
                                    <TableHead className="w-[150px]">Current Amount</TableHead>
                                    <TableHead className="w-[200px]">Increase Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {items.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.description}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>{formatCurrency(item.amount)}</TableCell>
                                        <TableCell>
                                            <div className="relative">
                                                <DollarInput
                                                    value={itemIncreases[item.id] || ""}
                                                    onChange={(value) =>
                                                        handleItemIncreaseChange(item.id, value)
                                                    }
                                                    className="pl-6! w-full"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="secondary" onClick={handleReset}>
                        Reset
                    </Button>
                    <div className="flex-1" />
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!isValid}>
                        Save Increase
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
