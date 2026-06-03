import Link from 'next/link';
import { Search, Shield, Zap, Star } from 'lucide-react';
import Hero from '@/components/Hero';

const SPECIALTIES = [
  { name: 'Musculación', icon: '💪' },
  { name: 'Pérdida de Peso', icon: '🔥' },
  { name: 'Yoga', icon: '🧘' },
  { name: 'Crossfit', icon: '⚡' },
  { name: 'Running', icon: '🏃' },
  { name: 'Pilates', icon: '🤸' },
  { name: 'Boxeo', icon: '🥊' },
  { name: 'Nutrición', icon: '🥗' },
  { name: 'Fisioterapia', icon: '🩺' },
];

const STEPS = [
  { icon: Search, title: 'Busca', desc: 'Filtra por especialidad, precio y disponibilidad.' },
  { icon: Star, title: 'Compara', desc: 'Revisa perfiles, valoraciones y tarifas.' },
  { icon: Zap, title: 'Contacta', desc: 'Paga una sesión inicial y empieza hoy.' },
];

const STATS = [
  { value: '200+', label: 'Profesionales' },
  { value: '4.9★', label: 'Valoración media' },
  { value: '1.200+', label: 'Sesiones completadas' },
];

export default function Home() {
  return (
    <main>
      <Hero />

      {/* Stats bar */}
      <div className="bg-white border-b border-gray-100 py-6 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-4 divide-x divide-gray-100">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center px-4">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-500 mb-3">Cómo funciona</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Sin complicaciones</h2>
          <p className="text-gray-500 mb-14">Sin suscripciones. Sin compromisos.</p>
          <div className="grid md:grid-cols-3 gap-10">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <div key={title} className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center shadow-sm">
                    <Icon className="text-green-500" size={26} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                <p className="text-sm text-gray-500 text-center leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-green-500 mb-3">Especialidades</p>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">¿En qué quieres mejorar?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {SPECIALTIES.map(({ name, icon }) => (
              <Link
                key={name}
                href={`/professionals?specialty=${encodeURIComponent(name)}`}
                className="bg-white rounded-2xl p-5 flex flex-col items-center gap-3 hover:shadow-md hover:-translate-y-0.5 border border-gray-100 transition-all duration-200 group"
              >
                <span className="text-3xl">{icon}</span>
                <span className="font-medium text-gray-700 text-sm group-hover:text-green-600 transition-colors text-center">
                  {name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust / CTA */}
      <section className="relative py-28 px-6 bg-gray-950 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-green-500/8 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-8">
            <Shield size={28} className="text-green-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Pago 100% seguro</h2>
          <p className="text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Procesamos los pagos con Stripe. Tu dinero está protegido hasta que confirmes que la sesión fue perfecta.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-block px-8 py-3.5 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-400 transition-colors"
            >
              Empezar gratis
            </Link>
            <Link
              href="/professionals"
              className="inline-block px-8 py-3.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Ver profesionales
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
