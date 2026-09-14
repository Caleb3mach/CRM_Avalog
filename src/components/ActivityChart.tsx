'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface Props {
  data: { label: string; contatos: number }[]
}

export default function ActivityChart({ data }: Props) {
  const max = Math.max(...data.map((d) => d.contatos), 1)

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} barCategoryGap="30%">
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            fontSize: '13px',
            boxShadow: 'var(--shadow-md)',
          }}
          labelStyle={{ color: 'var(--text-secondary)' }}
          cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
        />
        <Bar dataKey="contatos" radius={[4, 4, 0, 0]} name="Contatos">
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.contatos === max ? '#3b82f6' : 'rgba(59, 130, 246, 0.25)'}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
