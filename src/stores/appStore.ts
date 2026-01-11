import { create } from 'zustand';
import type { Club, Season, Team, Sponsor } from '@/lib/touchline/types';

interface AppState {
  // Initialization
  isInitialized: boolean;
  initializationError: string | null;

  // Current context
  currentClub: Club | null;
  currentSeason: Season | null;

  // Data
  teams: Team[];
  sponsors: Sponsor[];

  // Actions
  setInitialized: (initialized: boolean) => void;
  setInitializationError: (error: string | null) => void;
  setCurrentClub: (club: Club | null) => void;
  setCurrentSeason: (season: Season | null) => void;
  setTeams: (teams: Team[]) => void;
  setSponsors: (sponsors: Sponsor[]) => void;
  reset: () => void;
}

const initialState = {
  isInitialized: false,
  initializationError: null,
  currentClub: null,
  currentSeason: null,
  teams: [],
  sponsors: [],
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setInitialized: (initialized) => set({ isInitialized: initialized }),

  setInitializationError: (error) => set({ initializationError: error }),

  setCurrentClub: (club) => set({ currentClub: club }),

  setCurrentSeason: (season) => set({ currentSeason: season }),

  setTeams: (teams) => set({ teams }),

  setSponsors: (sponsors) => set({ sponsors }),

  reset: () => set(initialState),
}));
