import { DatePicker } from "./date-picker";
import { Field, FieldLabel } from "./field";
import { Input } from "./input";

interface RangeDatePickerProps {
    value: { from: string; to: string };
    onChange: (value: { from: string; to: string }) => void;
    disabled?: boolean;
    withTime?: boolean;
}

function parseIsoToDate(iso: string) {
    if (!iso) return undefined;
    const datePart = iso.split('T')[0];
    const [y, m, d] = datePart.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function RangeDatePicker({ value, onChange, disabled, withTime }: RangeDatePickerProps) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fromDate = parseIsoToDate(value.from);
    const toDate = parseIsoToDate(value.to);

    const handleFromChange = (newFrom: string | undefined) => {
        onChange({ ...value, from: newFrom || '' });
    };

    const handleToChange = (newTo: string | undefined) => {
        onChange({ ...value, to: newTo || '' });
    };

    const handleDateTimeChange = (field: 'from' | 'to', newValue: string) => {
        onChange({ ...value, [field]: newValue });
    };


    if (withTime) {
        return (
            <div className="flex gap-2">
                <Field className="flex-1">
                    <FieldLabel>From Date & Time</FieldLabel>
                    <Input
                        type="datetime-local"
                        value={value.from}
                        onChange={(e) => handleDateTimeChange('from', e.target.value)}
                        disabled={disabled}
                    />
                </Field>
                <Field className="flex-1">
                    <FieldLabel>To Date & Time</FieldLabel>
                    <Input
                        type="datetime-local"
                        value={value.to}
                        onChange={(e) => handleDateTimeChange('to', e.target.value)}
                        disabled={disabled}
                    />
                </Field>
            </div>
        );
    }

    return (
        <div className="flex gap-2">
            <Field className="flex-1">
                <FieldLabel>From Date</FieldLabel>
                <DatePicker
                    value={value.from}
                    onChange={handleFromChange}
                    disabled={disabled}
                /* disabledDays={[
                    { after: today },
                    ...(toDate ? [{ after: toDate }] : [])
                ]} */
                />
            </Field>
            <Field className="flex-1">
                <FieldLabel>To Date</FieldLabel>
                <DatePicker
                    value={value.to}
                    onChange={handleToChange}
                    disabled={disabled}
                    disabledDays={[
                        { after: today },
                        ...(fromDate ? [{ before: fromDate }] : [])
                    ]}
                />
            </Field>
        </div>
    );
}
