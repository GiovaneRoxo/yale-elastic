import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import makenaIcon from '@/assets/makena-icon.png';

export default function AppHeader() {
  const { profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="gradient-hero border-b border-border/10 sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-3">
          <img src={makenaIcon} alt="Grupo Makena" className="h-8" />
          <span className="text-sm font-bold text-primary-foreground/60 hidden sm:inline">|</span>
          <span className="text-lg font-black text-primary-foreground tracking-tight hidden sm:inline">
            Peça <span className="text-gradient-brand">Certa</span>
          </span>
        </button>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-sm text-primary-foreground/70">
            <User className="h-4 w-4" />
            <span>{profile?.full_name || 'Usuário'}</span>
            <span className="px-2 py-0.5 rounded-full bg-secondary/20 text-xs font-medium uppercase">
              {role}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10">
            <LogOut className="h-4 w-4 mr-1" />
            Sair
          </Button>
        </div>
      </div>
    </header>
  );
}
