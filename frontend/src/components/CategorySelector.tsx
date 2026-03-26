import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Cog, Zap, Droplets, Disc, Shield, Package, Gauge, Wrench } from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  motor: <Cog className="h-6 w-6" />,
  eletrica: <Zap className="h-6 w-6" />,
  hidraulica: <Droplets className="h-6 w-6" />,
  freio: <Disc className="h-6 w-6" />,
  carroceria: <Shield className="h-6 w-6" />,
  transmissao: <Gauge className="h-6 w-6" />,
  default: <Package className="h-6 w-6" />,
};

interface Props {
  machineId: string;
  machineModel: string;
  onSelect: (categoryId: string, categoryName: string) => void;
  onBack: () => void;
}

export default function CategorySelector({ machineId, machineModel, onSelect, onBack }: Props) {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories-for-machine', machineId],
    queryFn: async () => {
      // Get categories that have parts for this machine
      const { data, error } = await supabase
        .from('part_categories')
        .select(`
          *,
          parts!inner(
            machine_parts!inner(machine_id)
          )
        `)
        .eq('parts.machine_parts.machine_id', machineId)
        .order('sort_order');

      if (error) {
        // Fallback: get all categories
        const { data: allCats, error: err2 } = await supabase.from('part_categories').select('*').order('sort_order');
        if (err2) throw err2;
        return allCats;
      }
      // Deduplicate
      const unique = data.filter((cat, idx, arr) => arr.findIndex(c => c.id === cat.id) === idx);
      return unique;
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Categorias de Peças</h2>
          <p className="text-muted-foreground">Modelo: <span className="font-semibold text-foreground">{machineModel}</span></p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : categories?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma categoria encontrada para este modelo</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {categories?.map(cat => (
            <Card
              key={cat.id}
              className="p-5 cursor-pointer card-hover text-center border-2 border-transparent hover:border-secondary/50"
              onClick={() => onSelect(cat.id, cat.name)}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                {iconMap[cat.icon || 'default'] || iconMap.default}
              </div>
              <h3 className="font-semibold text-foreground text-sm">{cat.name}</h3>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
