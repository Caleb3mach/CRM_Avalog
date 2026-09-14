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
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/kanban', label: 'Kanban', icon: Kanban },
  { href: '/leads', label: 'Leads', icon: Users },
  { href: '/scripts', label: 'Scripts', icon: FileText },
  { href: '/campanhas', label: 'Campanhas', icon: Zap }, // usando zap ou Send
  { href: '/importar', label: 'Importar', icon: Upload },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'var(--bg-navbar)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        paddingInline: '20px',
        gap: '8px',
      }}
    >
      {/* Logo */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '24px', textDecoration: 'none' }}>
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Zap size={14} color="white" />
        </div>
        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
          Machado<span className="gradient-text"> CRM</span>
        </span>
      </Link>

      {/* Nav links */}
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: '500',
              transition: 'all 0.18s ease',
              background: isActive
                ? 'rgba(59, 130, 246, 0.15)'
                : 'transparent',
              color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
            }}
          >
            <Icon size={14} />
            {label}
          </Link>
        )
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Theme Toggle */}
      <ThemeToggle />
    </nav>
  )
}
