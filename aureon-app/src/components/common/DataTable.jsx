import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Download, Trash2, SlidersHorizontal, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';

export const DataTable = ({
  columns = [],
  data = [],
  searchPlaceholder = 'Search records...',
  bulkActions = [],
  loading = false,
  onRowClick
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedRows, setSelectedRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Normalizing Column Properties
  const normalizedColumns = useMemo(() => {
    return columns.map(c => ({
      key: c.key || c.accessor || c.id || c.header,
      label: c.label || c.header || c.name || '',
      render: c.render || c.cell,
      sortable: c.sortable !== false
    }));
  }, [columns]);

  // Search & Sorting Filter logic
  const filteredData = useMemo(() => {
    const safeData = Array.isArray(data) ? data : [];
    let result = [...safeData];

    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(item =>
        Object.values(item).some(val =>
          String(val).toLowerCase().includes(query)
        )
      );
    }

    if (sortColumn) {
      result.sort((a, b) => {
        const valA = a[sortColumn];
        const valB = b[sortColumn];
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortColumn, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const handleSort = (key) => {
    if (sortColumn === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(key);
      setSortDirection('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === paginatedData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(paginatedData.map(d => d.id));
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 warm:bg-[#e8dbbe] rounded-xl border border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] shadow-sm overflow-hidden transition-colors">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] bg-slate-50 dark:bg-slate-900 warm:bg-[#f3e8d2] py-2 pl-9 pr-4 text-xs text-slate-900 dark:text-slate-100 warm:text-[#342314] focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/60 warm:bg-[#f3e8d2] px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 warm:border-[#b8a074] text-xs font-semibold text-indigo-700 dark:text-indigo-300 warm:text-[#b45309]">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{selectedRows.length} selected</span>
              {bulkActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => action.onClick(selectedRows)}
                  className="px-2 py-0.5 rounded bg-indigo-600 warm:bg-[#b45309] text-white hover:opacity-90 transition-colors ml-1"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <div className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c] font-medium">
            Total: <span className="font-semibold text-slate-900 dark:text-slate-100 warm:text-[#342314]">{filteredData.length}</span> records
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900/80 warm:bg-[#f3e8d2] text-slate-700 dark:text-slate-300 warm:text-[#342314] uppercase font-bold text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800 warm:border-[#cbb68e]">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={paginatedData.length > 0 && selectedRows.length === paginatedData.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              {normalizedColumns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`p-3.5 transition-colors ${col.sortable !== false ? 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-100' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {sortColumn === col.key && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-500" /> : <ChevronDown className="w-3 h-3 text-indigo-500" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 warm:divide-[#cbb68e] text-slate-800 dark:text-slate-200 warm:text-[#342314]">
            {loading ? (
              // Skeleton Loader
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-3.5 text-center"><div className="h-4 w-4 bg-slate-200 dark:bg-slate-700 rounded mx-auto" /></td>
                  {normalizedColumns.map((_, cIdx) => (
                    <td key={cIdx} className="p-3.5"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={normalizedColumns.length + 1} className="p-8 text-center text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
                  <div className="flex flex-col items-center gap-2">
                    <SlidersHorizontal className="w-8 h-8 text-slate-400" />
                    <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 warm:text-[#342314]">No matching records found</p>
                    <p className="text-xs">Try adjusting your search query or filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 warm:hover:bg-[#f3e8d2]/60 transition-colors ${selectedRows.includes(row.id) ? 'bg-indigo-50/50 dark:bg-indigo-950/40 warm:bg-[#f3e8d2]' : ''}`}
                >
                  <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => toggleSelectRow(row.id)}
                      className="rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                  </td>
                  {normalizedColumns.map(col => (
                    <td key={col.key} className="p-3.5">
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 warm:border-[#cbb68e] flex items-center justify-between">
        <span className="text-xs text-slate-500 dark:text-slate-400 warm:text-[#69523c]">
          Page <span className="font-semibold text-slate-900 dark:text-slate-100 warm:text-[#342314]">{currentPage}</span> of{' '}
          <span className="font-semibold text-slate-900 dark:text-slate-100 warm:text-[#342314]">{totalPages}</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 warm:hover:bg-[#f3e8d2] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 warm:border-[#b8a074] disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 warm:hover:bg-[#f3e8d2] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
