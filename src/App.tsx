import { useState } from 'react';
import { ApiKeyStatus } from './components/ApiKeyStatus';
import { PlayerExplorer } from './components/PlayerExplorer';
import { SeasonStats } from './components/SeasonStats';
import { GamesBrowser } from './components/GamesBrowser';
import { AlertTriangle, Database, Info, Trophy, User, X, Calendar } from 'lucide-react';


type Tab = 'players' | 'stats' | 'games';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('players');
  const [apiStatus, setApiStatus] = useState<'connected' | 'error' | 'not_set'>('not_set');
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [triggerRecheck, setTriggerRecheck] = useState(0);

  const handleError = (message: string) => {
    setGlobalError(message);
    // Automatically dismiss error after 8 seconds
    setTimeout(() => {
      setGlobalError((prev) => (prev === message ? null : prev));
    }, 8000);
  };

  const handleApiKeyStatusChange = (status: 'connected' | 'error' | 'not_set') => {
    setApiStatus(status);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-orange-500/30 selection:text-orange-400">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute top-10 right-1/4 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none"></div>

      {/* Main Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center font-bold text-slate-950 shadow-md shadow-orange-500/20">
              🏀
            </div>
            <div>
              <h1 className="font-extrabold text-lg md:text-xl text-slate-100 flex items-center gap-2 leading-none">
                NBA Stats Explorer
              </h1>
              <span className="text-4xs font-black tracking-widest text-orange-400 uppercase mt-1 block">
                Historical Database & Averages
              </span>
            </div>
          </div>

          <div className="text-4xs font-bold text-slate-500 flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl uppercase tracking-wider">
            <Database className="w-3 h-3 text-orange-500" />
            1946–PRESENT
          </div>
        </div>
      </header>

      {/* Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 z-10">
        
        {/* API Status Panel */}
        <ApiKeyStatus 
          onStatusChange={handleApiKeyStatusChange} 
          triggerCheckKey={triggerRecheck} 
        />

        {/* Global Error Banner */}
        {globalError && (
          <div className="relative glass-panel bg-rose-500/10 border-rose-500/20 text-rose-300 px-4 py-4 rounded-2xl flex items-start gap-3 shadow-lg shadow-rose-500/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 pr-6">
              <span className="font-bold text-sm block">System Alert</span>
              <p className="text-xs text-rose-400/90 mt-1 leading-relaxed">{globalError}</p>
            </div>
            <button
              onClick={() => setGlobalError(null)}
              className="absolute right-3.5 top-3.5 p-1 bg-slate-900/60 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Missing API Key call to action */}
        {apiStatus !== 'connected' && (
          <div className="glass-panel rounded-2xl p-6 text-center max-w-2xl mx-auto space-y-4 border border-orange-500/20 shadow-lg shadow-orange-500/5">
            <Info className="w-8 h-8 text-orange-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-200">API Key Required</h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
              To proceed with player stats and games queries, please enter your balldontlie.io API key in the connection panel above, or use the pre-configured key.
            </p>
            <button 
              onClick={() => setTriggerRecheck(prev => prev + 1)}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white rounded-xl font-bold transition duration-200 text-xs shadow-md shadow-orange-500/10"
            >
              Retry Connection Check
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        {apiStatus === 'connected' && (
          <div className="space-y-6">
            <div className="flex border-b border-slate-900 gap-1.5 p-1.5 bg-slate-950/60 border border-slate-900 rounded-2xl overflow-x-auto max-w-max">
              <button
                onClick={() => setActiveTab('players')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'players'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <User className="w-4 h-4" />
                Player Explorer
              </button>

              <button
                onClick={() => setActiveTab('stats')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'stats'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Trophy className="w-4 h-4" />
                Season Stats Card
              </button>

              <button
                onClick={() => setActiveTab('games')}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap ${
                  activeTab === 'games'
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Games Browser
              </button>
            </div>

            {/* Tab Panels */}
            <div className="animate-in fade-in duration-300 slide-in-from-top-1.5">
              {activeTab === 'players' && <PlayerExplorer onError={handleError} />}
              {activeTab === 'stats' && <SeasonStats onError={handleError} />}
              {activeTab === 'games' && <GamesBrowser onError={handleError} />}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/80 bg-slate-950 py-8 mt-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-400">NBA Stats Explorer</span>
            <span>|</span>
            <span>Historical Database v1.0</span>
          </div>
          <div className="text-center md:text-right">
            <span>Data provided by </span>
            <a
              href="https://www.balldontlie.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-500/90 hover:text-orange-400 transition-colors font-bold"
            >
              balldontlie.io
            </a>
            <span>. Not affiliated with the NBA.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
