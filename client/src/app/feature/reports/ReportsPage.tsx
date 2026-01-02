import { Link } from 'react-router-dom';
import { ActionCard } from "@/components/ui/ActionCard";
import PoliceIcon from '@/assets/icons/police.svg?react';
import { Coins, ArrowBigLeft, ArrowDownToLine } from 'lucide-react';


export default function ReportsPage() {
  return <>
    <Link to="/" className="block transition-transform  outline-none">
      <ArrowBigLeft className="w-10 h-10" />
    </Link>
    <h1 className="text-2xl font-extrabold mb-2.5">Reports</h1>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-6">
      <ActionCard
        icon={ArrowDownToLine}
        subtitle="Pull items"
        title="Forfeit (pull)"
        to="/pawns/forfeit"
      />
      <ActionCard
        icon={PoliceIcon}
        subtitle="Police"
        title="Police"
        to="/reports/police"
      />
      <ActionCard
        icon={Coins}
        subtitle="Daily report"
        title="Daily report"
        to="/reports/daily"
      />
    </div>
  </>
}