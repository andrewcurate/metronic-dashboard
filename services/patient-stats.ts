export interface PatientStat {
  date: string;
  patients: number;
}

export async function getPatientStats(): Promise<PatientStat[]> {
  // Mock data representing patient counts per month
  return [
    { date: 'Jan', patients: 30 },
    { date: 'Feb', patients: 40 },
    { date: 'Mar', patients: 35 },
    { date: 'Apr', patients: 50 },
    { date: 'May', patients: 45 },
    { date: 'Jun', patients: 60 },
  ];
}

