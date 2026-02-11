import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RangeDatePicker } from '@/components/ui/range-date-picker';
import { useForfeitStore } from '@/app/feature/pawns/forfeit/stores/forfeitStore';

export const LayawayForfeitSearchBar = ({ searchLayaways, loading }: { searchLayaways: (criteria: any) => Promise<void>, loading: boolean }) => {
    const { resetSelectedPawn } = useForfeitStore();
    const { searchCriteria, setSearchCriteria } = useForfeitStore();

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        resetSelectedPawn();
        searchLayaways({
            from: searchCriteria.from,
            to: searchCriteria.to,
            ticketNumber: searchCriteria.ticketNumber
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-end gap-2">
                <RangeDatePicker
                    value={{ from: searchCriteria.from, to: searchCriteria.to }}
                    onChange={(range) => setSearchCriteria({
                        from: range?.from ? (range.from instanceof Date ? range.from.toISOString().split('T')[0] : range.from) : '',
                        to: range?.to ? (range.to instanceof Date ? range.to.toISOString().split('T')[0] : range.to) : ''
                    })}
                />
                <Button type="button" onClick={() => handleSearch()} disabled={loading}>
                    {loading ? 'Searching...' : 'Search'}
                </Button>
            </div>

            <div className="grid grid-cols-2">
                <Field>
                    <FieldLabel>Ticket #</FieldLabel>
                    <Input
                        value={searchCriteria.ticketNumber}
                        onChange={(e) => setSearchCriteria({ ticketNumber: e.target.value })}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleSearch();
                            }
                        }}
                        placeholder="Enter ticket number"
                    />
                </Field>
            </div>
        </div>
    );
};
