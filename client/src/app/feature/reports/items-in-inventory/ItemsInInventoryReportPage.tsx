import { CancelButton } from "@/app/shared/components/CancelButton";
import { FieldSet } from "@/components/ui/field";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Button } from '@/components/ui/button';
import { reportsApi } from "@/app/core/api/reportsApi";
import { Printer, Download, X, Loader2 } from "lucide-react";
import { generateItemsInInventoryPdf } from "./generateItemsInInventoryPdf";
import { AlertModal } from '@/app/shared/components/AlertModal';
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { CategoryOption } from "@/app/core/api/categoryApi";
import * as categoryApi from '@/app/core/api/categoryApi';

export const ItemsInInventoryReportPage = () => {
    const [categories, setCategories] = useState<CategoryOption[]>([]);
    const [subcategories, setSubcategories] = useState<CategoryOption[]>([]);
    const [brands, setBrands] = useState<CategoryOption[]>([]);

    // Form State
    // Form State
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubcategory, setSelectedSubcategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');

    // New Checkbox State
    const [allItems, setAllItems] = useState(false);
    const [excludeFirearms, setExcludeFirearms] = useState(false);

    const now = new Date();
    // Default date range is not strictly used for filtering in this report based on requirements, 
    // but useful for PDF header.
    const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const loadRootCategories = async () => {
        try {
            const cats = await categoryApi.getRootCategories();
            setCategories(cats);
        } catch (e) {
            console.error("Failed to load categories", e);
        }
    };

    useEffect(() => {
        loadRootCategories();
    }, []);

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

    const defaultFrom = formatDate(firstDayPrevMonth);
    const defaultTo = formatDate(lastDayPrevMonth);
    const [loading, setLoading] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    const form = useForm({
        defaultValues: {
            dateRange: {
                from: defaultFrom,
                to: defaultTo
            },
        }
    });

    const submit = async () => {
        setLoading(true);
        setPdfUrl(null);
        try {

            const params: any = {};

            if (allItems) {
                if (excludeFirearms) params.exclude = true;
            } else {
                if (!selectedCategory) {
                    setAlertMessage("Please select a Type or check 'All items'.");
                    setLoading(false);
                    return;
                }
                if (selectedCategory) params.categoryId = selectedCategory;
                if (selectedSubcategory) params.subcategoryId = selectedSubcategory;
                if (selectedBrand) params.brandId = selectedBrand;
            }

            const result = await reportsApi.inventoryActiveReport(params);


            if (!result || !result.rows || result.rows.length === 0) {
                setAlertMessage("No report records found.");
                return;
            }

            // For PDF Header date range, if we used filters, we might not have a range.
            // Just pass empty or "Active" effectively.
            const pdfBlob = await generateItemsInInventoryPdf(result, { from: '', to: '' }, { exclude: excludeFirearms });
            const url = window.URL.createObjectURL(pdfBlob);
            setPdfUrl(url);

        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                setAlertMessage(error.message);
            } else {
                setAlertMessage('An error occurred while generating the report.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        const iframe = document.getElementById('report-frame') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.print();
        }
    };

    const handleDownload = () => {
        if (!pdfUrl) return;
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.setAttribute(
            'download',
            `ItemsInPawnsReport.pdf`,
        );
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
    };

    // Logic for disabling Category/Brand filters:
    // "If 'All items' is checked ... category ... disabled."
    const filtersDisabled = allItems;

    // Logic for disabling 'Exclude' based on 'All Items'
    // "If 'All items' is checked ... enabled exclude"
    // "If 'All items' is unchecked ... disabled exclude"
    const excludeDisabled = !allItems;

    // Interaction logic:
    // If user types in ID search, should we uncheck 'All Items'?
    // Since 'All Items' enables filters, and ID search is alternative to filters (usually),
    // let's say if All Items is Checked, ID inputs are disabled (to avoid confusion of scope).
    const handleAllItemsChange = (checked: boolean) => {
        setAllItems(checked);
        if (checked) {
            // If checked, clear filters? Or just disable them?
            // User didn't ask to clear, but safer UX.
            setSelectedCategory('');
            setSelectedSubcategory('');
            setSelectedBrand('');
            // Also, "Exclude" becomes enabled, so maybe keep existing exclude selection or reset?
            // Let's keep existing exclude.
        } else {
            // If unchecked, "Exclude" becomes disabled. Clear it?
            setExcludeFirearms(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] pt-4 space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-extrabold">Items in Inventory Report</h1>
                <div className="flex items-center gap-2">
                    {pdfUrl && (
                        <>
                            <Button onClick={handlePrint} variant="outline" size="sm">
                                <Printer className="w-4 h-4 mr-2" />
                                Print
                            </Button>
                            <Button onClick={handleDownload} variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-2" />
                                Download
                            </Button>
                        </>
                    )}
                    <CancelButton />
                </div>
            </div>

            <form onSubmit={form.handleSubmit(submit)} className="">
                <FieldSet className="card section space-y-4">
                    <div className="flex flex-row space-x-6">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allItems"
                                checked={allItems}
                                onCheckedChange={(c) => handleAllItemsChange(c as boolean)}
                            />
                            <Label htmlFor="allItems">All items</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="excludeFirearms"
                                checked={excludeFirearms}
                                onCheckedChange={(c) => setExcludeFirearms(c as boolean)}
                                disabled={excludeDisabled}
                            />
                            <Label htmlFor="excludeFirearms">Exclude Firearms and Jewelry</Label>
                        </div>
                    </div>

                    <div>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">Filters</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-2">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <div className="relative">
                                    <Select
                                        value={selectedCategory}
                                        onValueChange={handleCategoryChange}
                                        disabled={filtersDisabled}
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
                                            disabled={filtersDisabled}
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
                                        disabled={filtersDisabled || !selectedCategory}
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
                                            disabled={filtersDisabled}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Brand</Label>
                                <div className="relative">
                                    <Select
                                        value={selectedBrand}
                                        onValueChange={setSelectedBrand}
                                        disabled={filtersDisabled || !selectedCategory || !selectedSubcategory}
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
                                            disabled={filtersDisabled}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full mt-4">
                        {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Generate Preview
                    </Button>
                </FieldSet>
            </form>

            {pdfUrl ? (
                <div className="flex-1 border rounded-lg overflow-hidden bg-gray-100">
                    <iframe
                        id="report-frame"
                        src={pdfUrl}
                        className="w-full h-full"
                        title="Report Preview"
                    />
                </div>
            ) : (
                <div className="flex-1 border rounded-lg bg-muted/30 shadow-inner p-4 flex items-center justify-center text-muted-foreground flex-col gap-2">
                    <div className="text-lg font-medium">No report generated</div>
                    <div className="text-sm">Select criteria and click generate to view the report preview</div>
                </div>
            )}
            <AlertModal
                open={!!alertMessage}
                onOpenChange={(open) => !open && setAlertMessage(null)}
                message={alertMessage}
            />
        </div>
    );
};