'use client';
import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { X } from 'lucide-react';
import PaymentForm from './PaymentForm';
import api from '@/lib/api';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Props {
  sessionId: string;
  amount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CheckoutModal({ sessionId, amount, onClose, onSuccess }: Props) {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.post(`/sessions/${sessionId}/pay`)
      .then((r: { data: { data: { clientSecret: string } } }) => setClientSecret(r.data.data.clientSecret))
      .catch((err: { response?: { data?: { message?: string } } }) => setError(err.response?.data?.message || 'Error al inicializar pago'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-1">Confirmar reserva</h2>
        <p className="text-sm text-gray-500 mb-6">Total: <span className="font-bold text-gray-900">{amount}€</span></p>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-4 border-green-600 border-t-transparent animate-spin" />
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500 bg-red-50 p-4 rounded-xl">{error}</div>
        )}

        {clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
            <PaymentForm sessionId={sessionId} amount={amount} onSuccess={onSuccess} />
          </Elements>
        )}
      </div>
    </div>
  );
}
