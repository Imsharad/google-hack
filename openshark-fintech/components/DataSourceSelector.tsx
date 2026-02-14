import React, { useState } from 'react';
import { Database, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import { seedDataSource, resetDatabase } from '../services/apiService';
import { DataSource } from '../types';

interface Props {
  onDataLoaded: () => void;
}

const SOURCES: { id: DataSource; label: string; description: string }[] = [
  { id: 'demo', label: 'Demo', description: '2 years of realistic transactions (salary, rent, coffee, etc.)' },
  { id: 'random', label: 'Random', description: '90 days of random synthetic transactions' },
  { id: 'sparkov', label: 'Sparkov', description: 'Load Sparkov CSV dataset (credit card fraud sim)' },
];

const DataSourceSelector: React.FC<Props> = ({ onDataLoaded }) => {
  const [selected, setSelected] = useState<DataSource>('demo');
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSeed = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const result = await seedDataSource(selected);
      setStatus(`Loaded${result.count ? ` ${result.count} transactions` : ''}. Insights generating in background.`);
      onDataLoaded();
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setStatus(null);
    try {
      await resetDatabase();
      setStatus('Database wiped clean.');
      onDataLoaded();
    } catch (err: any) {
      setStatus(`Reset error: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-airbnb-line p-8 shadow-card">
      <div className="flex items-center space-x-3 mb-6">
        <Database className="w-5 h-5 text-airbnb-black" />
        <h3 className="text-xl font-semibold text-airbnb-black">Data Source</h3>
      </div>

      {/* Segmented Tabs */}
      <div className="flex bg-airbnb-light rounded-lg p-1 mb-6">
        {SOURCES.map(source => (
          <button
            key={source.id}
            onClick={() => setSelected(source.id)}
            className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
              selected === source.id
                ? 'bg-white text-airbnb-black shadow-sm'
                : 'text-airbnb-gray hover:text-airbnb-black'
            }`}
          >
            {source.label}
          </button>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm text-airbnb-gray mb-6">
        {SOURCES.find(s => s.id === selected)?.description}
      </p>

      {/* Actions */}
      <div className="flex space-x-3">
        <button
          onClick={handleSeed}
          disabled={loading || resetting}
          className="flex-1 flex items-center justify-center space-x-2 bg-airbnb-black text-white py-3 rounded-lg font-medium hover:bg-airbnb-dark transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{loading ? 'Loading...' : 'Load Data'}</span>
        </button>

        <button
          onClick={handleReset}
          disabled={loading || resetting}
          className="flex items-center justify-center space-x-2 px-6 py-3 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
        >
          {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          <span>Reset</span>
        </button>
      </div>

      {/* Status */}
      {status && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${
          status.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {status}
        </div>
      )}
    </div>
  );
};

export default DataSourceSelector;
