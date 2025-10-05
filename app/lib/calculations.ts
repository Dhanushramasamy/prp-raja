import { PoultryData, CalculatedLedger, SetNumberType } from '../types';
import { supabase } from './supabase';
import { format, subDays } from 'date-fns';

export interface CalculationResult {
  calculatedData: CalculatedLedger;
  previousData?: {
    ending_chickens: number;
    total_production: number;
    closing_stock: number;
    iruppu_normal: number;
    iruppu_doubles: number;
    iruppu_small: number;
  };
}

export async function calculateLedgerData(
  date: Date,
  setNumber: SetNumberType,
  currentData: PoultryData
): Promise<CalculationResult> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const previousDate = subDays(date, 1);
  const previousDateStr = format(previousDate, 'yyyy-MM-dd');

  // Get previous day's data for calculations
  const { data: previousLedgerData } = await supabase
    .from('calculated_ledger')
    .select('*')
    .eq('date', previousDateStr)
    .eq('set_number', setNumber)
    .single();

  // Get previous day's raw data for iruppu values
  const { data: previousRawData } = await supabase
    .from('daily_poultry_data')
    .select('iruppu_normal, iruppu_doubles, iruppu_small')
    .eq('date', previousDateStr)
    .eq('set_number', setNumber)
    .single();

  // Prepare previous data
  const previousData = {
    ending_chickens: previousLedgerData?.ending_chickens || 0,
    total_production: previousLedgerData?.total_production || 0,
    closing_stock: previousLedgerData?.closing_stock || 0,
    iruppu_normal: previousRawData?.iruppu_normal || 0,
    iruppu_doubles: previousRawData?.iruppu_doubles || 0,
    iruppu_small: previousRawData?.iruppu_small || 0,
  };

  // Calculate all fields
  const calculatedData: CalculatedLedger = {
    date: dateStr,
    set_number: setNumber,

    // Starting values
    starting_chickens: previousData.ending_chickens,
    starting_eggs: previousData.closing_stock,

    // Production calculations
    normal_production: calculateNormalProduction(currentData, previousData),
    double_production: calculateDoubleProduction(currentData, previousData),
    small_production: calculateSmallProduction(currentData, previousData),
    total_production: 0, // Will be calculated after individual productions

    // Production metrics
    production_percentage: 0, // Will be calculated after total production
    production_difference: previousData.total_production - 0, // Will be updated after total production

    // Sales & Losses (direct from input)
    direct_sales: currentData.direct_sales,
    sales_breakage: currentData.sales_breakage,
    set_breakage: currentData.set_breakage,
    mortality_count: currentData.mortality,
    culls_count: currentData.culls_in,

    // Ending chickens
    ending_chickens: calculateEndingChickens(currentData, previousData),

    // Stock tracking
    opening_stock: previousData.closing_stock,
    closing_stock: calculateClosingStock(currentData),

    // Week field
    vaaram: currentData.vaaram,
  };

  // Calculate total production
  calculatedData.total_production =
    calculatedData.normal_production +
    calculatedData.double_production +
    calculatedData.small_production;

  // Calculate production percentage
  calculatedData.production_percentage = calculateProductionPercentage(
    calculatedData.total_production,
    previousData.ending_chickens
  );

  // Calculate production difference
  calculatedData.production_difference =
    previousData.total_production - calculatedData.total_production;

  return {
    calculatedData,
    previousData,
  };
}

// Individual calculation functions
function calculateNormalProduction(current: PoultryData, previous: any): number {
  const totalLosses = current.direct_sales + current.sales_breakage + current.set_breakage;
  return current.iruppu_normal + totalLosses - previous.iruppu_normal;
}

function calculateDoubleProduction(current: PoultryData, previous: any): number {
  const totalLosses = current.direct_sales + current.sales_breakage + current.set_breakage;
  return current.iruppu_doubles + totalLosses - previous.iruppu_doubles;
}

function calculateSmallProduction(current: PoultryData, previous: any): number {
  const totalLosses = current.direct_sales + current.sales_breakage + current.set_breakage;
  return current.iruppu_small + totalLosses - previous.iruppu_small;
}

function calculateProductionPercentage(totalProduction: number, previousEndingChickens: number): number {
  if (previousEndingChickens === 0) return 0;
  const percentage = (totalProduction * 30) / previousEndingChickens * 100;
  return Math.round(percentage * 100) / 100; // Round to 2 decimal places
}

function calculateEndingChickens(current: PoultryData, previous: any): number {
  return previous.ending_chickens - current.mortality + current.culls_in;
}

function calculateClosingStock(current: PoultryData): number {
  return current.iruppu_normal + current.iruppu_doubles + current.iruppu_small;
}

export async function saveCalculatedData(calculatedData: CalculatedLedger): Promise<void> {
  const { error } = await supabase
    .from('calculated_ledger')
    .upsert(calculatedData, {
      onConflict: 'date,set_number',
    });

  if (error) {
    console.error('Error saving calculated data:', error);
    throw new Error('Failed to save calculated data');
  }
}
