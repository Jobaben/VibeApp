import { useState } from 'react';
import StrategySelector from '../components/StrategySelector';
import ScreenerResults from '../components/ScreenerResults';
import type { ScreenerResponse } from '../types/stock';

export default function Screener() {
  const [currentView, setCurrentView] = useState<'selector' | 'results'>('selector');
  const [screenerResponse, setScreenerResponse] = useState<ScreenerResponse | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');

  const handleStrategySelect = (response: ScreenerResponse, strategyName: string) => {
    setScreenerResponse(response);
    setSelectedStrategy(strategyName);
    setCurrentView('results');
  };

  const handleBack = () => {
    setCurrentView('selector');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {currentView === 'selector' ? (
          <StrategySelector onStrategySelect={handleStrategySelect} />
        ) : (
          screenerResponse && (
            <ScreenerResults
              response={screenerResponse}
              strategyName={selectedStrategy}
              onBack={handleBack}
            />
          )
        )}
      </div>
    </div>
  );
}
