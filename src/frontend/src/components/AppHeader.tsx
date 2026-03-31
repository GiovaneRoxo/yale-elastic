import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User } from "lucide-react";
import makenaIcon from "@/assets/makena-icon.png";

export default function AppHeader() {
  const { signOut, user } = useAuth(); // <-- AGORA IMPORTAMOS O 'user' AQUI
  const navigate = useNavigate();

  const getFirstName = (fullName: string | undefined) => {
    if (!fullName) return "Usuário"; // Fallback de segurança
    return fullName.trim().split(' ')[0];
  };

  return (
    <header className="bg-[#1a2332] text-white sticky top-0 z-10 shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Logo e Título (Design Original) */}
        <div 
          className="flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80" 
          onClick={() => navigate("/")}
        >
          <img src={makenaIcon} alt="Makena" className="h-8 object-contain" />
          <div className="h-5 w-px bg-white/20 hidden sm:block"></div>
          <h1 className="text-xl font-bold hidden sm:flex items-center gap-2">
            Peça <span className="text-[#ffc107]">Certa</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-2 text-sm text-gray-300 font-medium">
            <User className="h-4 w-4" />
            <span>{getFirstName(user?.name)}</span>
          </div>
          
          <button 
            onClick={signOut} 
            className="flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}