import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import type { Customer } from '@/app/feature/_shared/customer';
import { customerApi } from '@/app/core/api/customerApi';
import { Loader2 } from 'lucide-react';

interface CustomerPerformanceTabProps {
  customer: Customer | null;
}

interface CustomerStatistics {
  activePawns: number;
  redeemedPawns: number;
  defaultedPawns: number;
  buys: number;
  redemptionRatio: number;
  defaultRatio: number;
  totalSalesAmount: number;
}

export default function CustomerPerformanceTab({ customer }: Readonly<CustomerPerformanceTabProps>) {
  const [stats, setStats] = useState<CustomerStatistics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customer?.id) {
      const fetchStats = async () => {
        setLoading(true);
        try {
          const data = await customerApi.getStatistics(customer.id);
          setStats(data);
        } catch (error) {
          console.error('Failed to fetch customer statistics:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [customer?.id]);

  const performanceData = [
    { label: 'Active', value: stats?.activePawns ?? 0 },
    { label: 'Redeemed', value: stats?.redeemedPawns ?? 0 },
    { label: 'Defaulted', value: stats?.defaultedPawns ?? 0 },
    { label: 'Buys', value: stats?.buys ?? 0 },
    { label: 'Redemption Ratio', value: `${stats?.redemptionRatio ?? 0}%` },
    { label: 'Default Ratio', value: `${stats?.defaultRatio ?? 0}%` },
    { label: 'Sales Amount', value: stats?.totalSalesAmount ? `$${stats.totalSalesAmount.toFixed(2)}` : '$0.00' },
  ];

  const customerName = customer
    ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Unknown Customer'
    : 'No Customer Selected';

  return (
    <div className="h-full w-full flex flex-col p-6">
      <div className="max-w-2xl mx-auto w-full space-y-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          This section provides a comprehensive overview of the customer's activity history with the store,
          including active loans, redemptions, purchases, and performance ratios.
        </p>

        <Table>
          <TableBody>
            <TableRow>
              <TableCell colSpan={2} className="font-semibold text-lg text-center">
                {customerName}
              </TableCell>
            </TableRow>
            {performanceData.map((item) => (
              <TableRow key={item.label}>
                <TableCell className="font-medium">{item.label}</TableCell>
                <TableCell className="text-right">{item.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex justify-center pt-4">
          <Button onClick={() => console.log('Print functionality to be implemented')}>
            Print
          </Button>
        </div>
      </div>
    </div>
  );
}
