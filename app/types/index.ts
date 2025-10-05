export type SetNumberType = 'B1' | 'B2' | 'B3' | 'B4' | 'B5' | 'B6' | 'B7' | 'B8' | 'B9' | 'B10';

export interface PoultryData {
  // Stock balance fields (user inputs)
  iruppu_normal: number; // இருப்பு சாதாரண
  iruppu_doubles: number; // இருப்பு இரட்டை
  iruppu_small: number; // இருப்பு சிறிய

  // Sales and losses (user inputs)
  direct_sales: number; // ennaikai (எணிக்கை)
  sales_breakage: number; // virpanai_udaivu (விற்பனை உடைவு)
  set_breakage: number; // set_udaivu (செட் உடைவு)
  mortality: number; // irappu (இறப்பு)
  culls_in: number; // கல்லுகள்

  // Week field
  vaaram?: string; // Week field in format "27.6"
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
  production_difference: number;
  direct_sales: number;
  sales_breakage: number;
  set_breakage: number;
  mortality_count: number;
  culls_count: number;
  ending_chickens: number;
  opening_stock: number;
  closing_stock: number;
  vaaram?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DatabasePoultryData {
  id?: string;
  date: string;
  set_number: SetNumberType;

  // Stock balance fields (user inputs)
  iruppu_normal: number;
  iruppu_doubles: number;
  iruppu_small: number;

  // Sales and losses (user inputs)
  direct_sales: number;
  sales_breakage: number;
  set_breakage: number;
  mortality: number;
  culls_in: number;

  // Week field
  vaaram?: string;
  created_at?: string;
  updated_at?: string;
}
