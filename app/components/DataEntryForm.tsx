'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Save, ArrowLeft, Plus, Minus, Calculator } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase, SetNumberType } from '../lib/supabase';
import { PoultryData } from '../types';
import { calculateLedgerData, saveCalculatedData } from '../lib/calculations';

const FIELD_LABELS = {
  // Stock balance fields (these are the actual inputs)
  iruppu_normal: 'Iruppu Normal (இருப்பு சாதாரண)',
  iruppu_doubles: 'Iruppu Doubles (இருப்பு இரட்டை)',
  iruppu_small: 'Iruppu Small (இருப்பு சிறிய)',

  // Sales and losses
  direct_sales_normal: 'Direct Sales - Normal',
  direct_sales_doubles: 'Direct Sales - Doubles',
  direct_sales_small: 'Direct Sales - Small',
  sales_breakage: 'Virpanai Udaivu (விற்பனை உடைவு)',
  set_breakage: 'Set Udaivu (செட் உடைவு)',
  // Removed global breakage fields
  mortality: 'Irappu (இறப்பு) - Mortality',
  culls_in: 'Culls (கல்லுகள்)',
  in_count: 'IN',

  // W.B
  normal_wb: 'Normal - W.B',
  doubles_wb: 'Doubles - W.B',
  small_wb: 'Small - W.B',
  virpanaiyalar: 'Virpanaiyalar (Vendor Name)',
};

