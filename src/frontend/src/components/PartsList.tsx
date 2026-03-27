import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';
import { ArrowLeft, Search, Package, Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  machineId: string;
  machineModel: string;
  categoryId: string;
  categoryName: string;
  onBack: () => void;
}

export default function PartsList({ machineId, machineModel, categoryId, categoryName, onBack }: Props) {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: parts, isLoading } = useQuery({
    queryKey: ['parts', machineId, categoryId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('machine_parts')
        .select(`
          quantity_per_machine,
          notes,
          parts!inner(
            id, part_number, name, description, unit, image_url,
            category_id
          )
        `)
        .eq('machine_id', machineId)
        .eq('parts.category_id', categoryId);

      if (error) throw error;
      return data;
    },
  });

  const filtered = parts?.filter(mp => {
    const p = mp.parts as any;
    const q = search.toLowerCase();
    return p.part_number.toLowerCase().includes(q) || p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q));
  });

  const copyPartNumber = (partNumber: string, partId: string) => {
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
          placeholder="Buscar por código ou nome da peça..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma peça encontrada</p>
        </div>
      ) : (
        <div className="rounded-lg border bg-card overflow-hidden industrial-shadow">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-bold">Código</TableHead>
                <TableHead className="font-bold">Descrição</TableHead>
                <TableHead className="font-bold text-center">Un.</TableHead>
                <TableHead className="font-bold text-center">Qtd/Máq.</TableHead>
                <TableHead className="font-bold">Obs.</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered?.map(mp => {
                const p = mp.parts as any;
                return (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell>
                      <button
                        onClick={() => copyPartNumber(p.part_number, p.id)}
                        className="flex items-center gap-1.5 font-mono font-semibold text-primary hover:text-secondary transition-colors"
                      >
                        {p.part_number}
                        {copiedId === p.id ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5 opacity-40" />}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{p.name}</p>
                        {p.description && <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">{p.unit}</TableCell>
                    <TableCell className="text-center font-medium">{mp.quantity_per_machine || 1}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{mp.notes || '—'}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered?.length || 0} peça(s) encontrada(s) • Clique no código para copiar
      </p>
    </div>
  );
}
