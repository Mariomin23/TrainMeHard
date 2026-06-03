// fitness-frontend/src/app/(protected)/dashboard/professional/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { getMyProfile, updateProfile } from '@/services/professional.service';
import { getMySessions, updateSessionStatus } from '@/services/session.service';
import SessionCard from '@/components/SessionCard';
import { Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import type { Session } from '@/types/session';
import type { Professional, ProfessionalType, AvailabilitySlot } from '@/types/professional';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS_ES: Record<string, string> = {
  Monday: 'Lunes', Tuesday: 'Martes', Wednesday: 'Miércoles',
  Thursday: 'Jueves', Friday: 'Viernes', Saturday: 'Sábado', Sunday: 'Domingo',
};

const TYPE_OPTIONS: { value: ProfessionalType; label: string }[] = [
  { value: 'trainer', label: 'Entrenador Personal' },
  { value: 'nutritionist', label: 'Nutricionista' },
  { value: 'physiotherapist', label: 'Fisioterapeuta' },
];

export default function TrainerDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [isApproved, setIsApproved] = useState<boolean | undefined>(undefined);
  const [profile, setProfile] = useState({
    specialties: [] as string[],
    bio: '',
    sessionPrice: 0,
    professionalType: '' as ProfessionalType | '',
    city: '',
    country: '',
  });
  const [specialtyInput, setSpecialtyInput] = useState('');
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);
  const [tab, setTab] = useState<'sessions' | 'profile' | 'availability'>('sessions');

  useEffect(() => {
    if (!user) return;
    Promise.all([getMyProfile(), getMySessions()])
      .then(([p, s]: [Professional, Session[]]) => {
        setIsApproved(p.isApproved);
        setProfile({
          specialties: p.specialties || [],
          bio: p.bio || '',
          sessionPrice: p.sessionPrice || 0,
          professionalType: p.professionalType || '',
          city: p.location?.city || '',
          country: p.location?.country || '',
        });
        setAvailability(p.availability || []);
        setSessions(s);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) router.push('/dashboard/professional/setup');
      })
      .finally(() => setLoading(false));
  }, [user, router]);

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile({
      bio: profile.bio,
      specialties: profile.specialties,
      sessionPrice: profile.sessionPrice,
      professionalType: profile.professionalType as ProfessionalType,
      location: { city: profile.city, country: profile.country },
    }).catch(() => {});
    setSaving(false);
  };

  const handleSaveAvailability = async () => {
    setSavingAvail(true);
    await updateProfile({ availability }).catch(() => {});
    setSavingAvail(false);
  };

  const addSpecialty = () => {
    const s = specialtyInput.trim();
    if (s && !profile.specialties.includes(s)) {
      setProfile(p => ({ ...p, specialties: [...p.specialties, s] }));
      setSpecialtyInput('');
    }
  };

  const removeSpecialty = (s: string) =>
    setProfile(p => ({ ...p, specialties: p.specialties.filter(x => x !== s) }));

  const toggleDay = (day: string) => {
    if (availability.find(a => a.day === day)) {
      setAvailability(a => a.filter(x => x.day !== day));
    } else {
      setAvailability(a => [...a, { day, timeSlots: ['09:00-10:00'] }]);
    }
  };

  const addSlot = (day: string) =>
    setAvailability(a => a.map(x => x.day === day ? { ...x, timeSlots: [...x.timeSlots, '10:00-11:00'] } : x));

  const updateSlot = (day: string, idx: number, val: string) =>
    setAvailability(a => a.map(x => x.day === day ? { ...x, timeSlots: x.timeSlots.map((s, i) => i === idx ? val : s) } : x));

  const removeSlot = (day: string, idx: number) =>
    setAvailability(a => a.map(x => x.day === day ? { ...x, timeSlots: x.timeSlots.filter((_, i) => i !== idx) } : x));

  const handleConfirm = async (id: string) => {
    await updateSessionStatus(id, 'confirmed');
    setSessions(s => s.map(x => x._id === id ? { ...x, status: 'paid' as const } : x));
  };

  const TABS = [
    { key: 'sessions', label: 'Sesiones' },
    { key: 'profile', label: 'Mi perfil' },
    { key: 'availability', label: 'Disponibilidad' },
  ] as const;

  return (
    <main className="flex-1 bg-gray-50 py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Panel de profesional</h1>
          <p className="text-gray-500 text-sm mt-1">Hola, {user?.firstName}</p>
        </div>

        {isApproved === false && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-start gap-3">
            <AlertCircle size={18} className="text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-yellow-800">Perfil pendiente de aprobación</p>
              <p className="text-xs text-yellow-700 mt-0.5">Tu perfil está siendo revisado. Aparecerás en los resultados de búsqueda una vez aprobado.</p>
            </div>
          </div>
        )}

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-8 w-fit">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => <div key={i} className="h-36 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
          </div>
        ) : (
          <>
            {tab === 'sessions' && (
              <div className="flex flex-col gap-3">
                {sessions.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 text-gray-400">
                    <p className="font-medium">Sin sesiones todavía</p>
                    <p className="text-sm mt-1">Completa tu perfil para aparecer en la búsqueda</p>
                  </div>
                ) : (
                  sessions.map(s => <SessionCard key={s._id} session={s} onConfirm={handleConfirm} />)
                )}
              </div>
            )}

            {tab === 'profile' && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de profesional</label>
                  <div className="grid grid-cols-3 gap-3">
                    {TYPE_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setProfile(p => ({ ...p, professionalType: value }))}
                        className={`py-2.5 px-2 rounded-xl border text-sm font-medium transition-all text-center ${
                          profile.professionalType === value
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Precio por sesión (€)</label>
                  <input
                    type="number"
                    value={profile.sessionPrice}
                    onChange={e => setProfile(p => ({ ...p, sessionPrice: Number(e.target.value) }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio (máx. 500 caracteres)</label>
                  <textarea
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    maxLength={500}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900 resize-none"
                    placeholder="Cuéntanos sobre ti..."
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{profile.bio.length}/500</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Especialidades</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.specialties.map(s => (
                      <span key={s} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-sm rounded-full font-medium">
                        {s}
                        <button onClick={() => removeSpecialty(s)} className="hover:text-red-500 transition-colors">
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={specialtyInput}
                      onChange={e => setSpecialtyInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSpecialty())}
                      placeholder="Añadir especialidad..."
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    />
                    <button onClick={addSpecialty} className="px-4 py-2.5 border border-gray-200 rounded-xl hover:border-green-500 transition-colors text-gray-600">
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ciudad</label>
                    <input
                      type="text"
                      value={profile.city}
                      onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                      placeholder="Madrid"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">País</label>
                    <input
                      type="text"
                      value={profile.country}
                      onChange={e => setProfile(p => ({ ...p, country: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                      placeholder="España"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            )}

            {tab === 'availability' && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100 flex flex-col gap-6">
                <p className="text-sm text-gray-500">Selecciona los días y añade franjas horarias (formato HH:MM-HH:MM)</p>
                {DAYS.map(day => {
                  const slot = availability.find(a => a.day === day);
                  const active = !!slot;
                  return (
                    <div key={day}>
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => toggleDay(day)}
                          className={`w-10 h-6 rounded-full transition-colors relative ${active ? 'bg-green-600' : 'bg-gray-200'}`}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                        </button>
                        <span className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-400'}`}>{DAYS_ES[day]}</span>
                      </div>
                      {active && slot && (
                        <div className="flex flex-col gap-2 ml-12">
                          {slot.timeSlots.map((ts, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={ts}
                                onChange={e => updateSlot(day, i, e.target.value)}
                                placeholder="09:00-10:00"
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 text-gray-900 w-36"
                              />
                              <button onClick={() => removeSlot(day, i)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => addSlot(day)} className="flex items-center gap-1.5 text-xs text-green-600 hover:text-green-700 font-medium w-fit">
                            <Plus size={12} /> Añadir franja
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={handleSaveAvailability}
                  disabled={savingAvail}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 mt-2"
                >
                  <Save size={16} /> {savingAvail ? 'Guardando...' : 'Guardar disponibilidad'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
