export const DEFAULT_API_KEY = '946f86bc-d49b-4bae-aea6-6ab9a6f20a66';

export interface Team {
  id: number;
  full_name: string;
  name: string;
  abbreviation: string;
  conference: string;
  division: string;
  city: string;
}

export interface Player {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
  height: string;
  weight: string;
  jersey_number: string;
  team: Team;
}

export interface SeasonAverage {
  player_id: number;
  season: number;
  games_played: number;
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
}

export interface GameLog {
  id: number;
  player: {
    id: number;
    first_name: string;
    last_name: string;
  };
  game: {
    id: number;
    date: string;
    season: number;
    postseason: boolean;
  };
  team: {
    id: number;
    abbreviation: string;
  };
  min: string;
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  turnover: number;
  fg_pct: number;
  fg3_pct: number;
  ft_pct: number;
  plus_minus: number;
}

export interface Game {
  id: number;
  date: string;
  season: number;
  postseason: boolean;
  status: string;
  home_team: Team;
  home_team_score: number;
  visitor_team: Team;
  visitor_team_score: number;
}

export interface Meta {
  next_cursor?: number;
  per_page: number;
}

export interface ApiResponse<T> {
  data: T[];
  meta?: Meta;
}

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

const BASE_URL = 'https://api.balldontlie.io/nba/v1';

export const getApiKey = (): string => {
  const saved = localStorage.getItem('balldontlie_api_key');
  return saved !== null ? saved.trim() : DEFAULT_API_KEY;
};

export const setApiKey = (key: string): void => {
  localStorage.setItem('balldontlie_api_key', key.trim());
};

async function fetchFromApi<T>(endpoint: string, params: Record<string, string | number | boolean | undefined | (string | number)[]>): Promise<ApiResponse<T>> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new ApiError('API Key is missing. Please enter an API key.', 401);
  }

  const url = new URL(`${BASE_URL}${endpoint}`);
  
  // Construct parameters with proper support for arrays (e.g. player_ids[] or seasons[])
  Object.entries(params).forEach(([key, val]) => {
    if (val === undefined) return;
    if (Array.isArray(val)) {
      val.forEach(item => {
        url.searchParams.append(`${key}[]`, item.toString());
      });
    } else {
      url.searchParams.append(key, val.toString());
    }
  });

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': apiKey,
        'Accept': 'application/json'
      }
    });

    if (response.status === 401) {
      throw new ApiError('Unauthorized API Key. Please verify your balldontlie.io API key.', 401);
    }

    if (response.status === 429) {
      throw new ApiError('Rate limit exceeded. Please wait a moment before trying again.', 429);
    }

    if (!response.ok) {
      throw new ApiError(`API responded with status: ${response.status}`, response.status);
    }

    const data = await response.json();
    return data as ApiResponse<T>;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network errors
    throw new ApiError('Could not reach the API. Please check your internet connection.', 0);
  }
}

// Player Search: Paging uses next_cursor in cursor query param
export async function searchPlayers(query: string, cursor?: number, perPage = 25): Promise<ApiResponse<Player>> {
  return fetchFromApi<Player>('/players', {
    search: query || undefined,
    cursor: cursor,
    per_page: perPage
  });
}

// Season Averages: Fetch averages for a player in a season
export async function getSeasonAverages(season: number, playerIds: number[]): Promise<ApiResponse<SeasonAverage>> {
  if (playerIds.length === 0) {
    return { data: [] };
  }
  return fetchFromApi<SeasonAverage>('/season_averages', {
    season: season,
    player_ids: playerIds
  });
}

// Stats / Game Logs: Get stats for players in seasons
export async function getPlayerStats(season: number, playerId: number, perPage = 100): Promise<ApiResponse<GameLog>> {
  return fetchFromApi<GameLog>('/stats', {
    seasons: [season],
    player_ids: [playerId],
    per_page: perPage
  });
}

// Games Browser: Browse game results by season and postseason filter
export async function getGames(season: number, postseason?: boolean, cursor?: number, perPage = 25): Promise<ApiResponse<Game>> {
  return fetchFromApi<Game>('/games', {
    seasons: [season],
    postseason: postseason !== undefined ? postseason : undefined,
    cursor: cursor,
    per_page: perPage
  });
}
