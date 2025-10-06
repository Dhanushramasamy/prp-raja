'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Save,
  FileText,
  ArrowLeft,
  Plus,
  Minus,
  Calculator
} from 'lucide-react';
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
  direct_sales: 'Ennaikai (எணிக்கை) - Direct Sales',
  sales_breakage: 'Virpanai Udaivu (விற்பனை உடைவு)',
  set_breakage: 'Set Udaivu (செட் உடைவு)',
  mortality: 'Irappu (இறப்பு) - Mortality',
  culls_in: 'Culls (கல்லுகள்)',
};

export default function DataEntryForm() {
  const {
    selectedDate,
    selectedSet,
    setSelectedSet,
    formData,
    setFormData,
    existingData,
    setShowForm,
    setIsSaving,
    isSaving,
    setSelectedDate,
  } = useStore();

  const [activeTab, setActiveTab] = useState<SetNumberType>('B1');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setNumbers: SetNumberType[] = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'];

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
        direct_sales: 0,
        sales_breakage: 0,
        set_breakage: 0,
        mortality: 0,
        culls_in: 0,
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
        // Refresh existing data
        window.location.reload();
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
      // First save the raw data
      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      const dataToSave = {
        date: dateStr,
        set_number: activeTab,
        ...formData,
      };

      const { error: rawDataError } = await supabase
        .from('daily_poultry_data')
        .upsert(dataToSave, {
          onConflict: 'date,set_number',
        });

      if (rawDataError) {
        console.error('Error saving raw data:', rawDataError);
        alert('Error saving data. Please try again.');
        return;
      }

      // Then calculate and save the ledger data
      const calculationResult = await calculateLedgerData(selectedDate, activeTab, formData);

      await saveCalculatedData(calculationResult.calculatedData);

          alert('Data saved and ledger generated successfully!');

          // Stay on the form for potential additional entries
          // Users can navigate to Ledgers tab to view all data

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
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setShowForm(false);
                  // Refresh the calendar's calculated data status
                  if (selectedDate) {
                    setSelectedDate(new Date(selectedDate));
                  }
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to Calendar
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Data Entry - {format(selectedDate, 'dd/MM/yyyy')}
                </h1>
                <p className="text-gray-600">Enter poultry data for each set</p>
              </div>
            </div>
          </div>
        </div>

        {/* Set Selection Tabs */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {setNumbers.map((set) => (
              <button
                key={set}
                onClick={() => setActiveTab(set)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === set
                    ? 'bg-green-600 text-white'
                    : existingData[set] && Object.values(existingData[set]).some(v => v > 0)
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
                  <label className="block text-sm font-medium text-gray-700">
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
                    className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData[key as keyof PoultryData] || ''}
                    onChange={(e) => handleInputChange(key as keyof PoultryData, e.target.value)}
                    className={`flex-1 p-3 border-2 rounded-lg focus:outline-none transition-colors ${
                      errors[key]
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:border-green-500'
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
                      className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  {errors[key] && (
                    <p className="text-sm text-red-600">{errors[key]}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 pt-6 border-t">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              {isSaving ? 'Saving...' : 'Save Data'}
            </button>

            <button
              onClick={handleGenerate}
              disabled={isSaving}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Calculator className="h-5 w-5" />
              {isSaving ? 'Generating...' : 'Save & Generate Ledger'}
            </button>
          </div>

          {/* Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-800 mb-2">Current Entry Summary:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>Total Stock: <span className="font-semibold">{formData.iruppu_normal + formData.iruppu_doubles + formData.iruppu_small}</span></div>
              <div>Direct Sales: <span className="font-semibold">{formData.direct_sales}</span></div>
              <div>Total Loss: <span className="font-semibold">{formData.sales_breakage + formData.set_breakage + formData.mortality}</span></div>
              <div>Culls In: <span className="font-semibold">{formData.culls_in}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
