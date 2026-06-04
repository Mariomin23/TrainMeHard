'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import {
  getAdminStats,
  getAdminProfessionals,
  approveProfessional,
  getAdminSessions,
  type AdminStats,
  type AdminProfessionalsResult,
  type AdminSessionsResult,
} from '@/services/admin.service';
import { Users, Briefcase, CalendarDays, TrendingUp, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  paid: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  disputed: 'bg-orange-50 text-orange-700',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente', paid: 'Pagada', completed: 'Completada',
  cancelled: 'Cancelada', disputed: 'En disputa',
};
const TYPE_LABELS: Record<string, string> = {
  trainer: 'Entrenador', nutritionist: 'Nutricionista', physiotherapist: 'Fisioterapeuta',
};

type Tab = 'overview' | 'professionals' | 'sessions';
type ProfFilter = 'all' | 'pending' | 'approved';

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [profResult, setProfResult] = useState<AdminProfessionalsResult | null>(null);
  const [profFilter, setProfFilter] = useState<ProfFilter>('pending');
  const [profPage, setProfPage] = useState(1);
  const [sessResult, setSessResult] = useState<AdminSessionsResult | null>(null);
  const [sessPage, setSessPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      router.replace('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    getAdminStats().then(setStats).catch(() => {});
  }, []);

  const loadProfessionals = useCallback(() => {
    setLoading(true);
    getAdminProfessionals({ status: profFilter, page: profPage })
      .then(setProfResult)
      .finally(() => setLoading(false));
  }, [profFilter, profPage]);

  const loadSessions = useCallback(() => {
    setLoading(true);
    getAdminSessions({ page: sessPage })
      .then(setSessResult)
      .finally(() => setLoading(false));
  }, [sessPage]);

  useEffect(() => {
    if (tab === 'professionals') loadProfessionals();
  }, [tab, loadProfessionals]);

  useEffect(() => {
    if (tab === 'sessions') loadSessions();
  }, [tab, loadSessions]);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await approveProfessional(id);
      await loadProfessionals();
      getAdminStats().then(setStats).catch(() => {});
    } finally {
      setApprovingId(null);
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Resumen' },
    { key: 'professionals', label: `Profesionales${stats?.pendingApprovals ? ` (${stats.pendingApprovals})` : ''}` },
    { key: 'sessions', label: 'Sesiones' },
  ];

  return (
    <main className="flex-1 bg-gray-50 py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Panel de administración</h1>
          <p className="text-gray-500 text-sm mt-1">Hola, {user?.firstName} · {user?.role === 'super_admin' ? 'Super Admin' : 'Admin'}</p>
        </div>

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

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: 'Usuarios', value: stats?.totalUsers ?? '—', color: 'bg-blue-50 text-blue-600' },
              { icon: Briefcase, label: 'Profesionales', value: stats?.totalProfessionals ?? '—', color: 'bg-purple-50 text-purple-600' },
              { icon: Clock, label: 'Pendientes aprobación', value: stats?.pendingApprovals ?? '—', color: 'bg-yellow-50 text-yellow-600' },
              { icon: CalendarDays, label: 'Sesiones totales', value: stats?.totalSessions ?? '—', color: 'bg-green-50 text-green-600' },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              </div>
            ))}

            <div className="col-span-2 md:col-span-4 bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                <TrendingUp size={18} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats ? `${stats.totalRevenue.toFixed(2)}€` : '—'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Comisiones recaudadas (50% por sesión)</p>
              </div>
            </div>

            {stats && stats.pendingApprovals > 0 && (
              <div className="col-span-2 md:col-span-4 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center justify-between">
                <p className="text-sm font-medium text-yellow-800">
                  {stats.pendingApprovals} profesional{stats.pendingApprovals !== 1 ? 'es' : ''} esperando aprobación
                </p>
                <button
                  onClick={() => setTab('professionals')}
                  className="text-xs font-semibold text-yellow-700 hover:underline"
                >
                  Ver ahora →
                </button>
              </div>
            )}
          </div>
        )}

        {/* PROFESSIONALS */}
        {tab === 'professionals' && (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              {(['pending', 'approved', 'all'] as ProfFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => { setProfFilter(f); setProfPage(1); }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${profFilter === f ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  {f === 'pending' ? 'Pendientes' : f === 'approved' ? 'Aprobados' : 'Todos'}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
              </div>
            ) : profResult?.professionals.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 text-gray-400">
                <CheckCircle size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Sin profesionales en esta categoría</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {profResult?.professionals.map(p => (
                    <div key={p._id} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
                        {p.userId.firstName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm">{p.userId.firstName} {p.userId.lastName}</p>
                        <p className="text-xs text-gray-500 truncate">{p.userId.email} · {TYPE_LABELS[p.professionalType] ?? p.professionalType}</p>
                        {p.location?.city && <p className="text-xs text-gray-400">{p.location.city}{p.location.country ? `, ${p.location.country}` : ''}</p>}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.isApproved ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
                          {p.isApproved ? 'Aprobado' : 'Pendiente'}
                        </span>
                        {!p.isApproved && (
                          <button
                            onClick={() => handleApprove(p._id)}
                            disabled={approvingId === p._id}
                            className="px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-full hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            {approvingId === p._id ? '...' : 'Aprobar'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {profResult && profResult.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setProfPage(p => Math.max(1, p - 1))}
                      disabled={profPage === 1}
                      className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-gray-300"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-gray-500">{profPage} / {profResult.totalPages}</span>
                    <button
                      onClick={() => setProfPage(p => Math.min(profResult.totalPages, p + 1))}
                      disabled={profPage === profResult.totalPages}
                      className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-gray-300"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* SESSIONS */}
        {tab === 'sessions' && (
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
              </div>
            ) : sessResult?.sessions.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 text-gray-400">
                <CalendarDays size={36} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Sin sesiones todavía</p>
              </div>
            ) : (
              <>
                {sessResult?.sessions.map(s => {
                  const prof = s.professionalId as unknown as { userId?: { firstName: string; lastName: string } };
                  const profName = prof?.userId ? `${prof.userId.firstName} ${prof.userId.lastName}` : '—';
                  const user = s.userId as unknown as { firstName?: string; lastName?: string };
                  const userName = user?.firstName ? `${user.firstName} ${user.lastName ?? ''}` : '—';
                  const date = s.scheduledAt ? new Date(s.scheduledAt) : null;
                  return (
                    <div key={s._id} className="bg-white rounded-2xl p-5 border border-gray-100 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900">{userName}</p>
                          <span className="text-gray-300 text-xs">→</span>
                          <p className="text-sm text-gray-600">{profName}</p>
                        </div>
                        {date && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })} · {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-bold text-gray-900">{s.sessionPrice}€</span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[s.status] ?? 'bg-gray-50 text-gray-600'}`}>
                          {STATUS_LABELS[s.status] ?? s.status}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {sessResult && sessResult.totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setSessPage(p => Math.max(1, p - 1))}
                      disabled={sessPage === 1}
                      className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-gray-300"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-gray-500">{sessPage} / {sessResult.totalPages}</span>
                    <button
                      onClick={() => setSessPage(p => Math.min(sessResult.totalPages, p + 1))}
                      disabled={sessPage === sessResult.totalPages}
                      className="p-2 rounded-lg border border-gray-200 disabled:opacity-40 hover:border-gray-300"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
