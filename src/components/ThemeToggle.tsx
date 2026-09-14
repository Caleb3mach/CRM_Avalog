'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('crm-theme') as 'light' | 'dark' | null
    const current = saved ?? (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') ?? 'light'
    setTheme(current)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('crm-theme', next)
  }

  if (!mounted) {
    return (
      <button className="theme-toggle" aria-label="Alternar tema" style={{ opacity: 0 }}>
        <Sun size={16} />
      </button>
    )
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
