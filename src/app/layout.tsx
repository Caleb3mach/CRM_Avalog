import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CRM — Machado Soluções Digitais',
  description: 'CRM de campanha de prospecção para pequenos negócios locais',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Inline script to apply theme BEFORE first paint — avoids flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('crm-theme');
                  if (t === 'dark' || t === 'light') {
                    document.documentElement.setAttribute('data-theme', t);
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch(e) {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <Navbar />
        <main style={{ paddingTop: '60px' }}>
          {children}
        </main>
        {/* Client-side trigger: auto-followup ao abrir o app */}
        <AutoFollowUpTrigger />
      </body>
    </html>
  )
}

// Dispara o cron de auto-followup silenciosamente quando o app abre
function AutoFollowUpTrigger() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          fetch('/api/cron/auto-followup')
            .catch(() => {});
        `,
      }}
    />
  )
}
