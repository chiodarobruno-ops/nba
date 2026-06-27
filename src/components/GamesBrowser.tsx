import React, { useState, useEffect } from 'react';
import { getGames, Game, ApiError } from '../services/api';
import { Search, Trophy, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

interface GamesBrowserProps {
  onError: (msg: string) => void;
}

export const GamesBrowser: React.FC<GamesBrowserProps> = ({ onError }) => {
  const [selectedSeason, setSelectedSeason] = useState<number>(2024);
  const [postseason, setPostseason] = useState<'all' | 'regular' | 'playoffs'>('all');
  const [teamFilter, setTeamFilter] = useState('');
  
  // Games & Loader state
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Pagination state (cursor-based)
  const [cursors, setCursors] = useState<(number | undefined)[]>([undefined]);
  const [pageIndex, setPageIndex] = useState(0);
  const [nextCursor, setNextCursor] = useState<number | undefined>(undefined);

  // Generate season list
  const currentYear = new Date().getFullYear();
  const seasons = Array.from({ length: currentYear - 1946 + 1 }, (_, i) => currentYear - i);

  const fetchGamesList = async (targetCursor?: number, pageIdx = 0) => {
    setLoading(true);
    try {
      const isPostseason = postseason === 'playoffs' ? true : postseason === 'regular' ? false : undefined;
      const response = await getGames(selectedSeason, isPostseason, targetCursor, 25);
      
      setGames(response.data);
      setNextCursor(response.meta?.next_cursor);
      setSearched(true);
      
      if (pageIdx === 0) {
        setCursors([undefined, response.meta?.next_cursor]);
        setPageIndex(0);
      } else {
        setPageIndex(pageIdx);
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
        onError('An error occurred while fetching games.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Run initial load or reload when season or postseason filters change
  useEffect(() => {
    fetchGamesList(undefined, 0);
  }, [selectedSeason, postseason]);

  const handleNextPage = () => {
    if (nextCursor !== undefined) {
      fetchGamesList(nextCursor, pageIndex + 1);
    }
  };

  const handlePrevPage = () => {
    if (pageIndex > 0) {
      const prevCursor = cursors[pageIndex - 1];
      fetchGamesList(prevCursor, pageIndex - 1);
    }
  };

  // Client-side filtering on team name or abbreviation
  const filteredGames = games.filter(game => {
    if (!teamFilter.trim()) return true;
    const filterStr = teamFilter.toLowerCase().trim();
    const home = game.home_team;
    const visitor = game.visitor_team;
    return (
      home.full_name.toLowerCase().includes(filterStr) ||
      home.abbreviation.toLowerCase().includes(filterStr) ||
      visitor.full_name.toLowerCase().includes(filterStr) ||
      visitor.abbreviation.toLowerCase().includes(filterStr)
    );
  });

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '—';
    return dateStr.split('T')[0];
  };

  // Display score only for games that have finished
  const renderScore = (game: Game) => {
    const isFinished = game.status.toLowerCase().includes('final');
    if (isFinished) {
      const isHomeWinner = game.home_team_score > game.visitor_team_score;
      return (
        <div className="flex items-center justify-center gap-1.5 font-mono text-sm md:text-base font-extrabold text-slate-100">
          <span className={!isHomeWinner ? 'text-slate-100' : 'text-slate-400 font-semibold'}>{game.visitor_team_score}</span>
          <span className="text-slate-500 font-normal">-</span>
          <span className={isHomeWinner ? 'text-slate-100' : 'text-slate-400 font-semibold'}>{game.home_team_score}</span>
        </div>
      );
    }
    // Future or scheduled games show their status (e.g. time)
    return (
      <div className="px-2 py-1 rounded bg-slate-800/80 border border-slate-700 text-3xs font-bold text-slate-400 uppercase tracking-wide whitespace-nowrap">
        {game.status}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search Filter Panel */}
      <div className="glass-panel rounded-2xl p-5 border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
        <div className="space-y-2">
          <label htmlFor="season-games" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Season</label>
          <select
            id="season-games"
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

        <div className="space-y-2">
          <label htmlFor="game-type" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Game Type</label>
          <select
            id="game-type"
            value={postseason}
            onChange={(e) => setPostseason(e.target.value as any)}
            className="w-full text-sm px-3.5 py-2.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl font-semibold focus:outline-none focus:border-orange-500"
          >
            <option value="all">All Games</option>
            <option value="regular">Regular Season</option>
            <option value="playoffs">Playoffs</option>
          </select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="team-search" className="text-xs font-bold text-slate-400 uppercase tracking-wider">Client-side Team Filter</label>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              id="team-search"
              type="text"
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              placeholder="Filter by team name or abbreviation (e.g. LAL, Warriors)..."
              className="w-full text-sm pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl focus:border-orange-500 focus:outline-none text-slate-100 placeholder:text-slate-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 animate-pulse">
          <div className="h-10 bg-slate-900 border-b border-slate-800"></div>
          <div className="divide-y divide-slate-800/40 p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div className="h-4 bg-slate-800 rounded w-1/4"></div>
                <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                <div className="h-4 bg-slate-800 rounded w-12"></div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Results Summary and Pagination Controls */}
          {searched && (
            <div className="flex justify-between items-center text-xs text-slate-400 font-semibold">
              <div>
                Showing {filteredGames.length} games on page {pageIndex + 1}
                {teamFilter && ` matching "${teamFilter}"`}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={pageIndex === 0}
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-200" />
                </button>
                <span className="font-mono">Pg {pageIndex + 1}</span>
                <button
                  onClick={handleNextPage}
                  disabled={nextCursor === undefined}
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-slate-200" />
                </button>
              </div>
            </div>
          )}

          {/* Games Table List */}
          {filteredGames.length > 0 ? (
            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase tracking-wider font-extrabold text-2xs">
                      <th className="py-3.5 px-4 md:px-6">Date</th>
                      <th className="py-3.5 px-2">Type</th>
                      <th className="py-3.5 px-4 text-right">Away Team</th>
                      <th className="py-3.5 px-2 text-center w-24">Score</th>
                      <th className="py-3.5 px-4 text-left">Home Team</th>
                      <th className="py-3.5 px-4 text-center">Season</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-300 font-semibold">
                    {filteredGames.map((game) => (
                      <tr key={game.id} className="hover:bg-slate-900/30 transition-colors">
                        {/* Date */}
                        <td className="py-3.5 px-4 md:px-6 font-mono text-slate-400 whitespace-nowrap">
                          {formatDate(game.date)}
                        </td>
                        
                        {/* Game Type Label */}
                        <td className="py-3.5 px-2 whitespace-nowrap">
                          {game.postseason ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-3xs font-extrabold bg-orange-500/10 text-orange-400 border border-orange-500/20 uppercase tracking-wider">
                              <Trophy className="w-2.5 h-2.5" />
                              Playoffs
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-3xs font-semibold bg-slate-800 text-slate-400 border border-slate-700/50 uppercase tracking-wide">
                              Reg Season
                            </span>
                          )}
                        </td>

                        {/* Away Matchup */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-200">
                          <span className="md:inline hidden">{game.visitor_team?.full_name}</span>
                          <span className="md:hidden inline">{game.visitor_team?.abbreviation}</span>
                        </td>

                        {/* Middle Scoreboard */}
                        <td className="py-3.5 px-2 text-center whitespace-nowrap">
                          {renderScore(game)}
                        </td>

                        {/* Home Matchup */}
                        <td className="py-3.5 px-4 text-left whitespace-nowrap font-bold text-slate-200">
                          <span className="md:inline hidden">{game.home_team?.full_name}</span>
                          <span className="md:hidden inline">{game.home_team?.abbreviation}</span>
                        </td>

                        {/* Season */}
                        <td className="py-3.5 px-4 text-center text-slate-400 text-3xs font-bold font-mono">
                          {game.season}-{game.season + 1}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : searched ? (
            // No matches empty state
            <div className="glass-panel rounded-2xl p-12 text-center border border-slate-800 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-slate-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">No games found</h3>
              <p className="text-sm text-slate-400 mt-2">
                {teamFilter 
                  ? `No games on this page match the team filter "${teamFilter}".`
                  : 'No games were returned for this season or filter criteria.'}
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
