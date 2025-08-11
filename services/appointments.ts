import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function getAppointments() {
  return prisma.appointment.findMany({ orderBy: { date: 'asc' } });
}

export async function getAppointment(id: string) {
  return prisma.appointment.findUnique({ where: { id } });
}

export async function createAppointment(data: Prisma.AppointmentCreateInput) {
  return prisma.appointment.create({ data });
}

export async function updateAppointment(id: string, data: Prisma.AppointmentUpdateInput) {
  return prisma.appointment.update({ where: { id }, data });
}

export async function deleteAppointment(id: string) {
  return prisma.appointment.delete({ where: { id } });
}
