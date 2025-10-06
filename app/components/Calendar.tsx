'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Edit } from 'lucide-react';
import { useStore } from '../store/useStore';
import { supabase, SetNumberType } from '../lib/supabase';
import { PoultryData } from '../types';
import DataEntryForm from './DataEntryForm';

export default function CalendarView() {
  const {
    selectedDate,
    setSelectedDate,
    showForm,
    setShowForm,
    setExistingData,
    setFormData,
    setIsLoading,
    isLoading,
  } = useStore();

  const [hasData, setHasData] = useState<Record<string, boolean>>({});
  const [hasCalculatedData, setHasCalculatedData] = useState<Record<string, boolean>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check for existing data when date changes
  useEffect(() => {
    if (selectedDate) {
      checkExistingData(selectedDate);
    }
  }, [selectedDate]);

  // Check for calculated data when component mounts or when we need to refresh
  useEffect(() => {
    if (selectedDate) {
      checkCalculatedData(selectedDate);
    }
  }, [selectedDate, refreshTrigger]);

  // Auto-show form when calculated data exists (for editing existing data)
  useEffect(() => {
    if (selectedDate && Object.values(hasCalculatedData).some(exists => exists) && !showForm) {
      setShowForm(true);
    }
  }, [hasCalculatedData, selectedDate, showForm]);

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

  const checkCalculatedData = async (date: Date) => {
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('calculated_ledger')
        .select('set_number')
        .eq('date', dateStr);

      if (error) {
        console.error('Error fetching calculated data:', error);
        return;
      }

      const calculatedSets: Record<string, boolean> = {};
      data?.forEach((item) => {
        calculatedSets[item.set_number] = true;
      });
      setHasCalculatedData(calculatedSets);
    } catch (error) {
      console.error('Error:', error);
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
          iruppu_normal: 0,
          iruppu_doubles: 0,
          iruppu_small: 0,
          direct_sales: 0,
          sales_breakage: 0,
          set_breakage: 0,
          mortality: 0,
          culls_in: 0,
          vaaram: '',
        };
      });

      // Fill in existing data
      data?.forEach((item) => {
        existingDataMap[item.set_number as SetNumberType] = {
          iruppu_normal: item.iruppu_normal,
          iruppu_doubles: item.iruppu_doubles,
          iruppu_small: item.iruppu_small,
          direct_sales: item.direct_sales,
          sales_breakage: item.sales_breakage,
          set_breakage: item.set_breakage,
          mortality: item.mortality,
          culls_in: item.culls_in,
          vaaram: item.vaaram,
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

      // Check if we should show ledger automatically
      checkCalculatedData(date).then(() => {
        // If any calculated data exists, show ledger
        if (Object.values(hasCalculatedData).some(exists => exists)) {
          setShowForm(false);
        } else {
          setShowForm(true);
        }
      });
    } else {
      setShowForm(false);
      setExistingData({} as Record<SetNumberType, PoultryData>);
    }
  };

  // Function to refresh calculated data status
  const refreshCalculatedData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleNewEntry = () => {
    if (selectedDate) {
      setShowForm(true);
      // Reset form data for new entry
      setFormData({
        iruppu_normal: 0,
        iruppu_doubles: 0,
        iruppu_small: 0,
        direct_sales: 0,
        sales_breakage: 0,
        set_breakage: 0,
        mortality: 0,
        culls_in: 0,
        vaaram: '',
      });

      // Set a timeout to check for calculated data after form interaction
      setTimeout(() => {
        refreshCalculatedData();
      }, 100);
    }
  };



  // If form is showing, render DataEntryForm, otherwise show calendar
  if (showForm) {
    return <DataEntryForm />;
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 card p-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">PRP-Raja</h1>
          <p className="text-lg text-gray-600">Poultry Farm Management System</p>
        </div>

        {/* Calendar Section */}
        <div className="card p-6 mb-6">
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
                  {Object.entries(hasCalculatedData).map(([set, exists]) => (
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

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleNewEntry}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-5 w-5" />
                    Add/Edit Data
                  </button>

                </div>
              </div>
            )}
          </div>
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="text-center py-4 card p-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <p className="mt-2 text-gray-600">Loading data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
