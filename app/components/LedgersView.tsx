'use client';

import React, { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { Calendar as CalendarIcon, Download, Search, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CalculatedLedger } from '../types';

export default function LedgersView() {
  const [ledgerData, setLedgerData] = useState<CalculatedLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [setFilter, setSetFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [selectedLedger, setSelectedLedger] = useState<CalculatedLedger | null>(null);

  useEffect(() => {
    loadLedgerData();
  }, [dateFrom, dateTo]);

  const loadLedgerData = async () => {
    setLoading(true);
    try {
      const fromStr = format(dateFrom, 'yyyy-MM-dd');
      const toStr = format(dateTo, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('calculated_ledger')
        .select('*')
        .gte('date', fromStr)
        .lte('date', toStr)
        .order('date', { ascending: false })
        .order('set_number');

      if (error) {
        console.error('Error loading ledger data:', error);
        return;
      }

      setLedgerData(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = ledgerData.filter((ledger) => {
    const matchesSearch = searchTerm === '' ||
      ledger.set_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ledger.vaaram && ledger.vaaram.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSet = setFilter === 'all' || ledger.set_number === setFilter;

    return matchesSearch && matchesSet;
  });

  // Group filtered data by date
  const groupedData = filteredData.reduce((groups, ledger) => {
    const dateKey = ledger.date;
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(ledger);
    return groups;
  }, {} as Record<string, CalculatedLedger[]>);

  // Sort dates in descending order (newest first)
  const sortedDates = Object.keys(groupedData).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const exportToCSV = () => {
    const headers = [
      'Date', 'Set', 'Vaaram', 'Starting Chickens', 'Starting Eggs', 'Normal Production',
      'Double Production', 'Small Production', 'Total Production', 'Production %',
      'Production Difference', 'Direct Sales', 'Sales Breakage', 'Set Breakage',
      'Mortality', 'Culls', 'Ending Chickens', 'Opening Stock', 'Closing Stock'
    ];

    const csvContent = [
      headers.join(','),
      ...filteredData.map(ledger => [
        ledger.date,
        ledger.set_number,
        ledger.vaaram || '',
        ledger.starting_chickens,
        ledger.starting_eggs,
        ledger.normal_production,
        ledger.double_production,
        ledger.small_production,
        ledger.total_production,
        ledger.production_percentage,
        ledger.production_difference,
        ledger.direct_sales,
        ledger.sales_breakage,
        ledger.set_breakage,
        ledger.mortality_count,
        ledger.culls_count,
        ledger.ending_chickens,
        ledger.opening_stock,
        ledger.closing_stock
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-${format(dateFrom, 'yyyy-MM-dd')}-to-${format(dateTo, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const uniqueSets = Array.from(new Set(ledgerData.map(ledger => ledger.set_number))).sort();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Loading ledger data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Ledger Reports</h2>
          <p className="text-gray-600">
            {format(dateFrom, 'dd/MM/yyyy')} - {format(dateTo, 'dd/MM/yyyy')}
            ({filteredData.length} records in {sortedDates.length} {sortedDates.length === 1 ? 'day' : 'days'})
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              type="date"
              value={format(dateFrom, 'yyyy-MM-dd')}
              onChange={(e) => setDateFrom(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              type="date"
              value={format(dateTo, 'yyyy-MM-dd')}
              onChange={(e) => setDateTo(new Date(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Set Filter</label>
            <select
              value={setFilter}
              onChange={(e) => setSetFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Sets</option>
              {uniqueSets.map(set => (
                <option key={set} value={set}>{set}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sets or vaaram..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grouped Ledger Data by Date */}
      <div className="space-y-6">
        {sortedDates.map((dateKey) => {
          const dateEntries = groupedData[dateKey];
          const dateObj = new Date(dateKey);

          return (
            <div key={dateKey} className="card overflow-hidden">
              {/* Date Header */}
              <div className="bg-white/70 backdrop-blur-sm px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {format(dateObj, 'dd/MM/yyyy')}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {dateEntries.length} {dateEntries.length === 1 ? 'entry' : 'entries'}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Total Production: {dateEntries.reduce((sum, entry) => sum + entry.total_production, 0)}
                  </div>
                </div>
              </div>

              {/* Entries Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Set</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vaaram</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Production</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales & Losses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dateEntries.map((ledger) => (
                      <tr key={`${ledger.date}-${ledger.set_number}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {ledger.set_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {ledger.vaaram && <span className="text-blue-600 font-medium">{ledger.vaaram} (virpanaiyalar)</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>Total: {ledger.total_production}</div>
                            <div className="text-xs text-gray-500">
                              {ledger.production_percentage}% diff
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>Sales: {ledger.direct_sales}</div>
                            <div>Breakage: {ledger.sales_breakage + ledger.set_breakage}</div>
                            <div>Mortality: {ledger.mortality_count}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div>Open: {ledger.opening_stock}</div>
                            <div className="font-medium">Close: {ledger.closing_stock}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => setSelectedLedger(ledger)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Ledger View Modal */}
      {selectedLedger && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Ledger Sheet Details</h2>
                  <p className="text-gray-600">
                    {format(new Date(selectedLedger.date), 'dd/MM/yyyy')} - Set {selectedLedger.set_number}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLedger(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Template Sheet Order - Left to Right */}
              <div className="grid grid-cols-1 gap-4">
                {/* Row 1: Basic Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-9 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-gray-700">Set</div>
                      <div className="text-lg font-bold">{selectedLedger.set_number}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">ஆரம்ப கோழி</div>
                      <div className="text-lg font-bold">{selectedLedger.starting_chickens}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">ஆரம்ப முட்டை</div>
                      <div className="text-lg font-bold">{selectedLedger.starting_eggs}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">சாதாரண உற்பத்தி</div>
                      <div className="text-lg font-bold">{selectedLedger.normal_production}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">இரட்டை உற்பத்தி</div>
                      <div className="text-lg font-bold">{selectedLedger.double_production}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">சிறிய உற்பத்தி</div>
                      <div className="text-lg font-bold">{selectedLedger.small_production}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">மொத்த உற்பத்தி</div>
                      <div className="text-lg font-bold">{selectedLedger.total_production}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">உற்பத்தி %</div>
                      <div className="text-lg font-bold">{selectedLedger.production_percentage}%</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">உற்பத்தி வித்தியாசம்</div>
                      <div className="text-lg font-bold">{selectedLedger.production_difference > 0 ? '+' : ''}{selectedLedger.production_difference}</div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Sales & Losses */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-9 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-gray-700">எணிக்கை</div>
                      <div className="text-lg font-bold">{selectedLedger.direct_sales}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">விற்பனை உடைவு</div>
                      <div className="text-lg font-bold">{selectedLedger.sales_breakage}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">செட் உடைவு</div>
                      <div className="text-lg font-bold">{selectedLedger.set_breakage}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">இறப்பு</div>
                      <div className="text-lg font-bold">{selectedLedger.mortality_count}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">கல்லுகள்</div>
                      <div className="text-lg font-bold">{selectedLedger.culls_count}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">முடிவு கோழி</div>
                      <div className="text-lg font-bold">{selectedLedger.ending_chickens}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">தொடக்க இருப்பு</div>
                      <div className="text-lg font-bold">{selectedLedger.opening_stock}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">முடிவு இருப்பு</div>
                      <div className="text-lg font-bold">{selectedLedger.closing_stock}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">வாரம்</div>
                      <div className="text-lg font-bold text-blue-600">{selectedLedger.vaaram}</div>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-gray-700">Date</div>
                      <div className="text-base font-medium">{format(new Date(selectedLedger.date), 'dd/MM/yyyy')}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">Set Number</div>
                      <div className="text-base font-medium">{selectedLedger.set_number}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-medium text-gray-700">வாரம் (virpanaiyalar)</div>
                      <div className="text-base font-medium text-blue-600">{selectedLedger.vaaram}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {sortedDates.length === 0 && (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No ledger data found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || setFilter !== 'all'
              ? 'Try adjusting your filters or date range.'
              : 'Generate some ledger data first.'}
          </p>
        </div>
      )}
    </div>
  );
}
