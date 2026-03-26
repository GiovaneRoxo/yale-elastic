import { useState } from 'react';
import AppHeader from '@/components/AppHeader';
import MachineSelector from '@/components/MachineSelector';
import CategorySelector from '@/components/CategorySelector';
import PartsList from '@/components/PartsList';

type Step = 'machine' | 'category' | 'parts';

export default function Catalog() {
  const [step, setStep] = useState<Step>('machine');
  const [machineId, setMachineId] = useState('');
  const [machineModel, setMachineModel] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState('');

  const handleMachineSelect = (id: string, model: string) => {
    setMachineId(id);
    setMachineModel(model);
    setStep('category');
  };

  const handleCategorySelect = (id: string, name: string) => {
    setCategoryId(id);
    setCategoryName(name);
    setStep('parts');
  };

  // Breadcrumb
  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
      <button onClick={() => setStep('machine')} className={`hover:text-foreground transition-colors ${step === 'machine' ? 'text-foreground font-semibold' : ''}`}>
        Modelos
      </button>
      {(step === 'category' || step === 'parts') && (
        <>
          <span>/</span>
          <button onClick={() => setStep('category')} className={`hover:text-foreground transition-colors ${step === 'category' ? 'text-foreground font-semibold' : ''}`}>
            {machineModel}
          </button>
        </>
      )}
      {step === 'parts' && (
        <>
          <span>/</span>
          <span className="text-foreground font-semibold">{categoryName}</span>
        </>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {breadcrumb}
        {step === 'machine' && <MachineSelector onSelect={handleMachineSelect} />}
        {step === 'category' && (
          <CategorySelector
            machineId={machineId}
            machineModel={machineModel}
            onSelect={handleCategorySelect}
            onBack={() => setStep('machine')}
          />
        )}
        {step === 'parts' && (
          <PartsList
            machineId={machineId}
            machineModel={machineModel}
            categoryId={categoryId}
            categoryName={categoryName}
            onBack={() => setStep('category')}
          />
        )}
      </main>
    </div>
  );
}
