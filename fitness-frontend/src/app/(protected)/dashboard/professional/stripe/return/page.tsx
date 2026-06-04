'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getStripeStatus } from '@/services/professional.service';
import type { StripeStatus } from '@/types/professional';

function StripeReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isRefresh = searchParams.get('refresh') === 'true';

  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isRefresh) {
      router.push('/dashboard/professional?tab=pagos');
      return;
    }
    getStripeStatus()
      .then(setStatus)
      .finally(() => setLoading(false));
  }, [isRefresh, router]);

  if (loading) {
    return (
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-green-600" />
      </main>
    );
  }

  return (
    <main className="flex-1 flex items-center justify-center bg-gray-50 px-6">
      <div className="bg-white rounded-3xl p-10 w-full max-w-md text-center border border-gray-100 shadow-sm">
        {status?.chargesEnabled ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">¡Cuenta conectada!</h1>
            <p className="text-sm text-gray-500 mb-6">
              Tu cuenta Stripe está activa. Ya puedes recibir pagos de tus clientes.
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-5">
              <AlertCircle size={32} className="text-yellow-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Verificación en proceso</h1>
            <p className="text-sm text-gray-500 mb-6">
              Stripe está revisando tu información. Puede tardar unos minutos. Vuelve a comprobar el estado desde tu panel.
            </p>
          </>
        )}
        <Link
          href="/dashboard/professional"
          className="inline-block px-8 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition-colors text-sm"
        >
          Volver al panel
        </Link>
      </div>
    </main>
  );
}

export default function StripeReturnPage() {
  return (
    <Suspense fallback={
      <main className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 size={32} className="animate-spin text-green-600" />
      </main>
    }>
      <StripeReturnContent />
    </Suspense>
  );
}
