'use client';

import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { PatientStat } from '@/services/patient-stats';
import { getPatientStats } from '@/services/patient-stats';

export const PatientStatsChart = () => {
  const [data, setData] = useState<PatientStat[]>([]);

  useEffect(() => {
    getPatientStats().then(setData);
  }, []);

  const chartConfig = {
    patients: {
      label: 'Patients',
      color: 'hsl(var(--primary))',
    },
  } as const;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="date" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="patients" fill="var(--color-patients)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

export default PatientStatsChart;

