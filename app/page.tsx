'use client';

import { useState } from 'react';
import { Calendar, FileText } from 'lucide-react';
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
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">PRP-Raja</h1>
              <span className="ml-2 text-sm text-gray-500">Poultry Farm Management</span>
            </div>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-green-100 text-green-700 border-b-2 border-green-500'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>

            {/* Mobile Tab Selector */}
            <div className="md:hidden">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as TabType)}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
              >
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'ledgers' && <LedgersView />}
      </div>
    </div>
  );
}
