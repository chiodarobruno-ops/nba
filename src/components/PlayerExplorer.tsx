import React, { useState, useEffect } from 'react';
import { searchPlayers, getSeasonAverages, getPlayerStats, Player, SeasonAverage, GameLog, ApiError } from '../services/api';
import { Search, ChevronLeft, ChevronRight, User, BarChart3, History, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface PlayerExplorerProps {
  onError: (msg: string) => void;
}

export const PlayerExplorer: React.FC<PlayerExplorerProps> = ({ onError }) => {
  // Search state
  const [query, setQuery] = useState('');
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Pagination state (cursor-based)
  const [cursors, setCursors] = useState<(number | undefined)[]>([undefined]);
  const [pageIndex, setPageIndex] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined);

  // Detailed View state
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<number>(2024);
  const [statsLoading, setStatsLoading] = useState(false);
  const [averages, setAverages] = useState<SeasonAverage | null>(null);
  const [gameLogs, setGameLogs] = useState<GameLog[]>([]);

  // Generate season list from 1946 to current year (newest first)
  const currentYear = new Date().getFullYear();
  const seasons = Array.from({ length: currentYear - 1946 + 1 }, (_, i) => currentYear - i);

  // Trigger search on query
  const handleSearch = async (e?: React.FormEvent, targetCursor?: number, pageIdx = 0) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const response = await searchPlayers(query, targetCursor);
      setPlayers(response.data);
      setNextCursor(response.meta?.next_cursor);
      setSearched(true);
      setLastSearchedQuery(query);
      
      if (pageIdx === 0) {
        setCursors([undefined, response.meta?.next_cursor]);
        setPageIndex(0);
      } else {
        setPageIndex(pageIdx);
        // Save the next cursor in history if not already present
        if (pageIdx >= cursors.length - 1) {
          setCursors(prev => {
            const copy = [...prev];
            copy[pageIdx + 1] = response.meta?.next_cursor;
            return copy;
          });
        }
      }
    } catch (err) {
      if (err instanceof ApiError) {
        onError(err.message);
      } else {
        onError('An unexpected error occurred during search.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNextPage = () => {
    if (nextCursor !== undefined) {
      handleSearch(undefined, nextCursor, pageIndex + 1);
    }
  };

  const handlePrevPage = () => {
    if (pageIndex > 0) {
      const prevCursor = cursors[pageIndex - 1];
      handleSearch(undefined, prevCursor, pageIndex - 1);
    }
  };

  // Handle detailed player click
  const handleViewPlayer = (player: Player) => {
    setSelectedPlayer(player);
    // Find the most recent active season or default to current year - 1
    setSelectedSeason(2024);
  };

  // Fetch detailed statistics
  useEffect(() => {
    if (!selectedPlayer) return;

    const fetchDetails = async () => {
      setStatsLoading(true);
      setAverages(null);
      setGameLogs([]);
      try {
        // Fetch averages and stats in parallel
        const [avgRes, logsRes] = await Promise.all([
          getSeasonAverages(selectedSeason, [selectedPlayer.id]),
          getPlayerStats(selectedSeason, selectedPlayer.id)
        ]);

        if (avgRes.data && avgRes.data.length > 0) {
          setAverages(avgRes.data[0]);
        }

        if (logsRes.data) {
          // Sort games by date descending and slice the top 10
          const sorted = [...logsRes.data].sort((a, b) => {
            return new Date(b.game.date).getTime() - new Date(a.game.date).getTime();
          });
          setGameLogs(sorted.slice(0, 10));
        }
      } catch (err) {
        if (err instanceof ApiError) {
          onError(err.message);
        } else {
          onError('Failed to load stats for the selected season.');
        }
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDetails();
  }, [selectedPlayer, selectedSeason]);

  // Formatter utilities
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

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    return dateStr.split('T')[0];
  };

  return (
    <div className="w-full">
      {!selectedPlayer ? (
        // Search Dashboard View
        <div className="space-y-6">
          <form onSubmit={(e) => handleSearch(e)} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search NBA players by name (e.g. LeBron, Curry, Jordan)..."
                className="w-full pl-12 pr-4 py-3 bg-slate-900/60 border border-slate-800 rounded-2xl focus:border-orange-500 focus:outline-none text-slate-100 placeholder:text-slate-500 transition-colors shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 disabled:bg-slate-800 disabled:text-slate-500 rounded-2xl font-semibold transition duration-200 shadow-lg shadow-orange-500/10 flex items-center gap-2 text-white"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              Search
            </button>
          </form>

          {loading ? (
            // Loading Skeletons
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-panel rounded-2xl p-5 border border-slate-800 animate-pulse space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 w-2/3">
                      <div className="h-5 bg-slate-800 rounded-md w-3/4"></div>
                      <div className="h-3 bg-slate-800 rounded-md w-1/2"></div>
                    </div>
                    <div className="w-12 h-5 bg-slate-800 rounded-full"></div>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between">
                    <div className="h-4 bg-slate-800 rounded-md w-1/3"></div>
                    <div className="h-4 bg-slate-800 rounded-md w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : players.length > 0 ? (
            // Results list
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-400">
                  Showing results for "{lastSearchedQuery}"
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevPage}
                    disabled={pageIndex === 0}
                    className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-slate-200" />
                  </button>
                  <span className="text-xs text-slate-400 font-medium">Page {pageIndex + 1}</span>
                  <button
                    onClick={handleNextPage}
                    disabled={nextCursor === undefined}
                    className="p-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-200" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.map((player) => (
                  <div
                    key={player.id}
                    onClick={() => handleViewPlayer(player)}
                    className="glass-panel glass-panel-hover rounded-2xl p-5 cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="font-bold text-lg text-slate-100 leading-tight">
                          {player.first_name} {player.last_name}
                        </h4>
                        {player.position && (
                          <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold bg-orange-500/10 text-orange-400 border border-orange-500/20 whitespace-nowrap">
                            {player.position}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-orange-400/90 mt-1">
                        {player.team?.full_name || '—'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-medium">
                      <span>Ht: {player.height || '—'}</span>
                      <span>Wt: {player.weight ? `${player.weight} lbs` : '—'}</span>
                      {player.jersey_number && <span>#{player.jersey_number}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : searched ? (
            // Empty state
            <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 max-w-lg mx-auto mt-6">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">No players found</h3>
              <p className="text-sm text-slate-400 mt-2">
                We couldn't find any players matching "{lastSearchedQuery}". Try double checking the spelling or searching a different name.
              </p>
            </div>
          ) : (
            // Landing state
            <div className="glass-panel rounded-2xl p-8 md:p-12 text-center max-w-2xl mx-auto mt-6 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-2 text-orange-500">
                <User className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-100">NBA Player Directory</h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Search through active and retired NBA players from every era to explore their career season statistics and individual game logs.
              </p>
            </div>
          )}
        </div>
      ) : (
        // Player Detail View
        <div className="space-y-6">
          {/* Header & Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="flex items-center gap-2 text-sm font-semibold px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition duration-200 text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to search
            </button>

            <div className="flex items-center gap-2">
              <label htmlFor="season-select" className="text-xs font-semibold text-slate-400">Season:</label>
              <select
                id="season-select"
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(Number(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-sm font-semibold focus:outline-none focus:border-orange-500"
              >
                {seasons.map((year) => (
                  <option key={year} value={year}>
                    {year}–{(year + 1).toString().slice(-2)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Profile Card */}
          <div className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            {/* Background absolute glow */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-orange-500/5 blur-[120px] rounded-full pointer-events-none"></div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-100">
                  {selectedPlayer.first_name} {selectedPlayer.last_name}
                </h2>
                {selectedPlayer.position && (
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {selectedPlayer.position}
                  </span>
                )}
              </div>
              
              <div className="text-sm font-bold text-orange-400/90 flex items-center gap-2">
                <span>{selectedPlayer.team?.full_name || '—'}</span>
                {selectedPlayer.team?.abbreviation && (
                  <span className="text-xs px-2 py-0.5 bg-slate-800/80 rounded-md text-slate-400">
                    {selectedPlayer.team.abbreviation}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400 font-semibold pt-1">
                <span>Height: <strong className="text-slate-300 font-medium">{selectedPlayer.height || '—'}</strong></span>
                <span>Weight: <strong className="text-slate-300 font-medium">{selectedPlayer.weight ? `${selectedPlayer.weight} lbs` : '—'}</strong></span>
                {selectedPlayer.jersey_number && (
                  <span>Jersey Number: <strong className="text-slate-300 font-medium">#{selectedPlayer.jersey_number}</strong></span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-1.5">
              <span className="text-xs text-slate-500 font-bold">CURRENT/LAST TEAM</span>
              <div className="text-right">
                <span className="text-lg font-black text-slate-200 block md:inline">
                  {selectedPlayer.team?.city || '—'}
                </span>
                <span className="text-xs text-slate-400 font-medium block">
                  {selectedPlayer.team?.conference ? `${selectedPlayer.team.conference} Conference` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Loading indicator */}
          {statsLoading ? (
            <div className="glass-panel rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading seasonal statistics and game logs...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Season Averages Section */}
              <div className="lg:col-span-1 space-y-4">
                <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-orange-500" />
                  Season Averages
                </h3>

                {averages ? (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Stat Cards */}
                    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-2xs font-extrabold text-slate-400 tracking-wider">POINTS</span>
                      <span className="text-2xl font-black text-orange-400 mt-2">{formatStatValue(averages.pts)}</span>
                      <span className="text-3xs text-slate-500 mt-1">per game</span>
                    </div>

                    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-2xs font-extrabold text-slate-400 tracking-wider">REBOUNDS</span>
                      <span className="text-2xl font-black text-slate-200 mt-2">{formatStatValue(averages.reb)}</span>
                      <span className="text-3xs text-slate-500 mt-1">per game</span>
                    </div>

                    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-2xs font-extrabold text-slate-400 tracking-wider">ASSISTS</span>
                      <span className="text-2xl font-black text-slate-200 mt-2">{formatStatValue(averages.ast)}</span>
                      <span className="text-3xs text-slate-500 mt-1">per game</span>
                    </div>

                    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-2xs font-extrabold text-slate-400 tracking-wider">STEALS</span>
                      <span className="text-2xl font-black text-slate-200 mt-2">{formatStatValue(averages.stl)}</span>
                      <span className="text-3xs text-slate-500 mt-1">per game</span>
                    </div>

                    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-2xs font-extrabold text-slate-400 tracking-wider">BLOCKS</span>
                      <span className="text-2xl font-black text-slate-200 mt-2">{formatStatValue(averages.blk)}</span>
                      <span className="text-3xs text-slate-500 mt-1">per game</span>
                    </div>

                    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between">
                      <span className="text-2xs font-extrabold text-slate-400 tracking-wider">TURNOVERS</span>
                      <span className="text-2xl font-black text-slate-200 mt-2">{formatStatValue(averages.turnover)}</span>
                      <span className="text-3xs text-slate-500 mt-1">per game</span>
                    </div>

                    <div className="glass-panel rounded-2xl p-4 flex flex-col justify-between col-span-2 grid grid-cols-3 gap-2">
                      <div className="flex flex-col">
                        <span className="text-3xs font-extrabold text-slate-400 tracking-wider">FG%</span>
                        <span className="text-sm font-bold text-slate-200 mt-1">{formatPercentage(averages.fg_pct)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-3xs font-extrabold text-slate-400 tracking-wider">3PT%</span>
                        <span className="text-sm font-bold text-slate-200 mt-1">{formatPercentage(averages.fg3_pct)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-3xs font-extrabold text-slate-400 tracking-wider">FT%</span>
                        <span className="text-sm font-bold text-slate-200 mt-1">{formatPercentage(averages.ft_pct)}</span>
                      </div>
                    </div>

                    <div className="glass-panel rounded-2xl p-3 flex justify-between items-center col-span-2 text-xs">
                      <span className="font-semibold text-slate-400">Games Played:</span>
                      <span className="font-bold text-slate-200">{averages.games_played || '0'}</span>
                    </div>

                    <div className="glass-panel rounded-2xl p-3 flex justify-between items-center col-span-2 text-xs">
                      <span className="font-semibold text-slate-400">Minutes per game:</span>
                      <span className="font-bold text-slate-200">{averages.min || '0.0'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel rounded-2xl p-6 text-center text-sm text-slate-400 border border-slate-800">
                    No stats averages available for {selectedPlayer.first_name} in {selectedSeason}–{(selectedSeason + 1).toString().slice(-2)}.
                  </div>
                )}
              </div>

              {/* Game Logs Section */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-extrabold text-slate-100 flex items-center gap-2">
                  <History className="w-5 h-5 text-orange-500" />
                  Recent Game Logs
                </h3>

                {gameLogs.length > 0 ? (
                  <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-extrabold text-2xs">
                            <th className="py-3 px-4">Date</th>
                            <th className="py-3 px-2 text-center">PTS</th>
                            <th className="py-3 px-2 text-center">REB</th>
                            <th className="py-3 px-2 text-center">AST</th>
                            <th className="py-3 px-2 text-center">STL</th>
                            <th className="py-3 px-2 text-center">BLK</th>
                            <th className="py-3 px-2 text-center">FG%</th>
                            <th className="py-3 px-2 text-center">3P%</th>
                            <th className="py-3 px-2 text-center">MIN</th>
                            <th className="py-3 px-3 text-center">+/-</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-slate-300 font-medium">
                          {gameLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                              <td className="py-3 px-4 font-semibold whitespace-nowrap text-slate-400">{formatDate(log.game.date)}</td>
                              <td className="py-3 px-2 text-center font-bold text-orange-400">{log.pts ?? 0}</td>
                              <td className="py-3 px-2 text-center">{log.reb ?? 0}</td>
                              <td className="py-3 px-2 text-center">{log.ast ?? 0}</td>
                              <td className="py-3 px-2 text-center">{log.stl ?? 0}</td>
                              <td className="py-3 px-2 text-center">{log.blk ?? 0}</td>
                              <td className="py-3 px-2 text-center">{formatPercentage(log.fg_pct)}</td>
                              <td className="py-3 px-2 text-center">{formatPercentage(log.fg3_pct)}</td>
                              <td className="py-3 px-2 text-center text-slate-400 font-mono">{log.min || '0'}</td>
                              <td className={`py-3 px-3 text-center font-bold font-mono ${log.plus_minus > 0 ? 'text-emerald-400' : log.plus_minus < 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                                {log.plus_minus > 0 ? `+${log.plus_minus}` : log.plus_minus}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="glass-panel rounded-2xl p-8 text-center text-sm text-slate-400 border border-slate-800">
                    No game logs available for this season.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
