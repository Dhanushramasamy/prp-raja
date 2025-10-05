'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Eye, Download, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase, SetNumberType } from '../lib/supabase';
import { CalculatedLedger } from '../types';

interface LedgerViewProps {
  date: Date;
  onBack: () => void;
}

export default function LedgerView({ date, onBack }: LedgerViewProps) {
  const { selectedSet } = useStore();
  const [ledgerData, setLedgerData] = useState<Record<SetNumberType, CalculatedLedger>>({} as Record<SetNumberType, CalculatedLedger>);
  const [loading, setLoading] = useState(true);
  const [activeSet, setActiveSet] = useState<SetNumberType>('B1');

  useEffect(() => {
    loadLedgerData();
  }, [date]);

  const loadLedgerData = async () => {
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('calculated_ledger')
        .select('*')
        .eq('date', dateStr);

      if (error) {
        console.error('Error loading ledger data:', error);
        return;
      }

      const ledgerMap: Record<SetNumberType, CalculatedLedger> = {} as Record<SetNumberType, CalculatedLedger>;

      // Initialize all sets with default values
      const setNumbers: SetNumberType[] = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'];
      setNumbers.forEach(set => {
        ledgerMap[set] = {
          starting_chickens: 0,
          starting_eggs: 0,
          normal_production: 0,
          double_production: 0,
          small_production: 0,
          total_production: 0,
          production_percentage: 0,
          production_difference: 0,
          direct_sales: 0,
          sales_breakage: 0,
          set_breakage: 0,
          mortality_count: 0,
          culls_count: 0,
          ending_chickens: 0,
          opening_stock: 0,
          closing_stock: 0,
          vaaram: '',
        } as CalculatedLedger;
      });

      // Fill in actual data
      data?.forEach((item) => {
        ledgerMap[item.set_number as SetNumberType] = item as CalculatedLedger;
      });

      setLedgerData(ledgerMap);
    } catch (error) {
      console.error('Error loading ledger data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentLedger = ledgerData[activeSet];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-4"></div>
          <p className="text-gray-600">Loading ledger data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  onBack();
                  // Also refresh calculated data when going back
                  window.location.reload();
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Calendar
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  PRP-Raja Ledger - {format(date, 'dd/MM/yyyy')}
                </h1>
                <p className="text-gray-600">Calculated poultry farm ledger data</p>
              </div>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>

        {/* Set Selection Tabs */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-2 mb-6">
            {(['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'] as SetNumberType[]).map((set) => (
              <button
                key={set}
                onClick={() => setActiveSet(set)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeSet === set
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {set}
              </button>
            ))}
          </div>

          {/* Ledger Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Chickens */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">கோழி (CHICKENS)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">ஆரம்பம் (Starting):</span>
                    <span className="font-semibold">{currentLedger?.starting_chickens || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">இறப்பு (Mortality):</span>
                    <span className="font-semibold text-red-600">{currentLedger?.mortality_count || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">கல்லுகள் (Culls):</span>
                    <span className="font-semibold text-green-600">{currentLedger?.culls_count || 0}</span>
                  </div>
                  <hr className="border-gray-300" />
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-semibold">முடிவு (Ending):</span>
                    <span className="font-bold text-lg">{currentLedger?.ending_chickens || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Egg Production */}
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">முட்டை உற்பத்தி (EGG PRODUCTION)</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700">ஆரம்பம் (Starting):</span>
                    <span className="font-semibold">{currentLedger?.starting_eggs || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">சாதாரண (Normal):</span>
                    <span className="font-semibold">{currentLedger?.normal_production || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">இரட்டை (Double):</span>
                    <span className="font-semibold">{currentLedger?.double_production || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">சிறிய (Small):</span>
                    <span className="font-semibold">{currentLedger?.small_production || 0}</span>
                  </div>
                  <hr className="border-gray-300" />
                  <div className="flex justify-between">
                    <span className="text-gray-700 font-semibold">மொத்த உற்பத்தி (Total):</span>
                    <span className="font-bold text-lg">{currentLedger?.total_production || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">உற்பத்தி சதவீதம் (%):</span>
                    <span className="font-semibold">{currentLedger?.production_percentage || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">உற்பத்தி வித்தியாசம்:</span>
                    <span className="font-semibold">{currentLedger?.production_difference || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section - Sales & Stock */}
            <div className="lg:col-span-2 space-y-6">
              {/* Sales & Breakage */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">விற்பனை மற்றும் உடைவு (SALES & BREAKAGE)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">எணிக்கை (Direct Sales)</div>
                    <div className="text-xl font-bold text-blue-600">{currentLedger?.direct_sales || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">விற்பனை உடைவு (Sales Breakage)</div>
                    <div className="text-xl font-bold text-orange-600">{currentLedger?.sales_breakage || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">செட் உடைவு (Set Breakage)</div>
                    <div className="text-xl font-bold text-red-600">{currentLedger?.set_breakage || 0}</div>
                  </div>
                </div>
              </div>

              {/* Stock */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">இருப்பு (STOCK)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">தொடக்க இருப்பு (Opening)</div>
                    <div className="text-xl font-bold">{currentLedger?.opening_stock || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">முடிவு இருப்பு (Closing)</div>
                    <div className="text-xl font-bold text-green-600">{currentLedger?.closing_stock || 0}</div>
                  </div>
                </div>
              </div>

              {/* Week Info */}
              {currentLedger?.vaaram && (
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-sm text-gray-600">வாரம் (Week)</div>
                  <div className="text-xl font-bold text-blue-600">{currentLedger.vaaram} (virpanaiyalar)</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
