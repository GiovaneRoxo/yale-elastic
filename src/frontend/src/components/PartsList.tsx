import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Package, Copy, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Props {
  machineId: string;
  machineModel: string;
  categoryId: string;
  categoryName: string;
  onBack: () => void;
}

export default function PartsList({ machineModel, categoryName, onBack }: Props) {
  // Usamos o nome da categoria como busca inicial para não vir vazio
  const [searchInput, setSearchInput] = useState(categoryName);
  const [debouncedSearch, setDebouncedSearch] = useState(categoryName);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  // Debounce: espera o utilizador parar de digitar por 500ms antes de bater na API
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Busca no FastAPI + Elasticsearch
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['parts', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return { total: 0, data: [] }; 
      
      const response = await api.get('/api/parts', {
        params: {
          q: debouncedSearch,
          limit: 50
        }
      });
      return response.data; 
    },
    enabled: debouncedSearch.length > 0,
  });

  // O response.data do FastAPI já traz um objeto com a chave "data" contendo o array
  const parts = data?.data || [];

  const copyPartNumber = (partNumber: string, partId: string) => {
    if (!partNumber) return;
    navigator.clipboard.writeText(partNumber);
    setCopiedId(partId);
    toast({ title: 'Código copiado!', description: partNumber });
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{categoryName}</h2>
          <p className="text-muted-foreground">Modelo: <span className="font-semibold text-foreground">{machineModel}</span></p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar no Elasticsearch..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="pl-10"
        />
      </div>

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Falha ao conectar na API."}
          </AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : parts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma peça encontrada.</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold">Código</TableHead>
                <TableHead className="font-bold">Descrição</TableHead>
                <TableHead className="font-bold text-center">Seção</TableHead>
                <TableHead className="font-bold text-center">Qtd.</TableHead>
                <TableHead className="font-bold">Obs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((p: any, index: number) => {
                // Usa o ref ou o índice como fallback para a chave única
                const uniqueId = p.ref || String(index); 
                return (
                  <TableRow key={uniqueId} className="hover:bg-muted/30">
                    <TableCell>
                      <button
                        onClick={() => copyPartNumber(p.codigo, uniqueId)}
                        className="flex items-center gap-1.5 font-mono font-semibold text-primary hover:text-secondary transition-colors disabled:opacity-50"
                        disabled={!p.codigo}
                      >
                        {p.codigo || 'S/N'}
                        {copiedId === uniqueId ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 opacity-40" />}
                      </button>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-foreground">{p.descricao || 'Sem descrição'}</p>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{p.secao || '—'}</TableCell>
                    <TableCell className="text-center font-medium">{p.qtd || '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.obs || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}