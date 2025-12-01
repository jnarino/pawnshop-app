import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import HandshakeIcon from '@/assets/icons/handshake.svg?react';
import SellIcon from '@/assets/icons/sell.svg?react';
import MoneyBagIcon from '@/assets/icons/money_bag.svg?react';
import BurgerMenu from '../../shared/components/BurgerMenu';

function ActionCard({
    to,
    title,
    subtitle,
    icon: Icon,
}: {
    to: string;
    title: string;
    subtitle: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) {
    return (
        <Link to={to} className="block transition-transform hover:scale-105 focus:scale-105 outline-none">
            <Card className="h-full border-2 hover:border-cyan-500 hover:shadow-lg transition-all duration-200 cursor-pointer">
                <CardHeader className="flex flex-col items-center justify-center space-y-4 p-8">
                    <div className="w-16 h-16 flex items-center justify-center">
                        <Icon className="w-full h-full fill-gray-700" />
                    </div>
                    <div className="text-center space-y-1">
                        <CardTitle className="text-xl font-bold">{title}</CardTitle>
                        <CardDescription className="text-sm">{subtitle}</CardDescription>
                    </div>
                </CardHeader>
            </Card>
        </Link>
    );
}

export default function HomePage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-gray-900 text-white py-5 px-7 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-green-500 to-cyan-500" />
                    <div className="font-extrabold tracking-wide">PawnExpress</div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="opacity-85">
                        {new Date().toLocaleString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                        })}
                    </div>
                    <BurgerMenu />
                </div>
            </header>

            <main className="py-7 px-7 max-w-[1100px] w-full mx-auto">
                <h1 className="text-2xl font-extrabold mb-2.5">Welcome back 👋</h1>
                <p className="mb-6 text-gray-700">Choose an action to get started.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    <ActionCard 
                        to="/pawns" 
                        title="Pawn" 
                        subtitle="Pawn / Buy" 
                        icon={HandshakeIcon}
                    />
                    <ActionCard 
                        to="/Payments" 
                        title="Payments" 
                        subtitle="Pay Pawn" 
                        icon={MoneyBagIcon}
                    />
                    <ActionCard 
                        to="/Sales" 
                        title="Sales" 
                        subtitle="Sale" 
                        icon={SellIcon}
                    />
                </div>

                <section className="mt-7">
                    <div className="font-bold mb-3">Recent activity</div>
                    <Card className="p-4">
                        <p className="text-gray-500">No recent items yet.</p>
                    </Card>
                </section>
            </main>
        </div>
    );
}