'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Edit } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase, SetNumberType } from '../lib/supabase';
import { PoultryData } from '../types';

export default function Calendar() {
  const {
    selectedDate,
    setSelectedDate,
    setShowForm,
    setExistingData,
    setFormData,
    setIsLoading,
    isLoading,
  } = useStore();

  const [hasData, setHasData] = useState<Record<string, boolean>>({});

  // Check for existing data when date changes
  useEffect(() => {
    if (selectedDate) {
      checkExistingData(selectedDate);
    }
  }, [selectedDate]);

  const checkExistingData = async (date: Date) => {
    setIsLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_poultry_data')
        .select('set_number')
        .eq('date', dateStr);

      if (error) {
        console.error('Error fetching data:', error);
        return;
      }

      const existingSets: Record<string, boolean> = {};
      data?.forEach((item) => {
        existingSets[item.set_number] = true;
      });
      setHasData(existingSets);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadExistingData = async (date: Date) => {
    setIsLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_poultry_data')
        .select('*')
        .eq('date', dateStr);

      if (error) {
        console.error('Error loading data:', error);
        return;
      }

      const existingDataMap: Record<SetNumberType, PoultryData> = {} as Record<SetNumberType, PoultryData>;

      // Initialize all sets with default values
      const setNumbers: SetNumberType[] = ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'];
      setNumbers.forEach(set => {
        existingDataMap[set] = {
          normal_eggs: 0,
          double_eggs: 0,
          small_eggs: 0,
          direct_sales: 0,
          sales_breakage: 0,
          set_breakage: 0,
          mortality: 0,
          culls_in: 0,
        };
      });

      // Fill in existing data
      data?.forEach((item) => {
        existingDataMap[item.set_number as SetNumberType] = {
          normal_eggs: item.normal_eggs,
          double_eggs: item.double_eggs,
          small_eggs: item.small_eggs,
          direct_sales: item.direct_sales,
          sales_breakage: item.sales_breakage,
          set_breakage: item.set_breakage,
          mortality: item.mortality,
          culls_in: item.culls_in,
        };
      });

      setExistingData(existingDataMap);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date | null) => {
    setSelectedDate(date);
    if (date) {
      loadExistingData(date);
    } else {
      setShowForm(false);
      setExistingData({} as Record<SetNumberType, PoultryData>);
    }
  };

  const handleNewEntry = () => {
    if (selectedDate) {
      setShowForm(true);
      // Reset form data for new entry
      setFormData({
        normal_eggs: 0,
        double_eggs: 0,
        small_eggs: 0,
        direct_sales: 0,
        sales_breakage: 0,
        set_breakage: 0,
        mortality: 0,
        culls_in: 0,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">PRP-Raja</h1>
          <p className="text-lg text-gray-600">Poultry Farm Management System</p>
        </div>

        {/* Calendar Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <CalendarIcon className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-semibold text-gray-800">Select Date</h2>
          </div>

          <div className="flex flex-col items-center gap-4">
            <DatePicker
              selected={selectedDate}
              onChange={handleDateSelect}
              dateFormat="dd/MM/yyyy"
              className="w-full max-w-xs p-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none text-lg"
              placeholderText="Select a date"
            />

            {selectedDate && (
              <div className="text-center">
                <p className="text-lg text-gray-700 mb-2">
                  Selected: <span className="font-semibold">{format(selectedDate, 'dd/MM/yyyy')}</span>
                </p>

                {/* Show existing data status */}
                <div className="flex flex-wrap gap-2 justify-center mb-4">
                  {Object.entries(hasData).map(([set, exists]) => (
                    <div
                      key={set}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        exists
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {set} {exists ? <Edit className="inline h-3 w-3 ml-1" /> : <Plus className="inline h-3 w-3 ml-1" />}
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleNewEntry}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  Add/Edit Data
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
