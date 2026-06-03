import Link from 'next/link';
import { Star, Clock } from 'lucide-react';
import type { Professional } from '@/types/professional';

export default function TrainerCard({ trainer }: { trainer: Professional }) {
  const initial = trainer.userId.firstName.charAt(0).toUpperCase();

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center text-white font-bold text-lg mb-3 shadow-sm">
            {initial}
          </div>
          <h3 className="font-semibold text-gray-900">{`${trainer.userId.firstName} ${trainer.userId.lastName}`}</h3>
          <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
            <Star size={13} className="text-yellow-400 fill-yellow-400" />
            <span className="font-medium">{trainer.rating > 0 ? trainer.rating.toFixed(1) : 'Nuevo'}</span>
            {trainer.reviewCount > 0 && <span className="text-gray-400">({trainer.reviewCount})</span>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gray-900">{trainer.sessionPrice}€</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 justify-end mt-1">
            <Clock size={11} /> / hora
          </p>
        </div>
      </div>

      {trainer.bio && (
        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{trainer.bio}</p>
      )}

      <div className="flex flex-wrap gap-2">
        {trainer.specialties.slice(0, 3).map(s => (
          <span key={s} className="px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-lg font-medium border border-green-100">
            {s}
          </span>
        ))}
      </div>

      <Link
        href={`/professionals/${trainer._id}`}
        className="w-full text-center py-3 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-400 transition-colors mt-auto"
      >
        Ver perfil
      </Link>
    </div>
  );
}
