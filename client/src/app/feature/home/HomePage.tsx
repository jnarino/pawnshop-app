import { Card } from '@/components/ui/card';
import HandshakeIcon from '@/assets/icons/handshake.svg?react';
import SellIcon from '@/assets/icons/sell.svg?react';
import MoneyBagIcon from '@/assets/icons/money_bag.svg?react';
import ChartReportsIcon from '@/assets/icons/chart_reports.svg?react';
import { ActionCard } from '@/components/ui/ActionCard';

export default function HomePage() {
    return (
        <>
            <h1 className="text-2xl font-extrabold mb-2.5">Welcome back 👋</h1>
            <p className="mb-6 text-gray-700">Choose an action to get started.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <ActionCard
                    icon={HandshakeIcon}
                    subtitle="Pawn / Buy"
                    title="Pawn"
                    to="/pawns"
                />
                <ActionCard
                    icon={MoneyBagIcon}
                    subtitle="Pay Pawn"
                    title="Payments"
                    to="/payments"
                />
                <ActionCard
                    icon={SellIcon}
                    subtitle="Sale"
                    title="Sales"
                    to="/sales"
                />
                <ActionCard
                    icon={SellIcon}
                    subtitle="Layaway"
                    title="Layaways"
                    to="/sales/layaway"
                />
                <ActionCard
                    icon={ChartReportsIcon}
                    subtitle="View Reports"
                    title="Reports"
                    to="/reports"
                />
            </div>
            <section className="mt-7">
                <div className="font-bold mb-3">Recent activity</div>
                <Card className="p-4">
                    <p className="text-gray-500">No recent items yet.</p>
                </Card>
            </section>
        </>
    );
}