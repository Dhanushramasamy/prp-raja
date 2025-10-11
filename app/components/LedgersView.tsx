'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { format, subDays, addDays } from 'date-fns';
import { Calendar as CalendarIcon, Download, Search, Eye, ChevronLeft, ChevronRight, Image } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CalculatedLedger } from '../types';

// Extend window interface for html2canvas
declare global {
  interface Window {
    html2canvas: any;
  }
}

type RawRow = {
  iruppu_normal: number;
  iruppu_doubles: number;
  iruppu_small: number;
  in_count: number;
  direct_sales: number; // aggregated convenience
  direct_sales_normal: number;
  direct_sales_doubles: number;
  direct_sales_small: number;
  normal_wb: number;
  doubles_wb: number;
  small_wb: number;
  sales_breakage: number;
  set_breakage: number;
  mortality: number;
  culls_in: number;
  virpanaiyalar?: string;
};

export default function LedgersView() {
  const [ledgerData, setLedgerData] = useState<CalculatedLedger[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [setFilter, setSetFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLedger, setSelectedLedger] = useState<CalculatedLedger | null>(null);
  const [rawByKey, setRawByKey] = useState<Record<string, RawRow>>({});

  // Effects are placed after callbacks to avoid use-before-define

  const loadLedgerData = useCallback(async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('calculated_ledger')
        .select('*')
        .eq('date', dateStr)
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
  }, [selectedDate]);

  const loadRawData = useCallback(async () => {
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('daily_poultry_data')
        .select('date,set_number,iruppu_normal,iruppu_doubles,iruppu_small,in_count,direct_sales_normal,direct_sales_doubles,direct_sales_small,normal_wb,doubles_wb,small_wb,sales_breakage,set_breakage,mortality,culls_in,virpanaiyalar')
        .eq('date', dateStr);

      if (error) {
        console.error('Error loading raw data:', error);
        return;
      }

      const map: Record<string, RawRow> = {};
      (data || []).forEach((row) => {
        const key = `${row.date}|${row.set_number}`;
        map[key] = {
          iruppu_normal: row.iruppu_normal || 0,
          iruppu_doubles: row.iruppu_doubles || 0,
          iruppu_small: row.iruppu_small || 0,
          in_count: row.in_count || 0,
          direct_sales: (row.direct_sales_normal || 0) + (row.direct_sales_doubles || 0) + (row.direct_sales_small || 0),
          direct_sales_normal: row.direct_sales_normal || 0,
          direct_sales_doubles: row.direct_sales_doubles || 0,
          direct_sales_small: row.direct_sales_small || 0,
          normal_wb: row.normal_wb || 0,
          doubles_wb: row.doubles_wb || 0,
          small_wb: row.small_wb || 0,
          sales_breakage: row.sales_breakage || 0,
          set_breakage: row.set_breakage || 0,
          mortality: row.mortality || 0,
          culls_in: row.culls_in || 0,
          virpanaiyalar: row.virpanaiyalar,
        };
      });
      setRawByKey(map);
    } catch (error) {
      console.error('Error:', error);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadLedgerData();
    loadRawData();
  }, [loadLedgerData, loadRawData]);

  // Date navigation functions
  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Helper function to extract serial number from vaaram
  const getSerialNumber = (vaaram: string | undefined): number => {
    if (!vaaram || !vaaram.includes('.')) return 0;
    const [weekStr, dayStr] = vaaram.split('.');
    const week = parseInt(weekStr, 10);
    const day = parseInt(dayStr, 10);
    if (isNaN(week) || isNaN(day)) return 0;
    return week * 7 + day; // Convert to serial number
  };

  const filteredData = ledgerData.filter((ledger) => {
    const matchesSearch = searchTerm === '' ||
      ledger.set_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ledger.vaaram && ledger.vaaram.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSet = setFilter === 'all' || ledger.set_number === setFilter;

    return matchesSearch && matchesSet;
  });

  // Get all sets in order as they appear in physical sheet
  const allSets = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'A3'] as const;
  
  // Get the latest date's data for each set
  const latestData = allSets.map(setNumber => {
    const setData = filteredData.find(ledger => ledger.set_number === setNumber);
    return setData;
  }).filter(Boolean) as CalculatedLedger[];

  const exportToCSV = () => {
    const headers = [
      'Date', 'Set', 'Vaaram', 'Starting Chickens', 'Starting Eggs', 'Normal Production',
      'Double Production', 'Small Production', 'Total Production', 'Production %',
      'Production Difference', 'Direct Sales',
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
        '',
        '',
        '',
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
    a.download = `ledger-${format(selectedDate, 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadAsImage = async () => {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        alert('This feature is only available in the browser');
        return;
      }

      // Use a different approach - try to load html2canvas from CDN
      if (!window.html2canvas) {
        // Load html2canvas from CDN
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
        script.onload = () => {
          captureAndDownload();
        };
        script.onerror = () => {
          alert('Failed to load html2canvas library. Please try again.');
        };
        document.head.appendChild(script);
        return;
      }

      captureAndDownload();
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Error downloading image. Please try again.');
    }
  };

  const captureAndDownload = async () => {
    try {
      const tableElement = document.getElementById('ledger-table');
      if (!tableElement) {
        alert('Table not found');
        return;
      }

      // Create canvas with simplified options to avoid CSS parsing issues
      const canvas = await window.html2canvas(tableElement, {
        backgroundColor: '#ffffff',
        scale: 1.5, // Slightly lower resolution to avoid issues
        useCORS: false,
        allowTaint: false,
        foreignObjectRendering: false,
        logging: false,
        // Remove problematic CSS before rendering
        onclone: (clonedDoc: Document) => {
          // Remove all style elements that might contain lab() colors
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach((style: Element) => style.remove());
          
          // Add simple inline styles
          const simpleStyle = clonedDoc.createElement('style');
          simpleStyle.textContent = `
            * { 
              font-family: Arial, sans-serif !important; 
              color: #000000 !important;
            }
            table { 
              border-collapse: collapse !important; 
              width: 100% !important;
            }
            th, td { 
              border: 1px solid #cccccc !important; 
              padding: 4px !important; 
              text-align: center !important;
            }
            .bg-gray-50 { background-color: #f5f5f5 !important; }
            .bg-blue-50 { background-color: #e6f3ff !important; }
            .bg-green-50 { background-color: #e6ffe6 !important; }
            .bg-yellow-50 { background-color: #fffacd !important; }
            .bg-purple-50 { background-color: #f0e6ff !important; }
            .bg-gray-100 { background-color: #e0e0e0 !important; }
          `;
          clonedDoc.head.appendChild(simpleStyle);
        }
      });

      // Convert to blob and download
      canvas.toBlob((blob: Blob | null) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `ledger-sheet-${format(selectedDate, 'yyyy-MM-dd')}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }, 'image/png', 0.95);
    } catch (error) {
      console.error('Error capturing image:', error);
      alert('Error capturing image. Please try again.');
    }
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
            {format(selectedDate, 'dd/MM/yyyy')} - {filteredData.length} records across all sets
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

      {/* Date Selection Controls */}
      <div className="card p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousDay}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" />
              <input
                type="date"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <button
              onClick={goToNextDay}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Next Day"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Today
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Physical Sheet Style Ledger Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table id="ledger-table" className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                {/* Set Column */}
                <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  Set
                </th>
                
                {/* கோழி (Chicken) Section */}
                <th colSpan={7} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50 border-r">
                  கோழி (Chicken)
                </th>
                
                {/* முட்டை உற்பத்தி (Egg Production) Section */}
                <th colSpan={7} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50 border-r">
                  முட்டை உற்பத்தி (Egg Production)
                </th>
                
                {/* விற்பனை (Sales) Section */}
                <th colSpan={4} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-yellow-50 border-r">
                  விற்பனை (Sales)
                </th>
                
                {/* இருப்பு (Stock) Section */}
                <th colSpan={4} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-purple-50">
                  இருப்பு (Stock)
                </th>
              </tr>
              
              {/* Sub-headers */}
              <tr className="bg-gray-100">
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">Set</th>
                
                {/* கோழி sub-headers */}
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">பதிவு எண்</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">வாரம்</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">ஆரம்பம்</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">இறப்பு</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">CULLS</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">IN</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">முடிவு</th>
                
                {/* முட்டை உற்பத்தி sub-headers */}
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">ஆரம்பம்</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">Normal</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">Doubles</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">Small</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">மொத்த உற்பத்தி</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">வித்தியாசம்</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">சதவிகிதம்</th>
                
                {/* விற்பனை sub-headers */}
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">விற்பனையாளர்</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">எண்ணிக்கை</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">விற்பனை உடைவு</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">செட்</th>
                
                {/* இருப்பு sub-headers */}
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">Normal</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">Doubles</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700 border-r">Small</th>
                <th className="px-2 py-2 text-center text-xs font-medium text-gray-700">மொத்த இருப்பு</th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-200">
              {allSets.map((setNumber) => {
                const ledger = filteredData.find(l => l.set_number === setNumber);
                const key = ledger ? `${ledger.date}|${ledger.set_number}` : '';
                const raw = key ? rawByKey[key] : null;
                
                return (
                  <tr key={setNumber} className="hover:bg-gray-50">
                    {/* Set */}
                    <td className="px-2 py-3 text-center text-xs font-medium text-gray-900 border-r">
                      {setNumber}
                    </td>
                    
                    {/* கோழி (Chicken) data */}
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      -
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {ledger?.vaaram || '-'}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {ledger?.starting_chickens || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {ledger?.mortality_count || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {ledger?.culls_count || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {raw?.in_count || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {ledger?.ending_chickens || 0}
                    </td>
                    
                    {/* முட்டை உற்பத்தி (Egg Production) data */}
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {ledger?.starting_eggs || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {ledger?.normal_production || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {ledger?.double_production || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {ledger?.small_production || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r font-medium">
                      {ledger?.total_production || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {ledger?.production_difference || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {ledger?.production_percentage || 0}%
                    </td>
                    
                    {/* விற்பனை (Sales) data */}
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {raw?.virpanaiyalar || '-'}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {(raw?.direct_sales_normal || 0) + (raw?.direct_sales_doubles || 0) + (raw?.direct_sales_small || 0)}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {raw?.sales_breakage || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {raw?.set_breakage || 0}
                    </td>
                    
                    {/* இருப்பு (Stock) data */}
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {raw?.iruppu_normal || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {raw?.iruppu_doubles || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 border-r">
                      {raw?.iruppu_small || 0}
                    </td>
                    <td className="px-2 py-3 text-center text-xs text-gray-900 font-medium">
                      {ledger?.closing_stock || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Download Options */}
      <div className="flex justify-center gap-4">
        <button
          onClick={downloadAsImage}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Image className="h-5 w-5" />
          Download as Image
        </button>
      </div>

      {/* Detailed Ledger View Modal */}
      {selectedLedger && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[95vh] overflow-y-auto">
            <div className="p-3 sm:p-6">
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

              {/* Reordered details as requested */}
              {(() => {
                const key = `${selectedLedger.date}|${selectedLedger.set_number}`;
                const raw = rawByKey[key] || {
                  iruppu_normal: 0,
                  iruppu_doubles: 0,
                  iruppu_small: 0,
                  in_count: 0,
                  direct_sales: 0,
                  sales_breakage: 0,
                  set_breakage: 0,
                  mortality: 0,
                  culls_in: 0,
                };
                return (
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                        <div className="text-center">
                          <div className="font-medium text-gray-700">வாரம்</div>
                          <div className="text-base sm:text-lg font-bold text-blue-600">{selectedLedger.vaaram}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">கோழி ஆரம்பம்</div>
                          <div className="text-base sm:text-lg font-bold">{selectedLedger.starting_chickens}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">கோழி இறப்பு</div>
                          <div className="text-base sm:text-lg font-bold">{selectedLedger.mortality_count}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">கோழி Culls</div>
                          <div className="text-base sm:text-lg font-bold">{selectedLedger.culls_count}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">கோழி IN</div>
                          <div className="text-base sm:text-lg font-bold">{raw.in_count}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">கோழி முடிவு</div>
                          <div className="text-base sm:text-lg font-bold">{selectedLedger.ending_chickens}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                        <div className="text-center">
                          <div className="font-medium text-gray-700">முட்டை ஆரம்பம்</div>
                          <div className="text-base sm:text-lg font-bold">{selectedLedger.starting_eggs}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">சாதாரண உற்பத்தி</div>
                          <div className="text-base sm:text-lg font-bold">{selectedLedger.normal_production}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">இரட்டை உற்பத்தி</div>
                          <div className="text-base sm:text-lg font-bold">{selectedLedger.double_production}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">சிறிய உற்பத்தி</div>
                          <div className="text-base sm:text-lg font-bold">{selectedLedger.small_production}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">மொத்த உற்பத்தி (முட்டை)</div>
                          <div className="text-base sm:text-lg font-bold">{selectedLedger.total_production}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">உற்பத்தி வித்தியாசம்</div>
                          <div className="text-base sm:text-lg font-bold">{selectedLedger.production_difference > 0 ? '+' : ''}{selectedLedger.production_difference}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">உற்பத்தி %</div>
                          <div className="text-base sm:text-lg font-bold">{selectedLedger.production_percentage}%</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                        <div className="text-center">
                          <div className="font-medium text-gray-700">விற்பனையாளர்</div>
                          <div className="text-base sm:text-lg font-bold">{raw.virpanaiyalar || '-'}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">Sales Normal</div>
                          <div className="text-base sm:text-lg font-bold">{raw.direct_sales_normal}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">Sales Doubles</div>
                          <div className="text-base sm:text-lg font-bold">{raw.direct_sales_doubles}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">Sales Small</div>
                          <div className="text-base sm:text-lg font-bold">{raw.direct_sales_small}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">Normal W.B</div>
                          <div className="text-base sm:text-lg font-bold">{raw.normal_wb}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">Doubles W.B</div>
                          <div className="text-base sm:text-lg font-bold">{raw.doubles_wb}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">Small W.B</div>
                          <div className="text-base sm:text-lg font-bold">{raw.small_wb}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">Virpanai Udaivu</div>
                          <div className="text-base sm:text-lg font-bold">{raw.sales_breakage}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">Set Udaivu</div>
                          <div className="text-base sm:text-lg font-bold">{raw.set_breakage}</div>
                        </div>
                        {/* Breakage columns removed from calculated ledger */}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm">
                        <div className="text-center">
                          <div className="font-medium text-gray-700">இருப்பு Normal</div>
                          <div className="text-base sm:text-lg font-bold">{raw.iruppu_normal}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">இருப்பு Doubles</div>
                          <div className="text-base sm:text-lg font-bold">{raw.iruppu_doubles}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">இருப்பு Small</div>
                          <div className="text-base sm:text-lg font-bold">{raw.iruppu_small}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">முடிவு இருப்பு</div>
                          <div className="text-base sm:text-lg font-bold">{selectedLedger.closing_stock}</div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                        <div className="text-center">
                          <div className="font-medium text-gray-700">Date</div>
                          <div className="text-sm sm:text-base font-medium">{format(new Date(selectedLedger.date), 'dd/MM/yyyy')}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">Set Number</div>
                          <div className="text-sm sm:text-base font-medium">{selectedLedger.set_number}</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-gray-700">வாரம்</div>
                          <div className="text-sm sm:text-base font-medium text-blue-600">{selectedLedger.vaaram}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {filteredData.length === 0 && (
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
