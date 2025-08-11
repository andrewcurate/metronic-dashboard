import { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { getAppointments } from '@/services/appointments';

export const metadata: Metadata = {
  title: 'Appointments Calendar',
  description: 'Calendar view of appointments.',
};

export default async function Page() {
  const appointments = await getAppointments();
  const dates = appointments.map((a) => a.date);

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>Appointments Calendar</ToolbarTitle>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/appointments/list">Appointments</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Calendar</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </ToolbarHeading>
          <ToolbarActions>
            <Link
              href="/appointments/list"
              className={buttonVariants({ variant: 'outline' })}
            >
              List View
            </Link>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container>
        <Calendar selected={dates} mode="multiple" />
      </Container>
    </>
  );
}
