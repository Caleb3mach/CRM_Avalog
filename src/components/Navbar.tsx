'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Kanban,
  Users,
  FileText,
  Upload,
  Zap,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { href: '/', label: 'Painel', icon: LayoutDashboard },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/campanhas', label: 'Envios', icon: Zap },
  { href: '/importar', label: 'Importar', icon: Upload },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <>
      {/* Top Navbar (Desktop) & Top Header (Mobile) */}
      <nav
        className="fixed top-0 left-0 right-0 h-[60px] z-50 flex items-center px-4 md:px-6"
        style={{
          background: 'var(--bg-navbar)',
          borderBottom: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-6 text-none">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--accent-blue)' }}
          >
            <Zap size={14} color="var(--bg-base)" />
          </div>
          <span className="text-[14px] font-bold text-[var(--text-primary)]">
            Machado<span className="text-[var(--accent-blue)]"> CRM</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all"
                style={{
                  background: isActive ? 'var(--chart-bar-inactive)' : 'transparent',
                  color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
                }}
              >
                <Icon size={14} />
                {label}
              </Link>
            )
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme Toggle */}
        <ThemeToggle />
      </nav>

      {/* Bottom Navigation Bar (Mobile) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] z-50 flex items-center justify-around px-2"
        style={{
          background: 'var(--bg-navbar)',
          borderTop: '1px solid var(--border)',
          backdropFilter: 'blur(12px)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-1 p-2 min-w-[60px]"
              style={{
                color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              }}
            >
              <div 
                className="p-1 rounded-full transition-all"
                style={{ background: isActive ? 'var(--chart-bar-inactive)' : 'transparent' }}
              >
                <Icon size={18} />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