export default function DataEntryForm() {
  const {
    selectedDate,
    // selectedSet,
    // setSelectedSet,
    formData,
    setFormData,
    existingData,
    setExistingData,
    setShowForm,
    setIsSaving,
    isSaving,
    // setSelectedDate,
  } = useStore();

  const [activeTab, setActiveTab] = useState<SetNumberType>('B1');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setNumbers: SetNumberType[] = ['A3', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'];

  // Update form data when switching tabs
  useEffect(() => {
    if (existingData[activeTab]) {
      setFormData(existingData[activeTab]);
    } else {
      // Reset to default values for new entry
      setFormData({
        iruppu_normal: 0,
        iruppu_doubles: 0,
        iruppu_small: 0,
        direct_sales_normal: 0,
        direct_sales_doubles: 0,
        direct_sales_small: 0,
        sales_breakage: 0,
        set_breakage: 0,
        mortality: 0,
        culls_in: 0,
        in_count: 0,
        normal_wb: 0,
        doubles_wb: 0,
        small_wb: 0,
      });
    }
  }, [activeTab, existingData, setFormData]);

  const handleInputChange = (field: keyof PoultryData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData({ [field]: numValue });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation - ensure non-negative numbers (skip vaaram which is a string)
    Object.keys(formData).forEach(key => {
      const value = formData[key as keyof PoultryData];
      if (key !== 'vaaram' && typeof value === 'number' && value < 0) {
        newErrors[key] = 'Cannot be negative';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!selectedDate || !validateForm()) return;

    setIsSaving(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const dataToSave = {
        date: dateStr,
        set_number: activeTab,
        ...formData,
      };

      const { error } = await supabase
        .from('daily_poultry_data')
        .upsert(dataToSave, {
          onConflict: 'date,set_number',
        });

      if (error) {
        console.error('Error saving data:', error);
        alert('Error saving data. Please try again.');
      } else {
        alert('Data saved successfully!');
        // Update existing data locally to avoid full page reload
        const updatedExisting = { ...existingData };
        updatedExisting[activeTab] = { ...formData };
        setExistingData(updatedExisting);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedDate || !validateForm()) return;

    setIsSaving(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // 1) Ensure current active set's latest inputs are saved
      const dataToSave = {
        date: dateStr,
        set_number: activeTab,
        ...formData,
      };
      const { error: rawDataError } = await supabase
        .from('daily_poultry_data')
        .upsert(dataToSave, { onConflict: 'date,set_number' });
      if (rawDataError) {
        console.error('Error saving raw data:', rawDataError);
        alert('Error saving data. Please try again.');
        return;
      }

      // 2) Load ALL saved sets for the selected date
      const { data: allSetsData, error: fetchError } = await supabase
        .from('daily_poultry_data')
        .select('*')
        .eq('date', dateStr);
      if (fetchError) {
        console.error('Error fetching sets for generation:', fetchError);
        alert('Error preparing ledger generation. Please try again.');
        return;
      }

      // 3) For each saved set, calculate and save its ledger
      const results = await Promise.all(
        (allSetsData || []).map(async (row) => {
          const calc = await calculateLedgerData(selectedDate, row.set_number as SetNumberType, {
            iruppu_normal: row.iruppu_normal,
            iruppu_doubles: row.iruppu_doubles,
            iruppu_small: row.iruppu_small,
            direct_sales_normal: row.direct_sales_normal,
            direct_sales_doubles: row.direct_sales_doubles,
            direct_sales_small: row.direct_sales_small,
            sales_breakage: row.sales_breakage,
            set_breakage: row.set_breakage,
            mortality: row.mortality,
            culls_in: row.culls_in,
            in_count: row.in_count,
            normal_wb: row.normal_wb,
            doubles_wb: row.doubles_wb,
            small_wb: row.small_wb,
            vaaram: row.vaaram,
          });
          await saveCalculatedData(calc.calculatedData);
          return calc.calculatedData.set_number;
        })
      );

      alert(`Ledger generated for ${results.length} set(s) on ${format(selectedDate, 'dd/MM/yyyy')}.`);
    } catch (error) {
      console.error('Error:', error);
      alert('Error saving data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedDate) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="card p-6 mb-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <button
            onClick={() => {
              console.log('Back to Calendar clicked');
              setShowForm(false);
            }}
            type="button"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all font-medium cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Calendar
          </button>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Data Entry - {format(selectedDate, 'dd/MM/yyyy')}
            </h1>
            <p className="text-gray-600 font-medium">Enter poultry data for each set</p>
          </div>
        </div>
      </div>

      {/* Set Selection Tabs */}
      <div className="card p-6 mb-6 animate-fade-in">
        <div className="flex flex-wrap gap-3 mb-6">
          {setNumbers.map((set) => (
            <button
              key={set}
              onClick={() => setActiveTab(set)}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all transform hover:scale-105 ${
                activeTab === set
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                  : existingData[set] && Object.values(existingData[set]).some(v => v > 0)
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {set} {existingData[set] && Object.values(existingData[set]).some(v => v > 0) && <Plus className="inline h-3 w-3 ml-1" />}
            </button>
          ))}
        </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(FIELD_LABELS).map(([key, label]) => {
              // Handle all fields as number inputs
              return (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-bold text-gray-800">
                    {label}
                  </label>
                  <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const currentValue = formData[key as keyof PoultryData];
                      if (typeof currentValue === 'number') {
                        handleInputChange(key as keyof PoultryData, String(currentValue - 0.01));
                      }
                    }}
                    className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 flex items-center justify-center shadow-sm transition-all transform hover:scale-105"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData[key as keyof PoultryData] || ''}
                    onChange={(e) => handleInputChange(key as keyof PoultryData, e.target.value)}
                    className={`flex-1 p-3 border-2 rounded-xl focus:outline-none focus:ring-4 transition-all font-semibold text-base ${
                      errors[key]
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                        : 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-100'
                    }`}
                    placeholder="0"
                  />
                    <button
                      type="button"
                      onClick={() => {
                        const currentValue = formData[key as keyof PoultryData];
                        if (typeof currentValue === 'number') {
                          handleInputChange(key as keyof PoultryData, String(currentValue + 0.01));
                        }
                      }}
                      className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 flex items-center justify-center shadow-md transition-all transform hover:scale-105"
                    >
                      <Plus className="h-5 w-5 text-white" />
                    </button>
                  </div>
                  {errors[key] && (
                    <p className="text-sm text-red-600 font-medium">{errors[key]}</p>
                  )}
                </div>
              );
            })}
          </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t-2 border-emerald-100">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-300 disabled:to-blue-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <Save className="h-6 w-6" />
            {isSaving ? 'Saving...' : 'Save Data'}
          </button>

          <button
            onClick={handleGenerate}
            disabled={isSaving}
            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-emerald-300 disabled:to-teal-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
          >
            <Calculator className="h-6 w-6" />
            {isSaving ? 'Generating...' : 'Save & Generate Ledger'}
          </button>
        </div>

        {/* Summary */}
        <div className="mt-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 shadow-inner">
          <h3 className="font-bold text-gray-900 mb-4 text-lg">Current Entry Summary:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white/70 rounded-lg p-3 shadow-sm">
              <div className="text-gray-600 font-medium">Total Stock</div>
              <div className="text-2xl font-bold text-emerald-700">{formData.iruppu_normal + formData.iruppu_doubles + formData.iruppu_small}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 shadow-sm">
              <div className="text-gray-600 font-medium">Direct Sales (Total)</div>
              <div className="text-2xl font-bold text-blue-700">{(formData.direct_sales_normal || 0) + (formData.direct_sales_doubles || 0) + (formData.direct_sales_small || 0)}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 shadow-sm">
              <div className="text-gray-600 font-medium">Total Loss</div>
              <div className="text-2xl font-bold text-orange-700">{formData.mortality}</div>
            </div>
            <div className="bg-white/70 rounded-lg p-3 shadow-sm">
              <div className="text-gray-600 font-medium">Culls In</div>
              <div className="text-2xl font-bold text-purple-700">{formData.culls_in}</div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
