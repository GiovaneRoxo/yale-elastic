import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Copy, Check, Eye, X, Sparkles, Bot } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createPortal } from 'react-dom';

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSearchingAi, setIsSearchingAi] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setAiSummary(null);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data } = useQuery({
    queryKey: ['parts', debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return { total: 0, data: [] };
      const response = await api.get('/api/parts', {
        params: { q: debouncedSearch, limit: 50 }
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

  const formatQuantity = (qtd: any) => {
    if (!qtd) return '—';
    if (typeof qtd === 'object') {
      if (qtd.tipo === 'unica') return qtd.valor || '—';
      if (qtd.tipo === 'multipla') {
        return (
          <div className="flex flex-col gap-0.5 text-[10px] text-left leading-tight">
            {qtd.A && <span><strong>A:</strong> {qtd.A}</span>}
            {qtd.B && <span><strong>B:</strong> {qtd.B}</span>}
            {qtd.C && <span><strong>C:</strong> {qtd.C}</span>}
          </div>
        );
      }
    }
    return qtd;
  };

  const handleAiSearch = async () => {
    setIsSearchingAi(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAiSummary(`Análise para "${searchInput}": Itens compatíveis com a série ${machineModel}.`);
    setIsSearchingAi(false);
  };

  return (
    <div className="space-y-6 animate-fade-in relative w-full">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{categoryName}</h2>
          <p className="text-muted-foreground">Modelo: <span className="font-semibold text-foreground">{machineModel}</span></p>
        </div>
      </div>

      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm pb-4 pt-2 space-y-3 border-b">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar peças..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="pl-10 shadow-sm"
          />
        </div>
        <Button onClick={handleAiSearch} disabled={isSearchingAi} variant="outline" size="sm" className="gap-2 border-indigo-200 bg-indigo-50/50 text-indigo-700">
          <Sparkles className="h-4 w-4" />
          {isSearchingAi ? 'Analisando...' : 'Pesquisar com IA'}
        </Button>
      </div>

      {aiSummary && (
        <Alert className="bg-indigo-50 border-indigo-200">
          <Bot className="h-5 w-5 text-indigo-600" />
          <AlertDescription>{aiSummary}</AlertDescription>
        </Alert>
      )}

      {/* Ajuste Final: Layout Fluido sem Scroll Horizontal Forçado */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden w-full">
        <div className="w-full">
          {/* Removi o min-w fixo e table-fixed para a tabela se ajustar ao seu monitor */}
          <Table className="w-full border-collapse">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold whitespace-nowrap">Código</TableHead>
                <TableHead className="font-bold">Descrição</TableHead>
                <TableHead className="font-bold text-center">Ref.</TableHead>
                <TableHead className="font-bold text-center">Pág.</TableHead>
                <TableHead className="font-bold text-center">Seção</TableHead>
                <TableHead className="font-bold text-center">Qtd.</TableHead>
                <TableHead className="font-bold">Obs.</TableHead>
                <TableHead className="font-bold text-center">Imagem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((p: any, index: number) => {
                const partId = p.ref || String(index);
                const isCopied = copiedId === partId;

                return (
                  <TableRow key={partId} className="hover:bg-muted/30">
                    <TableCell>
                      <button 
                        onClick={() => copyPartNumber(p.codigo, partId)} 
                        className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-primary"
                      >
                        <span className="whitespace-nowrap">{p.codigo || 'S/N'}</span>
                        {isCopied ? <Check className="h-3 w-3 text-green-500 shrink-0" /> : <Copy className="h-3 w-3 opacity-30 shrink-0" />}
                      </button>
                    </TableCell>
                    
                    <TableCell>
                      <p className="font-medium text-xs leading-tight line-clamp-2" title={p.descricao}>
                        {p.descricao || 'Sem descrição'}
                      </p>
                    </TableCell>

                    <TableCell className="text-center text-muted-foreground text-xs">{p.ref || '—'}</TableCell>
                    <TableCell className="text-center text-muted-foreground text-xs">{p.pagina || '—'}</TableCell>
                    <TableCell className="text-center text-muted-foreground text-xs">{p.secao || '—'}</TableCell>
                    <TableCell className="text-center text-xs">{formatQuantity(p.quantidade)}</TableCell>
                    
                    <TableCell>
                      <p className="text-[11px] text-muted-foreground leading-tight line-clamp-2" title={p.obs}>
                        {p.obs || '—'}
                      </p>
                    </TableCell>

                    <TableCell className="text-center">
                      {p.imagem_ref ? (
                        <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedImage(p.imagem_ref)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : (
                        <span className="text-[10px] text-muted-foreground opacity-40">S/ Img</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedImage && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative w-full max-w-5xl bg-background rounded-xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-3 border-b flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{selectedImage}</span>
              <Button variant="ghost" size="icon" onClick={() => setSelectedImage(null)}><X className="h-4 w-4" /></Button>
            </div>
            <div className="p-4 bg-zinc-100 flex justify-center overflow-auto max-h-[80vh]">
              <img 
                src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/${selectedImage}`} 
                className="max-w-full h-auto object-contain" 
                onError={(e) => (e.currentTarget.src = 'https://placehold.co/600x400?text=Erro+na+Imagem')}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}