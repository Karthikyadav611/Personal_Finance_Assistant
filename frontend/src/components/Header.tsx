
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Calculator, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onTabChange: (tab: string) => void;
}

export const Header = ({ searchTerm, setSearchTerm, onTabChange }: HeaderProps) => {
  const navigate = useNavigate();
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      onTabChange("transactions");
    }
  };

  const openTabFromAccounts = (tab: string) => {
    onTabChange(tab);
    setIsAccountsOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAccountsOpen(false);
    navigate("/login");
  };

  return (
    <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg cursor-pointer" onClick={() => navigate('/')}>
              <Calculator className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white cursor-pointer" onClick={() => navigate('/')}>FinanceGPT</h1>
            <Badge variant="secondary" className="bg-green-600/20 text-green-400 border-green-600/30">
              Personal Finance
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search transactions, categories..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 w-64 bg-slate-800 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-600 text-black hover:bg-slate-700"
              onClick={() => setIsAccountsOpen(true)}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Accounts
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isAccountsOpen} onOpenChange={setIsAccountsOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Accounts Workspace</DialogTitle>
            <DialogDescription className="text-slate-400">
              Jump to the area you want to work in or sign out of the current account.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => openTabFromAccounts("dashboard")}>
              Open Overview
            </Button>
            <Button variant="outline" className="border-slate-600 text-black hover:bg-slate-800" onClick={() => openTabFromAccounts("budget")}>
              Manage Budgets
            </Button>
            <Button variant="outline" className="border-slate-600 text-black hover:bg-slate-800" onClick={() => openTabFromAccounts("transactions")}>
              Review Transactions
            </Button>
            <Button variant="outline" className="border-slate-600 text-black hover:bg-slate-800" onClick={() => openTabFromAccounts("assistant")}>
              Open Assistant
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
              Log Out
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
};
