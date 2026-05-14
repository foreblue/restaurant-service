import {
  flexRender,
  getCoreRowModel,
  type ColumnDef,
  type RowData,
  useReactTable,
} from "@tanstack/react-table";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  emptyMessage?: string;
  getRowId?: (row: TData, index: number) => string;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  emptyMessage = "표시할 데이터가 없습니다.",
  getRowId,
}: DataTableProps<TData>) {
  const options = {
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    ...(getRowId ? { getRowId } : {}),
  };

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    ...options,
  });

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th className="h-10 px-4 font-semibold" key={header.id} scope="col">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <tr className="transition hover:bg-muted/50" key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td className="h-12 px-4 align-middle" key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  className="h-20 px-4 text-center text-muted-foreground"
                  colSpan={columns.length}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
