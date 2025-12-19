import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, DollarSign } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import ManageCashDialog from '@/app/feature/admin/components/ManageCashDialog';

export default function BurgerMenu() {
  const navigate = useNavigate();
  const [cashDialogOpen, setCashDialogOpen] = useState(false);

  const handleLogout = () => {
    navigate('/logout');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
            <Menu className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setCashDialogOpen(true)} className="cursor-pointer">
            <DollarSign className="mr-2 h-4 w-4" />
            <span>Manage Cash</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ManageCashDialog open={cashDialogOpen} onOpenChange={setCashDialogOpen} />
    </>
  );
}
