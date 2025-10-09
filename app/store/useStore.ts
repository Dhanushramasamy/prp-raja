import { create } from 'zustand';
import { SetNumberType, PoultryData } from '../types';

interface Store {
  // Calendar state
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;

  // Data entry state
  selectedSet: SetNumberType;
  setSelectedSet: (set: SetNumberType) => void;

  // Form data
  formData: PoultryData;
  setFormData: (data: Partial<PoultryData>) => void;
  resetFormData: () => void;

  // Existing data for selected date
  existingData: Record<SetNumberType, PoultryData>;
  setExistingData: (data: Record<SetNumberType, PoultryData>) => void;

  // UI state
  showForm: boolean;
  setShowForm: (show: boolean) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  isSaving: boolean;
  setIsSaving: (saving: boolean) => void;
}

const initialFormData: PoultryData = {
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
  vaaram: '',
  virpanaiyalar: '',
};

export const useStore = create<Store>((set) => ({
  // Calendar state
  selectedDate: null,
  setSelectedDate: (date) => set({ selectedDate: date }),

  // Data entry state
  selectedSet: 'B1',
  setSelectedSet: (setNumber) => set({ selectedSet: setNumber }),

  // Form data
  formData: initialFormData,
  setFormData: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),
  resetFormData: () => set({ formData: initialFormData }),

  // Existing data for selected date
  existingData: {} as Record<SetNumberType, PoultryData>,
  setExistingData: (data) => set({ existingData: data }),

  // UI state
  showForm: false,
  setShowForm: (show) => set({ showForm: show }),

  // Loading states
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  isSaving: false,
  setIsSaving: (saving) => set({ isSaving: saving }),
}));
