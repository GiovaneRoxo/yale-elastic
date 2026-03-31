import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Package, Copy, Check, AlertCircle, Eye, X } from 'lucide-react';
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
  const [searchInput, setSearchInput] = useState(categoryName);
  const [debouncedSearch, setDebouncedSearch] = useState(categoryName);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // NOVO: Estado para controlar a imagem aberta no Popup
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

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

  const parts = data?.data || [];

  const copyPartNumber = (partNumber: string, partId: string) => {
    if (!partNumber) return;
    navigator.clipboard.writeText(partNumber);
    setCopiedId(partId);
    toast({ title: 'Código copiado!', description: partNumber });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // NOVO: O "Cérebro" que desempacota a quantidade
  const formatQuantity = (qtd: any) => {
    if (!qtd) return '—';
    
    // Se por acaso vier como string ou numero simples, só devolve
    if (typeof qtd === 'string' || typeof qtd === 'number') return qtd;

    // Se vier como objeto (o formato do seu JSON)
    if (typeof qtd === 'object') {
      if (qtd.tipo === 'unica') {
        return <span className="font-medium text-foreground">{qtd.valor || '—'}</span>;
      }
      
      if (qtd.tipo === 'multipla') {
        return (
          <div className="flex flex-col gap-1 text-xs text-left inline-block bg-muted/30 p-1.5 rounded-md border border-border/50">
            {qtd.A && qtd.A !== '-' && <span><strong className="text-foreground">A:</strong> {qtd.A}</span>}
            {qtd.B && qtd.B !== '-' && <span><strong className="text-foreground">B:</strong> {qtd.B}</span>}
            {qtd.C && qtd.C !== '-' && <span><strong className="text-foreground">C:</strong> {qtd.C}</span>}
          </div>
        );
      }
    }
    return '—';
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
          placeholder="Buscar peças..."
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
                <TableHead className="font-bold text-center w-24">Qtd.</TableHead>
                <TableHead className="font-bold">Obs.</TableHead>
                <TableHead className="font-bold text-center">Imagem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((p: any, index: number) => {
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
                    
                    {/* Aqui nós chamamos a inteligência da quantidade */}
                    <TableCell className="text-center align-middle">
                      {formatQuantity(p.quantidade)}
                    </TableCell>
                    
                    <TableCell className="text-sm text-muted-foreground">{p.obs || '—'}</TableCell>
                    
                    {/* NOVO: Botão para abrir o Popup da Imagem */}
                    <TableCell className="text-center">
                      {p.imagem_ref ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-1"
                          onClick={() => setSelectedImage(p.imagem_ref)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden xl:inline">Ver</span>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground opacity-50">S/ Img</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* NOVO: O Popup (Modal) da Imagem */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)} // Fecha ao clicar fora
        >
          <div 
            className="relative bg-background rounded-lg border shadow-2xl max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()} // Impede que o clique dentro da imagem feche o popup
          >
            {/* Cabecalho do Modal */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <span className="text-sm font-medium text-muted-foreground truncate pr-4">
                {selectedImage}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full hover:bg-destructive hover:text-destructive-foreground transition-colors"
                onClick={() => setSelectedImage(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Área da Imagem em si */}
            <div className="p-4 overflow-auto flex items-center justify-center bg-zinc-100 dark:bg-zinc-950">
              {/* O React tenta buscar a imagem no caminho absoluto do site */}
              <img 
                src={`/${selectedImage}`} 
                alt="Diagrama da peça" 
                className="max-w-full max-h-[75vh] object-contain rounded-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/600x400/1a2332/FFF?text=Imagem+N%C3%A3o+Encontrada';
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}