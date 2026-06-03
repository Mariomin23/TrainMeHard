'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Star, Clock, Calendar, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { getTrainerById } from '@/services/trainer.service';
import { createSession } from '@/services/session.service';
import { useAuthStore } from '@/store/auth.store';
import dynamic from 'next/dynamic';
import type { Professional } from '@/types/professional';

const CheckoutModal = dynamic(() => import('@/components/CheckoutModal'), { ssr: false });

export default function TrainerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [trainer, setTrainer] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [duration, setDuration] = useState(60);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [checkoutSession, setCheckoutSession] = useState<{ id: string; amount: number } | null>(null);

  useEffect(() => {
    getTrainerById(id)
      .then(setTrainer)
      .catch(() => router.push('/trainers'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { router.push('/login'); return; }
    setError('');
    setBooking(true);
    try {
      const session = await createSession({ professionalId: id, scheduledAt: new Date(bookingDate).toISOString() });
      setCheckoutSession({ id: session._id, amount: session.sessionPrice });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Error al reservar');
    } finally {
      setBooking(false);
    }
  };

  if (loading) return (
    <main className="flex-1 flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
    </main>
  );

  if (!trainer) return null;

  const priceForDuration = +((trainer.sessionPrice * duration) / 60).toFixed(2);

  return (
    <main className="flex-1 bg-gray-50 py-8 px-6">
      <div className="max-w-5xl mx-auto">
        <Link href="/trainers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
          <ChevronLeft size={16} /> Volver a resultados
        </Link>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile */}
          <div className="md:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-8 border border-gray-100">
              <div className="flex items-start gap-5 mb-6">
                <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center text-green-700 font-bold text-3xl shrink-0">
                  {trainer.userId.firstName.charAt(0)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{`${trainer.userId.firstName} ${trainer.userId.lastName}`}</h1>
                  <div className="flex items-center gap-1.5 mt-1 text-sm text-gray-500">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    {trainer.rating > 0 ? trainer.rating.toFixed(1) : 'Nuevo entrenador'}
                    {trainer.reviewCount > 0 && <span>· {trainer.reviewCount} reseñas</span>}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {trainer.specialties.map(s => (
                      <span key={s} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              </div>

              {trainer.bio && (
                <div>
                  <h2 className="font-semibold text-gray-900 mb-2">Sobre mí</h2>
                  <p className="text-gray-600 text-sm leading-relaxed">{trainer.bio}</p>
                </div>
              )}
            </div>

            {/* Availability */}
            {trainer.availability && trainer.availability.length > 0 && (
              <div className="bg-white rounded-3xl p-8 border border-gray-100">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar size={18} className="text-green-600" /> Disponibilidad
                </h2>
                <div className="flex flex-col gap-3">
                  {trainer.availability.map(a => (
                    <div key={a.day} className="flex items-start gap-4">
                      <span className="text-sm font-medium text-gray-700 w-28 shrink-0">{a.day}</span>
                      <div className="flex flex-wrap gap-2">
                        {a.timeSlots.map(slot => (
                          <span key={slot} className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg border border-gray-100 flex items-center gap-1">
                            <Clock size={11} /> {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking widget */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-3xl p-6 border border-gray-100 sticky top-24">
              <div className="text-center mb-6">
                <p className="text-4xl font-bold text-gray-900">{trainer.sessionPrice}€</p>
                <p className="text-sm text-gray-400 mt-1">por sesión</p>
              </div>

              {success ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                    <span className="text-green-600 text-xl">✓</span>
                  </div>
                  <p className="font-semibold text-gray-900">¡Sesión reservada!</p>
                  <p className="text-sm text-gray-500 mt-1">Ve a tu panel para ver los detalles</p>
                  <Link href="/dashboard" className="inline-block mt-4 text-green-600 text-sm font-medium hover:underline">
                    Ver mis sesiones
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleBook} className="flex flex-col gap-4">
                  {error && (
                    <p className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</p>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha y hora</label>
                    <input
                      type="datetime-local"
                      value={bookingDate}
                      onChange={e => setBookingDate(e.target.value)}
                      required
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Duración</label>
                    <select
                      value={duration}
                      onChange={e => setDuration(Number(e.target.value))}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-green-500 text-gray-900"
                    >
                      <option value={30}>30 min</option>
                      <option value={60}>60 min</option>
                      <option value={90}>90 min</option>
                      <option value={120}>2 horas</option>
                    </select>
                  </div>

                  <div className="flex justify-between py-3 border-t border-gray-50 text-sm">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold text-gray-900">{priceForDuration}€</span>
                  </div>

                  <button
                    type="submit"
                    disabled={booking}
                    className="w-full py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {booking ? 'Reservando...' : user ? 'Reservar sesión' : 'Iniciar sesión para reservar'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      {checkoutSession && (
        <CheckoutModal
          sessionId={checkoutSession.id}
          amount={checkoutSession.amount}
          onClose={() => setCheckoutSession(null)}
          onSuccess={() => { setCheckoutSession(null); setSuccess(true); }}
        />
      )}
    </main>
  );
}
