import { z } from 'zod';

export const PatientAddSchema = z.object({
  name: z
    .string()
    .nonempty({ message: 'Name is required.' })
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .max(50, { message: 'Name must not exceed 50 characters.' }),
  dob: z.string().nonempty({ message: 'DOB is required.' }),
  mrn: z.string().nonempty({ message: 'MRN is required.' }),
  insurance: z.string().nonempty({ message: 'Insurance info is required.' }),
});

export type PatientAddSchemaType = z.infer<typeof PatientAddSchema>;

