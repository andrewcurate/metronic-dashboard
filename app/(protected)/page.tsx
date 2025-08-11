'use client';

import { useSettings } from '@/providers/settings-provider';
import { Demo1LightSidebarPage } from './components/demo1';
import { Demo2Page } from './components/demo2';
import { Demo3Page } from './components/demo3';
import { Demo4Page } from './components/demo4';
import { Demo5Page } from './components/demo5';
import { PatientStatsChart } from '@/components/examples/patient-stats-chart';

export default function Page() {
  const { settings } = useSettings();

  let content = <Demo1LightSidebarPage />;

  if (settings?.layout === 'demo2') {
    content = <Demo2Page />;
  } else if (settings?.layout === 'demo3') {
    content = <Demo3Page />;
  } else if (settings?.layout === 'demo4') {
    content = <Demo4Page />;
  } else if (settings?.layout === 'demo5') {
    content = <Demo5Page />;
  } else if (settings?.layout === 'demo6') {
    content = <Demo4Page />;
  } else if (settings?.layout === 'demo7') {
    content = <Demo2Page />;
  } else if (settings?.layout === 'demo8') {
    content = <Demo4Page />;
  } else if (settings?.layout === 'demo9') {
    content = <Demo2Page />;
  } else if (settings?.layout === 'demo10') {
    content = <Demo3Page />;
  }

  return (
    <div className="space-y-8">
      {content}
      <PatientStatsChart />
    </div>
  );
}
