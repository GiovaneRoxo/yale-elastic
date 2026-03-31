import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import PartsList from "@/components/PartsList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type MachineCatalog = {
  id: string;
  model: string;
  machinesLabel: string;
  categoryId: string;
  categoryName: string;
};

export default function Index() {
  const [selectedMachine, setSelectedMachine] = useState<MachineCatalog | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const { toast } = useToast();

  const { data: catalogs = [], isLoading, isError } = useQuery({
    queryKey: ["catalogs"],
    queryFn: async () => {
      const response = await api.get("/api/catalogs");
      return response.data as Array<{
        modelo_catalogo: string;
        maquinas_relacionadas: string[];
      }>;
    },
  });

  const availableMachines: MachineCatalog[] = useMemo(
    () =>
      catalogs.map((item, index) => ({
        id: `${item.modelo_catalogo}-${index}`.toLowerCase().replace(/\s+/g, "-"),
        model: item.modelo_catalogo,
        machinesLabel: (item.maquinas_relacionadas || []).join(", ") || "Sem máquinas vinculadas",
        categoryId: item.modelo_catalogo.toLowerCase().replace(/\s+/g, "-"),
        categoryName: `Catálogo ${item.modelo_catalogo}`,
      })),
    [catalogs]
  );

  const filteredMachines = useMemo(() => {
    const term = catalogSearch.trim().toLowerCase();
    if (!term) return availableMachines;

    return availableMachines.filter(
      (machine) =>
        machine.model.toLowerCase().includes(term) ||
        machine.machinesLabel.toLowerCase().includes(term)
    );
  }, [availableMachines, catalogSearch]);

  const handleAiSearchClick = () => {
    toast({
      title: "Pesquisa avançada com IA",
      description: "Esta ferramenta está em construção.",
    });
  };

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

            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Pesquisar por modelo ou máquina..."
                className="pl-10"
              />
            </div>

            <div className="max-w-xl mx-auto text-left">
              <Button
                onClick={handleAiSearchClick}
                variant="outline"
                size="sm"
                className="gap-2 border-indigo-200 bg-indigo-50/50 text-indigo-700"
              >
                <Sparkles className="h-4 w-4" />
                Pesquisa avançada com IA
              </Button>
            </div>

            <div className="grid gap-3 max-w-xl mx-auto">
              {isLoading && (
                <p className="text-sm text-muted-foreground text-center">Carregando catálogos...</p>
              )}

              {isError && (
                <p className="text-sm text-red-600 text-center">
                  Não foi possível carregar os catálogos.
                </p>
              )}

              {!isLoading && !isError && filteredMachines.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Nenhum catálogo encontrado para a busca.
                </p>
              )}

              {filteredMachines.map((machine) => (
                <Button
                  key={machine.id}
                  variant="outline"
                  className="justify-start text-left h-auto py-4 px-4"
                  onClick={() => setSelectedMachine(machine)}
                >
                  <div>
                    <p className="font-semibold">{machine.model}</p>
                    <p className="text-xs text-muted-foreground">{machine.machinesLabel}</p>
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