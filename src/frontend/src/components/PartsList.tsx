import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Copy, Check, Eye, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createPortal } from 'react-dom';

interface Props {
  machineId: string;
  machineModel: string;
  categoryId: string;
  categoryName: string;
  onBack: () => void;
}

export default function PartsList({ machineModel, categoryName, onBack }: Props) {
  const [searchInput, setSearchInput] = useState(machineModel);
  const [debouncedSearch, setDebouncedSearch] = useState(machineModel);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
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

  return (
    /* O 'max-w-full' e 'overflow-hidden' no pai são essenciais */
    <div className="space-y-6 animate-fade-in relative w-full max-w-full overflow-hidden px-1">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-foreground truncate">{categoryName}</h2>
          <p className="text-muted-foreground truncate">Modelo: <span className="font-semibold text-foreground">{machineModel}</span></p>
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
      </div>

      {/* SOLUÇÃO DEFINITIVA: table-fixed com larguras percentuais e quebra de linha interna */}
      <div className="rounded-xl border bg-card shadow-sm w-full overflow-hidden">
        <Table className="w-full table-fixed">
          
          <TableHeader>
            <TableRow className="bg-muted/60">
              <TableHead className="w-[12%] text-xs font-semibold">Código</TableHead>
              <TableHead className="w-[32%] text-xs font-semibold">Descrição</TableHead>
              <TableHead className="w-[6%] text-center text-xs">Ref.</TableHead>
              <TableHead className="w-[6%] text-center text-xs">Pág.</TableHead>
              <TableHead className="w-[14%] text-center text-xs">Seção</TableHead>
              <TableHead className="w-[8%] text-center text-xs">Qtd.</TableHead>
              <TableHead className="w-[16%] text-xs">Obs.</TableHead>
              <TableHead className="w-[6%] text-center text-xs">Img</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {parts.map((p: any, index: number) => {
              const partId = p.ref || String(index);
              const isCopied = copiedId === partId;

              return (
                <TableRow
                  key={partId}
                  className="hover:bg-muted/40 odd:bg-muted/10 align-top"
                >
                  {/* Código */}
                  <TableCell className="p-2">
                    <button
                      onClick={() => copyPartNumber(p.codigo, partId)}
                      className="flex items-center gap-1 font-mono text-xs font-semibold text-primary break-all"
                    >
                      {p.codigo || 'S/N'}
                      {isCopied ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3 opacity-30" />
                      )}
                    </button>
                  </TableCell>

                  {/* Descrição */}
                  <TableCell className="p-2">
                    <div className="text-sm leading-snug break-words">
                      {p.descricao || 'Sem descrição'}
                    </div>
                  </TableCell>

                  {/* Ref */}
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {p.ref || '—'}
                  </TableCell>

                  {/* Página */}
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {p.pagina || '—'}
                  </TableCell>

                  {/* Seção */}
                  <TableCell className="text-center text-xs text-muted-foreground">
                    <div className="break-words">
                      {p.secao || '—'}
                    </div>
                  </TableCell>

                  {/* Quantidade */}
                  <TableCell className="text-center text-xs">
                    {formatQuantity(p.quantidade)}
                  </TableCell>

                  {/* Observação */}
                  <TableCell className="p-2">
                    <div className="text-xs text-muted-foreground break-words">
                      {p.obs || '—'}
                    </div>
                  </TableCell>

                  {/* Imagem */}
                  <TableCell className="text-center">
                    {p.imagem_ref && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedImage(p.imagem_ref)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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