import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import PartsList from "@/components/PartsList";
import { Button } from "@/components/ui/button";

type MachineCatalog = {
  id: string;
  model: string;
  categoryId: string;
  categoryName: string;
};

export default function Index() {
  const [selectedMachine, setSelectedMachine] = useState<MachineCatalog | null>(null);

  // Hoje só temos o A975, mas já deixamos preparado para incluir novos catálogos.
  const availableMachines: MachineCatalog[] = [
    {
      id: "a975",
      model: "Yale A975 (Elasticsearch)",
      categoryId: "geral",
      categoryName: "Catálogo Completo",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        {selectedMachine ? (
          <PartsList 
            machineId={selectedMachine.id}
            machineModel={selectedMachine.model}
            categoryId={selectedMachine.categoryId}
            categoryName={selectedMachine.categoryName}
            onBack={() => setSelectedMachine(null)}
          />
        ) : (
          <div className="text-center py-20 space-y-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4">
              Modo de Seleção de Máquinas
            </h2>
            <p className="text-gray-500">
              Selecione a máquina para abrir o catálogo correspondente.
            </p>

            <div className="grid gap-3 max-w-xl mx-auto">
              {availableMachines.map((machine) => (
                <Button
                  key={machine.id}
                  variant="outline"
                  className="justify-start text-left h-auto py-4 px-4"
                  onClick={() => setSelectedMachine(machine)}
                >
                  <div>
                    <p className="font-semibold">{machine.model}</p>
                    <p className="text-xs text-muted-foreground">{machine.categoryName}</p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}