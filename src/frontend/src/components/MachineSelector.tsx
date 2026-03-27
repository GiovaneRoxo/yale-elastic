import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search, Truck, Fuel, Weight, Hash } from 'lucide-react';

interface Props {
  onSelect: (machineId: string, model: string) => void;
}

export default function MachineSelector({ onSelect }: Props) {
  const [search, setSearch] = useState('');

  const { data: machines, isLoading } = useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const { data, error } = await supabase.from('machines').select('*').order('model');
      if (error) throw error;
      return data;
    },
  });

  const filtered = machines?.filter(m =>
    m.model.toLowerCase().includes(search.toLowerCase()) ||
    m.brand.toLowerCase().includes(search.toLowerCase()) ||
    (m.serial_prefix && m.serial_prefix.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Selecione o Modelo</h2>
        <p className="text-muted-foreground">Escolha o modelo da empilhadeira para consultar as peças disponíveis</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por modelo, marca ou série..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered?.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum modelo encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered?.map(machine => (
            <Card
              key={machine.id}
              className="p-5 cursor-pointer card-hover border-2 border-transparent hover:border-secondary/50"
              onClick={() => onSelect(machine.id, machine.model)}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Truck className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground truncate">{machine.brand} {machine.model}</h3>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {machine.capacity && (
                      <div className="flex items-center gap-1.5"><Weight className="h-3 w-3" />{machine.capacity}</div>
                    )}
                    {machine.fuel_type && (
                      <div className="flex items-center gap-1.5"><Fuel className="h-3 w-3" />{machine.fuel_type}</div>
                    )}
                    {machine.serial_prefix && (
                      <div className="flex items-center gap-1.5"><Hash className="h-3 w-3" />Série: {machine.serial_prefix}</div>
                    )}
                    {machine.year_range && (
                      <div className="text-xs text-muted-foreground/70">{machine.year_range}</div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
