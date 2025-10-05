export type SetNumberType = 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7' | 'B8' | 'B9' | 'B10';

export interface PoultryData {
  normal_eggs: number;
  double_eggs: number;
  small_eggs: number;
  direct_sales: number; // ennaikai (எணிக்கை)
  sales_breakage: number; // virpanai_udaivu (விற்பனை உடைவு)
  set_breakage: number; // set_udaivu (செட் உடைவு)
  mortality: number; // irappu (இறப்பு)
  culls_in: number;
}

export interface CalculatedLedger {
  id?: string;
  date: string;
  set_number: SetNumberType;
  starting_chickens: number;
  starting_eggs: number;
  normal_production: number;
  double_production: number;
  small_production: number;
  total_production: number;
  production_percentage: number;
  direct_sales: number;
  sales_breakage: number;
  set_breakage: number;
  total_sales_breakage: number;
  mortality_count: number;
  culls_count: number;
  ending_chickens: number;
  ending_eggs: number;
  opening_stock: number;
  closing_stock: number;
  stock_difference: number;
  total_eggs_available: number;
  net_eggs_after_losses: number;
  created_at?: string;
  updated_at?: string;
}

export interface DatabasePoultryData {
  id?: string;
  date: string;
  set_number: SetNumberType;
  normal_eggs: number;
  double_eggs: number;
  small_eggs: number;
  direct_sales: number;
  sales_breakage: number;
  set_breakage: number;
  mortality: number;
  culls_in: number;
  created_at?: string;
  updated_at?: string;
}
