'use client';

import { useState } from 'react';
import { Calendar, FileText, Sparkles } from 'lucide-react';
import CalendarView from './components/Calendar';
import LedgersView from './components/LedgersView';

type TabType = 'calendar' | 'ledgers';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');

  const tabs = [
    { id: 'calendar' as TabType, label: 'Data Entry', icon: Calendar },
    { id: 'ledgers' as TabType, label: 'Ledgers', icon: FileText },
  ];

  return (
    <div className="min-h-screen">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 shadow-lg border-b border-emerald-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo with icon */}
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center transform hover:rotate-12 transition-transform duration-300">
                <Sparkles className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-md">PRP-Raja</h1>
                <p className="text-xs text-emerald-50">Poultry Farm Management</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex space-x-3">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 transform hover:scale-105 ${
                      activeTab === tab.id
                        ? 'bg-white text-emerald-700 shadow-lg'
                        : 'text-white hover:bg-white/20 backdrop-blur-sm'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Tab Selector */}
            <div className="md:hidden flex gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-white text-emerald-700 shadow-lg'
                      : 'bg-white/20 text-white backdrop-blur-sm'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content with fade-in animation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'ledgers' && <LedgersView />}
      </div>
    </div>
  );
}
