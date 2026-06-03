'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import TrainerCard from '@/components/TrainerCard';
import { searchTrainers } from '@/services/trainer.service';
import type { Professional } from '@/types/professional';

const SPECIALTIES = [
  'Musculación', 'Pérdida de Peso', 'Yoga', 'Crossfit',
  'Running', 'Pilates', 'Boxeo', 'Nutrición', 'Fisioterapia',
];

function ProfessionalsContent() {
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get('specialty') || '');
  const [minRate, setMinRate] = useState('');
  const [maxRate, setMaxRate] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const fetchProfessionals = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (query) params.specialty = query;
      if (minRate) params.minRate = Number(minRate);
      if (maxRate) params.maxRate = Number(maxRate);
      const data = await searchTrainers(params);
      setProfessionals(data.trainers);
      setTotal(data.total);
    } catch {
      setProfessionals([]);
    } finally {
      setLoading(false);
    }
  }, [query, minRate, maxRate]);

  useEffect(() => { fetchProfessionals(); }, [fetchProfessionals]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProfessionals();
  };

  return (
    <main className="flex-1 bg-gray-50">
      <div className="bg-white border-b border-gray-100 py-6 px-6">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Especialidad, nombre..."
                className="flex-1 py-3 bg-transparent outline-none text-gray-700 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowFilters(f => !f)}
              className={`px-4 py-3 border rounded-xl flex items-center gap-2 text-sm transition-colors ${showFilters ? 'border-green-600 text-green-600 bg-green-50' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
            >
              <SlidersHorizontal size={16} /> Filtros
            </button>
            <button type="submit" className="px-6 py-3 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">
              Buscar
            </button>
          </form>

          {showFilters && (
            <div className="mt-4 flex gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Precio/h:</label>
                <input
                  type="number"
                  value={minRate}
                  onChange={e => setMinRate(e.target.value)}
                  placeholder="Min €"
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  value={maxRate}
                  onChange={e => setMaxRate(e.target.value)}
                  placeholder="Max €"
                  className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4 flex-wrap">
            {SPECIALTIES.map(s => (
              <button
                key={s}
                onClick={() => setQuery(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  query === s
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <p className="text-sm text-gray-500 mb-6">
          {loading ? 'Buscando...' : `${total} profesional${total !== 1 ? 'es' : ''} encontrado${total !== 1 ? 's' : ''}`}
        </p>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse h-64 border border-gray-100" />
            ))}
          </div>
        ) : professionals.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">Sin resultados</p>
            <p className="text-sm mt-2">Prueba con otra especialidad o quita los filtros</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {professionals.map(p => <TrainerCard key={p._id} trainer={p} />)}
          </div>
        )}
      </div>
    </main>
  );
}

export default function ProfessionalsPage() {
  return (
    <Suspense fallback={<main className="flex-1 bg-gray-50" />}>
      <ProfessionalsContent />
    </Suspense>
  );
}
