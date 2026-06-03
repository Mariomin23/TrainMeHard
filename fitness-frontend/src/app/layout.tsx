import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'TrainMeHard — Encuentra tu Entrenador',
  description: 'Marketplace de entrenadores fitness. Busca, compara y contrata en minutos.',
  openGraph: {
    title: 'TrainMeHard — Encuentra tu Entrenador',
    description: 'Marketplace de entrenadores fitness. Busca, compara y contrata en minutos.',
    images: ['https://www.araguaocio.es/wp-content/uploads/2021/02/entrenam-personal.jpg'],
    url: 'https://trainmehard.vercel.app',
    siteName: 'TrainMeHard',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {children}
      </body>
    </html>
  )
}
