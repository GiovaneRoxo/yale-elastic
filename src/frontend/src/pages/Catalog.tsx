import AppHeader from '@/components/AppHeader';
import PartsList from '@/components/PartsList';


export default function Catalog() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      <main className="flex-1 container max-w-4xl mx-auto px-4 py-8">
        <PartsList
          machineId="bypass-id"
          machineModel="Yale A975 (Elasticsearch)"
          categoryId="bypass-cat"
          categoryName="Busca Global de Peças"
          onBack={() => window.history.back()}
        />
      </main>
    </div>
  );
}
