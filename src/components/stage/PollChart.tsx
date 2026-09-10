'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer, PieChart, Pie, Legend } from 'recharts';
import type { Poll } from '@/lib/types';

interface PollChartProps {
  poll: Poll;
  variant?: 'bar' | 'pie';
}

const PINK_PALETTE = ['#a84e7e', '#c06890', '#d588a8', '#8a3d68', '#6b2e4f', '#e8afc5', '#4a1f35'];
const CORRECT_COLOR = '#4ade80';

export default function PollChart({ poll, variant = 'bar' }: PollChartProps) {
  const data = useMemo(
    () =>
      poll.options.map((opt, i) => ({
        name: opt.text.length > 20 ? opt.text.slice(0, 20) + '…' : opt.text,
        fullName: opt.text,
        value: opt.percentage ?? 0,
        votes: opt.voteCount ?? 0,
        isCorrect: opt.isCorrect,
        color: opt.isCorrect && poll.state === 'revealed' ? CORRECT_COLOR : PINK_PALETTE[i % PINK_PALETTE.length],
      })),
    [poll]
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-dark-surface border border-dark-border rounded-xl px-4 py-3 shadow-card text-sm">
        <p className="font-semibold text-white mb-1">{d.fullName}</p>
        <p className="text-rose-300">{d.value}%</p>
        <p className="text-muted-text text-xs">{d.votes} vote{d.votes !== 1 ? 's' : ''}</p>
        {d.isCorrect && poll.state === 'revealed' && (
          <p className="text-green-400 text-xs mt-1">✓ Correct</p>
        )}
      </div>
    );
  };

  if (variant === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            innerRadius={50}
            paddingAngle={3}
            label={({ name, value }) => `${value}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => <span className="text-white text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 50)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
      >
        <XAxis type="number" domain={[0, 100]} tick={{ fill: '#7878a0', fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#e4e4f2', fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={120}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(168,78,126,0.08)' }} />
        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={28}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
