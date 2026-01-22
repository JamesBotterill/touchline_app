import { create } from "zustand";
import type { Club, Season, Team, Sponsor } from "../lib/touchline/types";

interface AppState {
  // Initialization
  isInitialized: boolean;
  initializationError: string | null;

  // Current context
  currentClub: Club | null;
  currentSeason: Season | null;

  // Settings
  currency: string;
  currencySymbol: string;

  // Data
  teams: Team[];
  sponsors: Sponsor[];

  // Actions
  setInitialized: (initialized: boolean) => void;
  setInitializationError: (error: string | null) => void;
  setCurrentClub: (club: Club | null) => void;
  setCurrentSeason: (season: Season | null) => void;
  setCurrency: (currency: string, symbol: string) => void;
  setTeams: (teams: Team[]) => void;
  setSponsors: (sponsors: Sponsor[]) => void;
  reset: () => void;
}

const initialState = {
  isInitialized: false,
  initializationError: null,
  currentClub: null,
  currentSeason: null,
  currency: "",
  currencySymbol: "$",
  teams: [],
  sponsors: [],
};

export const useAppStore = create<AppState>((set) => ({
  ...initialState,

  setInitialized: (initialized) => set({ isInitialized: initialized }),

  setInitializationError: (error) => set({ initializationError: error }),

  setCurrentClub: (club) => set({ currentClub: club }),

  setCurrentSeason: (season) => set({ currentSeason: season }),

  setCurrency: (currency, symbol) => set({ currency, currencySymbol: symbol }),

  setTeams: (teams) => set({ teams }),

  setSponsors: (sponsors) => set({ sponsors }),

  reset: () => set(initialState),
}));
