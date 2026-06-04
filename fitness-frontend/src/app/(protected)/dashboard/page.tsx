'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { getMySessions } from '@/services/session.service';
import SessionCard from '@/components/SessionCard';
import Link from 'next/link';
import { CalendarDays } from 'lucide-react';
import type { Session } from '@/types/session';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    if (user.role === 'professional') { router.push('/dashboard/professional'); return; }
    if (user.role === 'admin' || user.role === 'super_admin') { router.push('/dashboard/admin'); return; }
    getMySessions()
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [user, router]);

  const upcoming = sessions.filter(s => s.status !== 'completed' && s.status !== 'cancelled');
  const past = sessions.filter(s => s.status === 'completed' || s.status === 'cancelled');

  return (
    <main className="flex-1 bg-gray-50 py-8 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis sesiones</h1>
            <p className="text-gray-500 text-sm mt-1">Hola, {user?.firstName}</p>
          </div>
          <Link href="/professionals" className="px-5 py-2.5 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors">
            Buscar profesional
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2].map(i => <div key={i} className="h-36 bg-white rounded-2xl animate-pulse border border-gray-100" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
            <CalendarDays size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="font-semibold text-gray-700">Sin sesiones todavía</p>
            <p className="text-sm text-gray-400 mt-1 mb-6">Reserva tu primera sesión con un profesional</p>
            <Link href="/professionals" className="px-6 py-2.5 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors">
              Explorar profesionales
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {upcoming.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Próximas</h2>
                <div className="flex flex-col gap-3">
                  {upcoming.map(s => <SessionCard key={s._id} session={s} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Historial</h2>
                <div className="flex flex-col gap-3">
                  {past.map(s => <SessionCard key={s._id} session={s} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
