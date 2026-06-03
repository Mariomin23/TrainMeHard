'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import TrainerCard from '@/components/TrainerCard';
import { searchProfessionals } from '@/services/professional.service';
import type { Professional, ProfessionalType } from '@/types/professional';

const SPECIALTIES = [
  'Musculación', 'Pérdida de Peso', 'Yoga', 'Crossfit',
  'Running', 'Pilates', 'Boxeo', 'Nutrición', 'Fisioterapia',
];

const TYPE_OPTIONS: { value: ProfessionalType | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'trainer', label: 'Entrenadores' },
  { value: 'nutritionist', label: 'Nutricionistas' },
  { value: 'physiotherapist', label: 'Fisioterapeutas' },
];

const RATING_OPTIONS = [
  { value: '', label: 'Cualquier valoración' },
  { value: '3', label: '≥ 3★' },
  { value: '4', label: '≥ 4★' },
  { value: '4.5', label: '≥ 4.5★' },
];

function ProfessionalsContent() {
  const searchParams = useSearchParams();

  const [specialty, setSpecialty] = useState(searchParams.get('specialty') || '');
  const [type, setType] = useState<ProfessionalType | ''>((searchParams.get('type') as ProfessionalType) || '');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      try {
        const params: Record<string, string | number> = {};
        if (specialty) params.specialty = specialty;
        if (type) params.type = type;
        if (city) params.city = city;
        if (minPrice) params.minPrice = Number(minPrice);
        if (maxPrice) params.maxPrice = Number(maxPrice);
        if (minRating) params.minRating = Number(minRating);
        const data = await searchProfessionals(params);
        if (!cancelled) { setProfessionals(data.professionals); setTotal(data.total); }
      } catch {
        if (!cancelled) setProfessionals([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [specialty, type, city, minPrice, maxPrice, minRating]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); };

  return (
    <main className="flex-1 bg-gray-50">
      <div className="bg-white border-b border-gray-100 py-6 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Type filter chips */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setType(opt.value as ProfessionalType | '')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                  type === opt.value
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all">
              <Search size={18} className="text-gray-400 shrink-0" />
              <input
                type="text"
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                placeholder="Especialidad..."
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
          </form>

          {showFilters && (
            <div className="mt-4 flex gap-4 flex-wrap items-end">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Ciudad:</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Madrid..."
                  className="w-28 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Precio/sesión:</label>
                <input
                  type="number"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  placeholder="Min €"
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-gray-400">—</span>
                <input
                  type="number"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  placeholder="Max €"
                  className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Valoración:</label>
                <select
                  value={minRating}
                  onChange={e => setMinRating(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500"
                >
                  {RATING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-2 mt-4 flex-wrap">
            {SPECIALTIES.map(s => (
              <button
                key={s}
                onClick={() => setSpecialty(prev => prev === s ? '' : s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  specialty === s
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
            <p className="text-sm mt-2">Prueba con otra especialidad o ajusta los filtros</p>
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
