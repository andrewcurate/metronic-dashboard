'use client';

import { useMemo, useState } from 'react';
import { redirect } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronRight, Plus, Search, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/helpers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import {
  DataGrid,
  DataGridApiFetchParams,
  DataGridApiResponse,
} from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import PatientAddDialog from './patient-add-dialog';

interface Patient {
  id: string;
  name: string;
  dob: string;
  mrn: string;
  insurance: string;
}

const PatientList = () => {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchPatients = async ({
    pageIndex,
    pageSize,
    sorting,
    searchQuery,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<Patient>> => {
    const sortField = sorting?.[0]?.id || '';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      ...(sortField ? { sort: sortField, dir: sortDirection } : {}),
      ...(searchQuery ? { query: searchQuery } : {}),
    });

    const response = await apiFetch(
      `/api/patient-management/patients?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(
        'Oops! Something didn’t go as planned. Please try again in a moment.',
      );
    }

    return response.json();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['patient-patients', pagination, sorting, searchQuery],
    queryFn: () =>
      fetchPatients({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        searchQuery,
      }),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  const handleRowClick = (row: Patient) => {
    redirect(`/patient-management/patients/${row.id}`);
  };

  const columns = useMemo<ColumnDef<Patient>[]>(
    () => [
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader title="Patient" visibility column={column} />
        ),
        cell: ({ row }) => {
          const patient = row.original;
          const initials = getInitials(patient.name);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-8">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="font-medium text-sm">{patient.name}</div>
            </div>
          );
        },
        size: 250,
        meta: {
          headerTitle: 'Name',
          skeleton: (
            <div className="flex items-center gap-3">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          ),
        },
        enableSorting: true,
        enableHiding: false,
      },
      {
        accessorKey: 'dob',
        id: 'dob',
        header: ({ column }) => (
          <DataGridColumnHeader title="DOB" visibility column={column} />
        ),
        cell: (info) =>
          info.getValue()
            ? formatDate(new Date(info.getValue() as string))
            : '-',
        size: 150,
        meta: {
          headerTitle: 'DOB',
          skeleton: <Skeleton className="w-24 h-7" />,
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'mrn',
        id: 'mrn',
        header: ({ column }) => (
          <DataGridColumnHeader title="MRN" visibility column={column} />
        ),
        cell: (info) => info.getValue() as string,
        size: 150,
        meta: {
          headerTitle: 'MRN',
          skeleton: <Skeleton className="w-24 h-7" />,
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'insurance',
        id: 'insurance',
        header: ({ column }) => (
          <DataGridColumnHeader title="Insurance" visibility column={column} />
        ),
        cell: (info) => info.getValue() as string,
        size: 200,
        meta: {
          headerTitle: 'Insurance',
          skeleton: <Skeleton className="w-28 h-7" />,
        },
        enableSorting: true,
        enableHiding: true,
      },
      {
        accessorKey: 'actions',
        header: '',
        cell: () => (
          <ChevronRight className="text-muted-foreground/70 size-3.5" />
        ),
        meta: {
          skeleton: <Skeleton className="size-4" />,
        },
        size: 40,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  const table = useReactTable({
    columns,
    data: data?.data || [],
    pageCount: Math.ceil((data?.pagination.total || 0) / pagination.pageSize),
    getRowId: (row: Patient) => row.id,
    state: {
      pagination,
      sorting,
      columnOrder,
    },
    columnResizeMode: 'onChange',
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const DataGridToolbar = () => {
    const [inputValue, setInputValue] = useState(searchQuery);

    const handleSearch = () => {
      setSearchQuery(inputValue);
      setPagination({ ...pagination, pageIndex: 0 });
    };

    return (
      <CardHeader className="flex-col flex-wrap sm:flex-row items-stretch sm:items-center py-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search patients"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isLoading}
              className="ps-9 w-full sm:40 md:w-64"
            />
            {searchQuery.length > 0 && (
              <Button
                mode="icon"
                variant="dim"
                className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end">
          <Button
            disabled={isLoading && true}
            onClick={() => {
              setInviteDialogOpen(true);
            }}
          >
            <Plus />
            Add patient
          </Button>
        </div>
      </CardHeader>
    );
  };

  return (
    <>
      <DataGrid
        table={table}
        recordCount={data?.pagination.total || 0}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        tableLayout={{
          columnsResizable: true,
          columnsPinnable: true,
          columnsMovable: true,
          columnsVisibility: true,
        }}
        tableClassNames={{
          edgeCell: 'px-5',
        }}
      >
        <Card>
          <DataGridToolbar />
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      <PatientAddDialog
        open={inviteDialogOpen}
        closeDialog={() => setInviteDialogOpen(false)}
      />
    </>
  );
};

export default PatientList;

