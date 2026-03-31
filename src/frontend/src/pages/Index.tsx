import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import PartsList from "@/components/PartsList"; // O nosso catálogo refatorado

export default function Index() {
  // Estado temporário para simular a navegação
  const [showCatalog, setShowCatalog] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        {showCatalog ? (
          <PartsList 
            machineId="bypass-id" 
            machineModel="Yale A975 (Elasticsearch)" 
            categoryId="geral" 
            categoryName="Catálogo Completo" 
            onBack={() => setShowCatalog(false)} 
          />
        ) : (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              Modo de Seleção de Máquinas
            </h2>
            <p className="text-gray-500 mb-8">
              A API de listagem de máquinas ainda não foi construída no FastAPI. 
              Para testar a busca, clique no botão abaixo.
            </p>
            <button 
              onClick={() => setShowCatalog(true)}
              className="px-6 py-3 bg-primary text-white font-bold rounded-lg shadow hover:bg-primary/90 transition-colors"
            >
              Abrir Catálogo Direto
            </button>
          </div>
        )}
      </main>
    </div>
  );
}