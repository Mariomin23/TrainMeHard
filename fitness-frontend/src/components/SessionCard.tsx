import type { Session } from '@/types/session'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  paid: 'bg-blue-50 text-blue-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  disputed: 'bg-orange-50 text-orange-700',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  completed: 'Completada',
  cancelled: 'Cancelada',
  disputed: 'En disputa',
}

export default function SessionCard({ session, onConfirm }: { session: Session; onConfirm?: (id: string) => void }) {
  const date = session.scheduledAt ? new Date(session.scheduledAt) : null

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          {date ? (
            <>
              <p className="font-semibold text-gray-900">
                {date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <p className="text-sm text-gray-500">
                {date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </>
          ) : (
            <p className="font-semibold text-gray-900">Sin fecha programada</p>
          )}
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[session.status] || 'bg-gray-50 text-gray-600'}`}>
          {STATUS_LABELS[session.status] || session.status}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span className="text-sm text-gray-500">Total pagado</span>
        <span className="font-bold text-gray-900">{session.sessionPrice}€</span>
      </div>

      {onConfirm && session.status === 'pending' && (
        <button
          onClick={() => onConfirm(session._id)}
          className="w-full py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700 transition-colors"
        >
          Confirmar sesión
        </button>
      )}
    </div>
  )
}
