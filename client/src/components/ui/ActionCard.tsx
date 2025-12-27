import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Link } from 'react-router-dom';

export const ActionCard = ({
    to,
    title,
    subtitle,
    icon: Icon,
}: {
    to: string;
    title: string;
    subtitle: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}) => {
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