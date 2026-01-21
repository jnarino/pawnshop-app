import { CancelButton } from "@/app/shared/components/CancelButton";
import { FieldLegend, FieldSet } from "@/components/ui/field";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Button } from '@/components/ui/button';
import { RangeDatePicker } from "@/components/ui/range-date-picker";
import { reportsApi } from "@/app/core/api/reportsApi";
import { Loader2 } from "lucide-react";
import { AlertModal } from '@/app/shared/components/AlertModal';


export const PoliceReportPage = () => {

    const today = new Date();
    const localToday = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
    const [loading, setLoading] = useState(false);
    const [alertMessage, setAlertMessage] = useState<string | null>(null);

    const form = useForm({
        defaultValues: {
            dateRange: {
                from: localToday,
                to: localToday
            },
        }
    });

    const submit = async (data: { dateRange: { from: string; to: string } }) => {
        setLoading(true);
        try {
            const { from, to } = data.dateRange;
            if (from && to) {
                const result = await reportsApi.policeReport({
                    from: new Date(from).toISOString(),
                    to: new Date(to).toISOString()
                });

                if (!result) {
                    setAlertMessage("No police report records found.");
                    return;
                }

                const url = window.URL.createObjectURL(
                    new Blob([result]),
                );
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute(
                    'download',
                    `POLICE.EXP`,
                );
                document.body.appendChild(link);
                link.click();
                link.parentNode?.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
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
    return <div className="flex-1 min-h-0 pt-4">
        <div className="flex items-end justify-end gap-4 flex-shrink-0">
            <CancelButton />
        </div>
        <h1 className="text-2xl font-extrabold mb-2.5">Police Report</h1>
        <form onSubmit={form.handleSubmit(submit)} >
            <div className="grid grid-cols-5 gap-4">
                <FieldSet className="card section col-span-5">
                    <FieldLegend className="mb-2 text-sm">Select a date range</FieldLegend>
                    <div className="flex flex-col gap-4">
                        <div className="flex items-end gap-2">
                            <Controller
                                control={form.control}
                                name="dateRange"
                                render={({ field }) => (
                                    <RangeDatePicker
                                        withTime
                                        value={field.value}
                                        onChange={field.onChange}
                                    />
                                )}
                            />
                            <Button type="submit">Generate</Button>
                            {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        </div>
                    </div>
                </FieldSet>
            </div>
        </form>
        <AlertModal
            open={!!alertMessage}
            onOpenChange={(open) => !open && setAlertMessage(null)}
            message={alertMessage}
        />
    </div>;
}