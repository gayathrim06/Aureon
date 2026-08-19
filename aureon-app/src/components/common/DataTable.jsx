import React, { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Download, Trash2, SlidersHorizontal, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';

export const DataTable = ({
  columns,
  data,
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
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder={searchPlaceholder}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 py-2 pl-9 pr-4 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {/* Bulk Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {selectedRows.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/60 px-3 py-1.5 rounded-lg border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-300">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{selectedRows.length} selected</span>
              {bulkActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => action.onClick(selectedRows)}
                  className="px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors ml-1"
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}

          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Total: <span className="font-semibold text-gray-900 dark:text-gray-100">{filteredData.length}</span> records
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 uppercase font-semibold text-[10px] tracking-wider border-b border-gray-200 dark:border-gray-700">
            <tr>
              <th className="p-3.5 w-10 text-center">
                <input
                  type="checkbox"
                  checked={paginatedData.length > 0 && selectedRows.length === paginatedData.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                />
              </th>
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  className={`p-3.5 transition-colors ${col.sortable !== false ? 'cursor-pointer hover:text-gray-900 dark:hover:text-gray-200' : ''}`}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.label}</span>
                    {sortColumn === col.key && (
                      sortDirection === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-500" /> : <ChevronDown className="w-3 h-3 text-blue-500" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
            {loading ? (
              // Skeleton Loader
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="p-3.5 text-center"><div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded mx-auto" /></td>
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="p-3.5"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" /></td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length + 1} className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center gap-2">
                    <SlidersHorizontal className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">No matching records found</p>
                    <p className="text-xs">Try adjusting your search query or filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors ${selectedRows.includes(row.id) ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}`}
                >
                  <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows.includes(row.id)}
                      onChange={() => toggleSelectRow(row.id)}
                      className="rounded border-gray-300 dark:border-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  {columns.map(col => (
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
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Page <span className="font-semibold text-gray-900 dark:text-gray-100">{currentPage}</span> of{' '}
          <span className="font-semibold text-gray-900 dark:text-gray-100">{totalPages}</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
