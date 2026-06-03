// fitness-frontend/src/app/(protected)/dashboard/professional/setup/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/services/professional.service';
import type { ProfessionalType } from '@/types/professional';

const TYPES: { value: ProfessionalType; label: string; desc: string }[] = [
  { value: 'trainer', label: '💪 Entrenador Personal', desc: 'Fitness, musculación, deporte' },
  { value: 'nutritionist', label: '🥗 Nutricionista', desc: 'Dieta, alimentación, salud' },
  { value: 'physiotherapist', label: '🩺 Fisioterapeuta', desc: 'Rehabilitación, lesiones' },
];

export default function ProfessionalSetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    professionalType: '' as ProfessionalType | '',
    bio: '',
    specialties: [] as string[],
    specialtyInput: '',
    sessionPrice: '',
    city: '',
    country: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addSpecialty = () => {
    const s = form.specialtyInput.trim();
    if (s && !form.specialties.includes(s)) {
      setForm(f => ({ ...f, specialties: [...f.specialties, s], specialtyInput: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.professionalType) { setError('Selecciona tu tipo de profesional'); return; }
    if (!form.sessionPrice || Number(form.sessionPrice) <= 0) { setError('Introduce un precio válido'); return; }
    setLoading(true);
    setError('');
    try {
      await updateProfile({
        professionalType: form.professionalType as ProfessionalType,
        bio: form.bio,
        specialties: form.specialties,
        sessionPrice: Number(form.sessionPrice),
        location: { city: form.city, country: form.country },
      });
      router.push('/dashboard/professional');
    } catch {
      setError('Error al crear el perfil. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 bg-gray-50 py-8 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Configura tu perfil profesional</h1>
          <p className="text-gray-500 text-sm mt-1">
            Tu perfil será revisado antes de aparecer en los resultados de búsqueda.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col gap-6">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de profesional *</label>
            <div className="flex flex-col gap-3">
              {TYPES.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, professionalType: value }))}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    form.professionalType === value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className={`font-medium text-sm ${form.professionalType === value ? 'text-green-700' : 'text-gray-900'}`}>{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900 resize-none"
              placeholder="Cuéntanos tu experiencia y metodología..."
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.bio.length}/500</p>
          </div>

          {/* Especialidades */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Especialidades</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {form.specialties.map(s => (
                <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-full font-medium">
                  {s}
                  <button
                    type="button"
                    onClick={() => setForm(f => ({ ...f, specialties: f.specialties.filter(x => x !== s) }))}
                    className="hover:text-red-500 text-lg leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.specialtyInput}
                onChange={e => setForm(f => ({ ...f, specialtyInput: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                placeholder="Ej: Musculación, Yoga..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={addSpecialty}
                className="px-4 py-2.5 border border-gray-200 rounded-xl hover:border-green-500 transition-colors text-gray-600 text-sm"
              >
                Añadir
              </button>
            </div>
          </div>

          {/* Precio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio por sesión (€) *</label>
            <input
              type="number"
              value={form.sessionPrice}
              onChange={e => setForm(f => ({ ...f, sessionPrice: e.target.value }))}
              required
              min={1}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
              placeholder="50"
            />
          </div>

          {/* Ubicación */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
              <input
                type="text"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="Madrid"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">País</label>
              <input
                type="text"
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                placeholder="España"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-green-500 text-white rounded-xl font-semibold hover:bg-green-400 transition-colors disabled:opacity-50 mt-2"
          >
            {loading ? 'Creando perfil...' : 'Crear perfil profesional'}
          </button>
        </form>
      </div>
    </main>
  );
}
