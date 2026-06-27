import React, { useState } from 'react';
import { searchPlayers, getSeasonAverages, Player, SeasonAverage, ApiError } from '../services/api';
import { Search, BarChart3, Users, AlertCircle, ChevronRight, User } from 'lucide-react';

interface SeasonStatsProps {
  onError: (msg: string) => void;
}

export const SeasonStats: React.FC<SeasonStatsProps> = ({ onError }) => {
  const [playerName, setPlayerName] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<number>(2024);
  const [loading, setLoading] = useState(false);
  
  // State for disambiguation
  const [matchingPlayers, setMatchingPlayers] = useState<Player[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  
  // State for selected player and stats
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [stats, setStats] = useState<SeasonAverage | null>(null);
  const [searched, setSearched] = useState(false);

  // Generate season list
  const currentYear = new Date().getFullYear();
  const seasons = Array.from({ length: currentYear - 1946 + 1 }, (_, i) => currentYear - i);

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    setLoading(true);
    setMatchingPlayers([]);
    setShowPicker(false);
    setActivePlayer(null);
    setStats(null);
    setSearched(false);

    try {
      // 1. Search for matching players
      const response = await searchPlayers(playerName, undefined, 50); // Get up to 50 matches for picker
      const data = response.data;

      if (data.length === 0) {
        setSearched(true);
      } else if (data.length === 1) {
        // Exact match - bypass picker
        const player = data[0];
        setActivePlayer(player);
        await fetchAverages(player.id, selectedSeason);
      } else {
        // Multiple matches - show picker
        setMatchingPlayers(data);
        setShowPicker(true);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        onError(err.message);
      } else {
        onError('An error occurred during search.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePickPlayer = async (player: Player) => {
    setShowPicker(false);
    setActivePlayer(player);
    setLoading(true);
    try {
      await fetchAverages(player.id, selectedSeason);
    } catch (err) {
      if (err instanceof ApiError) {
        onError(err.message);
      } else {
        onError('Failed to fetch season stats.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchAverages = async (playerId: number, season: number) => {
    const avgRes = await getSeasonAverages(season, [playerId]);
    if (avgRes.data && avgRes.data.length > 0) {
      setStats(avgRes.data[0]);
    } else {
      setStats(null);
    }
    setSearched(true);
  };

  const formatPercentage = (val: number | undefined): string => {
    if (val === undefined || val === null) return '—';
    if (val >= 0 && val <= 1) {
      return `${(val * 100).toFixed(1)}%`;
    }
    return `${val.toFixed(1)}%`;
  };

  const formatStatValue = (val: string | number | undefined): string => {
    if (val === undefined || val === null) return '—';
    if (typeof val === 'number') return val.toFixed(1);
    return val.toString();
  };

  return (
    <div className="space-y-6">
      {/* Search Bar & Season Picker */}
      <form onSubmit={handleSearchSubmit} className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row gap-4 items-stretch md:items-end">
        <div className="flex-1 space-y-2">
          <label htmlFor="player-input" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Player Name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="player-input"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="e.g. Kobe Bryant, Shaquille, James..."
              className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-orange-500 focus:outline-none text-slate-100 placeholder:text-slate-500 transition-colors"
            />
          </div>
        </div>

        <div className="w-full md:w-48 space-y-2">
          <label htmlFor="season-picker" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Season</label>
          <select
            id="season-picker"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            className="w-full text-sm px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl font-semibold focus:outline-none focus:border-orange-500"
          >
            {seasons.map((year) => (
              <option key={year} value={year}>
                {year}–{(year + 1).toString().slice(-2)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading || !playerName.trim()}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl font-bold transition duration-200 text-sm flex items-center justify-center gap-2 whitespace-nowrap text-white"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin"></span>
          ) : (
            <Search className="w-4 h-4" />
          )}
          Fetch Stats
        </button>
      </form>

      {/* Disambiguation Picker */}
      {showPicker && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-start gap-3 text-slate-300">
            <Users className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-100">Multiple Players Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                Several players matched your search for "{playerName}". Select the player you'd like to inspect for the {selectedSeason}–{(selectedSeason + 1).toString().slice(-2)} season:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {matchingPlayers.map((player) => (
              <button
                key={player.id}
                onClick={() => handlePickPlayer(player)}
                className="w-full text-left p-3.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/60 rounded-xl transition duration-150 flex items-center justify-between group"
              >
                <div>
                  <div className="font-semibold text-sm text-slate-200 group-hover:text-orange-400 transition-colors">
                    {player.first_name} {player.last_name}
                  </div>
                  <div className="text-3xs font-medium text-slate-500 mt-1 flex gap-2">
                    <span>{player.team?.full_name || 'No team'}</span>
                    {player.position && <span>• {player.position}</span>}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-orange-500 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {loading && !showPicker && (
        <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4">
          <span className="w-8 h-8 border-4 border-slate-800 border-t-orange-500 rounded-full animate-spin"></span>
          <p className="text-sm text-slate-400">Fetching statistics...</p>
        </div>
      )}

      {/* Stats Display Grid */}
      {searched && activePlayer && !loading && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 flex items-center justify-between relative overflow-hidden">
            <div className="absolute right-0 top-0 w-32 h-32 bg-orange-500/5 blur-[60px] rounded-full pointer-events-none"></div>
            <div>
              <span className="text-2xs font-extrabold bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Season Stats Card
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-100 mt-2">
                {activePlayer.first_name} {activePlayer.last_name}
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-1">
                Season: {selectedSeason}–{(selectedSeason + 1).toString().slice(-2)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-orange-400/90">{activePlayer.team?.abbreviation || '—'}</span>
              <span className="text-xs text-slate-500 font-semibold block">{activePlayer.position || '—'}</span>
            </div>
          </div>

          {stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-2xs font-bold text-slate-400 tracking-wider">POINTS</span>
                <span className="text-2xl font-black text-orange-400 mt-2">{formatStatValue(stats.pts)}</span>
                <span className="text-3xs text-slate-500 mt-1">per game</span>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-2xs font-bold text-slate-400 tracking-wider">REBOUNDS</span>
                <span className="text-2xl font-black text-slate-200 mt-2">{formatStatValue(stats.reb)}</span>
                <span className="text-3xs text-slate-500 mt-1">per game</span>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-2xs font-bold text-slate-400 tracking-wider">ASSISTS</span>
                <span className="text-2xl font-black text-slate-200 mt-2">{formatStatValue(stats.ast)}</span>
                <span className="text-3xs text-slate-500 mt-1">per game</span>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-2xs font-bold text-slate-400 tracking-wider">STEALS</span>
                <span className="text-2xl font-black text-slate-200 mt-2">{formatStatValue(stats.stl)}</span>
                <span className="text-3xs text-slate-500 mt-1">per game</span>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-2xs font-bold text-slate-400 tracking-wider">BLOCKS</span>
                <span className="text-2xl font-black text-slate-200 mt-2">{formatStatValue(stats.blk)}</span>
                <span className="text-3xs text-slate-500 mt-1">per game</span>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-2xs font-bold text-slate-400 tracking-wider">TURNOVERS</span>
                <span className="text-2xl font-black text-slate-200 mt-2">{formatStatValue(stats.turnover)}</span>
                <span className="text-3xs text-slate-500 mt-1">per game</span>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-2xs font-bold text-slate-400 tracking-wider">FIELD GOAL %</span>
                <span className="text-2xl font-black text-slate-200 mt-2">{formatPercentage(stats.fg_pct)}</span>
                <span className="text-3xs text-slate-500 mt-1">shooting efficiency</span>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-2xs font-bold text-slate-400 tracking-wider">3PT GOAL %</span>
                <span className="text-2xl font-black text-slate-200 mt-2">{formatPercentage(stats.fg3_pct)}</span>
                <span className="text-3xs text-slate-500 mt-1">from beyond the arc</span>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-2xs font-bold text-slate-400 tracking-wider">FREE THROW %</span>
                <span className="text-2xl font-black text-slate-200 mt-2">{formatPercentage(stats.ft_pct)}</span>
                <span className="text-3xs text-slate-500 mt-1">from charity stripe</span>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                <span className="text-2xs font-bold text-slate-400 tracking-wider">MINUTES</span>
                <span className="text-2xl font-black text-slate-200 mt-2">{stats.min || '0.0'}</span>
                <span className="text-3xs text-slate-500 mt-1">played per game</span>
              </div>

              <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1 md:col-span-2 lg:col-span-2 bg-slate-900/30">
                <span className="text-2xs font-bold text-slate-400 tracking-wider">GAMES PLAYED</span>
                <span className="text-2xl font-black text-slate-200 mt-2">{stats.games_played || '0'}</span>
                <span className="text-3xs text-slate-500 mt-1">total appearances</span>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl p-8 text-center text-sm text-slate-400 border border-slate-800">
              No stats averages found for {activePlayer.first_name} {activePlayer.last_name} in {selectedSeason}–{(selectedSeason + 1).toString().slice(-2)}.
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {searched && !activePlayer && !loading && (
        <div className="glass-panel rounded-2xl p-10 text-center max-w-md mx-auto border border-slate-800">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-5 h-5 text-slate-500" />
          </div>
          <h3 className="font-bold text-slate-200 text-base">No players found</h3>
          <p className="text-xs text-slate-400 mt-1.5">
            We couldn't find any players matching "{playerName}". Double-check spelling and try again.
          </p>
        </div>
      )}

      {/* Instructions state */}
      {!searched && !loading && !showPicker && (
        <div className="glass-panel rounded-2xl p-8 text-center max-w-lg mx-auto border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto text-orange-500">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-200">Stat Lookup</h3>
          <p className="text-xs text-slate-400">
            Type in a player's name and choose a season to pull their aggregate averages cards instantly. If multiple players match, you will be prompted to choose the exact player.
          </p>
        </div>
      )}
    </div>
  );
};
