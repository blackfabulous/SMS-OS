import Link from 'next/link'
import { School, MapPin, Phone, Mail } from 'lucide-react'

interface FooterProps {
  schoolName: string
  motto?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

const QUICK_LINKS = [
  { label: 'About Us', href: '/about' },
  { label: 'Academics', href: '/academics' },
  { label: 'Admissions', href: '/admissions' },
  { label: 'News', href: '/news' },
  { label: 'Events', href: '/events' },
  { label: 'Contact', href: '/contact' },
]

export function PublicFooter({ schoolName, motto, address, phone, email }: FooterProps) {
  return (
    <footer className="relative mt-24 overflow-hidden bg-emerald-950 text-emerald-100">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
                <School className="h-5 w-5 text-emerald-300" />
              </span>
              <span className="text-lg font-bold text-white">{schoolName}</span>
            </div>
            {motto && <p className="mt-4 text-sm italic text-emerald-300/90">“{motto}”</p>}
            <div className="mt-4 flex h-1.5 w-32 overflow-hidden rounded-full">
              <span className="flex-1 bg-green-500" />
              <span className="flex-1 bg-yellow-400" />
              <span className="flex-1 bg-red-500" />
              <span className="flex-1 bg-white" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h3>
            <ul className="mt-4 space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-emerald-200/80 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
            <ul className="mt-4 space-y-3 text-sm text-emerald-200/80">
              {address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{address}</span>
                </li>
              )}
              {phone && (
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-emerald-400" />
                  <a href={`tel:${phone}`} className="transition-colors hover:text-white">{phone}</a>
                </li>
              )}
              {email && (
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-emerald-400" />
                  <a href={`mailto:${email}`} className="transition-colors hover:text-white">{email}</a>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Portal Access</h3>
            <p className="mt-4 text-sm text-emerald-200/80">
              Staff, parents and students can sign in to the school management portal.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition-colors hover:bg-emerald-400"
            >
              Portal Login
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-emerald-800/60 pt-6 text-xs text-emerald-300/70 sm:flex-row">
          <p>&copy; {new Date().getFullYear()} {schoolName}. All rights reserved.</p>
          <p>Powered by <span className="font-semibold text-emerald-200">ZimSchool Pro</span></p>
        </div>
      </div>
    </footer>
  )
}
