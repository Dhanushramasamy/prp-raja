'use client';

import { useStore } from './store/useStore';
import Calendar from './components/Calendar';
import DataEntryForm from './components/DataEntryForm';

export default function Home() {
  const { showForm } = useStore();

  return (
    <>
      {!showForm ? <Calendar /> : <DataEntryForm />}
    </>
  );
}
