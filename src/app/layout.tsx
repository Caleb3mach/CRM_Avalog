import type { Metadata } from 'next'
import { Inter, Fraunces } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces' })

export const metadata: Metadata = {
  title: 'CRM — Machado Soluções Digitais',
  description: 'CRM premium para vendas de SaaS e sites de alto ticket',
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
                    document.documentElement.setAttribute('data-theme', 'dark');
                  }
                } catch(e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${fraunces.variable} font-sans bg-bg-base text-text-primary`}>
        <Navbar />
        <main className="pt-[60px] pb-[70px] md:pb-0 min-h-screen">
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
