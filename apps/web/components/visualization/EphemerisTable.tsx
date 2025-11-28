'use client';

import { useEffect, useState, memo } from 'react';

interface EphemerisPoint {
  datetime_jd: string;
  calendar_date: string;
  ra: number;
  dec: number;
  delta: number;
  deldot: number;
  mag: number | null;
  phase_angle: number | null;
}

interface EphemerisTableProps {
  isoId: string;
}

export function EphemerisTable({ isoId }: EphemerisTableProps) {
  const [data, setData] = useState<EphemerisPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof EphemerisPoint>('calendar_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Date range state
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });

  useEffect(() => {
    const fetchEphemeris = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          start_date: startDate,
          end_date: endDate,
          step_size: '1d',
        });

        const response = await fetch(`/api/iso/${isoId}/ephemeris?${params}`);

        if (!response.ok) {
          throw new Error('Failed to fetch ephemeris data');
        }

        const result = await response.json();
        setData(result.ephemeris || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load ephemeris data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEphemeris();
  }, [isoId, startDate, endDate]);

  const handleSort = (column: keyof EphemerisPoint) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return sortDirection === 'asc'
      ? (aVal < bVal ? -1 : 1)
      : (aVal > bVal ? -1 : 1);
  });

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold mb-4">Ephemeris Data</h3>
        <div className="animate-pulse space-y-3">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-100 rounded"></div>
          <div className="h-8 bg-gray-100 rounded"></div>
          <div className="h-8 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg p-6 border border-red-200">
        <h3 className="text-lg font-bold mb-2 text-red-700">Error Loading Data</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-bold mb-2">No Data Available</h3>
        <p className="text-gray-600">No ephemeris data available for the selected date range.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 sm:p-6 border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
        <h3 className="text-lg font-bold text-gray-900">Ephemeris Data</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          <div className="flex items-center gap-2">
            <label className="text-gray-900 font-medium">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-gray-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-gray-900 font-medium">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('calendar_date')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                title="Observation date and time"
              >
                Date {sortColumn === 'calendar_date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('ra')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                title="Right Ascension - Celestial longitude (degrees)"
              >
                RA (°) {sortColumn === 'ra' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('dec')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                title="Declination - Celestial latitude (degrees)"
              >
                Dec (°) {sortColumn === 'dec' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('delta')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                title="Distance from observer in Astronomical Units (Earth-Sun distance)"
              >
                Distance (AU) {sortColumn === 'delta' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('mag')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                title="Visual magnitude - Brightness (lower = brighter)"
              >
                Mag {sortColumn === 'mag' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('phase_angle')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                title="Sun-Object-Observer angle in degrees"
              >
                Phase (°) {sortColumn === 'phase_angle' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((point, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {new Date(point.calendar_date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {point.ra.toFixed(4)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {point.dec.toFixed(4)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-medium">
                  {point.delta.toFixed(4)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {point.mag !== null ? point.mag.toFixed(2) : 'n/a'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {point.phase_angle !== null ? point.phase_angle.toFixed(2) : 'n/a'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 border rounded text-sm ${
                    page === currentPage
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Tooltips Legend */}
      <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
        <p className="font-semibold mb-1">Column Definitions:</p>
        <ul className="space-y-1">
          <li><strong>RA/Dec:</strong> Celestial coordinates (like latitude/longitude in space)</li>
          <li><strong>AU:</strong> Astronomical Units (1 AU = Earth-Sun distance, ~150 million km)</li>
          <li><strong>Mag:</strong> Visual magnitude (brightness scale: lower = brighter, negative = very bright)</li>
          <li><strong>Phase:</strong> Sun-Object-Observer angle (0° = backlit, 180° = fully illuminated)</li>
        </ul>
      </div>
    </div>
  );
}

// Memoized export for performance
export const EphemerisTableMemo = memo(EphemerisTable);
