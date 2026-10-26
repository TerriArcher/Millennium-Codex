import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { YugiohCard, CardFilterState } from '../../types/card';
import { normalizeCard, isPlayableCard } from '../../services/ygoprodeckApi';

function getSuperTypeQuery(superType: string): string {
  const s = superType.trim().toLowerCase();
  switch (s) {
    case 'link':
      return 'Link Monster';
    case 'xyz':
      return 'XYZ Monster,XYZ Pendulum Effect Monster';
    case 'synchro':
      return 'Synchro Monster,Synchro Tuner Monster,Synchro Pendulum Effect Monster';
    case 'ritual':
      return 'Ritual Monster,Ritual Effect Monster';
    case 'spirit':
      return 'Spirit Monster';
    case 'toon':
      return 'Toon Monster';
    case 'gemini':
      return 'Gemini Monster';
    case 'union':
      return 'Union Effect Monster';
    case 'pendulum':
      return 'Pendulum Effect Monster,Pendulum Normal Monster,Pendulum Tuner Effect Monster';
    case 'fusion':
      return 'Fusion Monster,Pendulum Effect Fusion Monster';
    case 'tuner':
      return 'Normal Tuner Monster,Synchro Tuner Monster,Pendulum Tuner Effect Monster,Flip Tuner Effect Monster';
    default:
      return superType;
  }
}

export const ygoprodeckRtkApi = createApi({
  reducerPath: 'ygoprodeckApi',
  baseQuery: fetchBaseQuery({
    baseUrl: 'https://db.ygoprodeck.com/api/v7/'
  }),
  keepUnusedDataFor: 1800, // 30 minutes in-memory cache
  endpoints: (builder) => ({
    getCardsByFilter: builder.query<{ cards: YugiohCard[]; total: number }, CardFilterState>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters.attribute) params.append('attribute', String(filters.attribute).toUpperCase());
        if (filters.level !== undefined && filters.level !== '') {
          params.append('level', String(filters.level));
        }
        if (filters.scale !== undefined && filters.scale !== '') {
          params.append('scale', String(filters.scale));
        }
        if (filters.race) {
          const r = String(filters.race).trim();
          if (r.toLowerCase() === 'quick' || r.toLowerCase() === 'quick-play') {
            params.append('race', 'Quick-Play');
          } else {
            params.append('race', r);
          }
        }
        if (filters.atk !== undefined && filters.atk !== '') {
          params.append('atk', String(filters.atk));
        }
        if (filters.def !== undefined && filters.def !== '') {
          params.append('def', String(filters.def));
        }
        if (filters.archetype) params.append('archetype', String(filters.archetype));
        if (filters.keyword) params.append('fname', String(filters.keyword));

        if (filters.superType) {
          params.append('type', getSuperTypeQuery(String(filters.superType)));
        } else if (filters.type) {
          const t = String(filters.type);
          if (t.toLowerCase() === 'monster') {
            params.append('has_effect', 'true,false');
          } else if (t.toLowerCase() === 'spell') {
            params.append('type', 'Spell Card');
          } else if (t.toLowerCase() === 'trap') {
            params.append('type', 'Trap Card');
          } else {
            params.append('type', t);
          }
        }

        return `cardinfo.php?${params.toString()}`;
      },
      transformResponse: (response: any) => {
        let rawList: any[] = [];
        if (response && Array.isArray(response.data)) {
          rawList = response.data;
        } else if (Array.isArray(response)) {
          rawList = response;
        } else if (response?.id && response?.name) {
          rawList = [response];
        }

        // Strictly filter out Token and Skill cards
        const playable = rawList.filter(isPlayableCard).map(normalizeCard);
        return {
          cards: playable,
          total: playable.length
        };
      }
    }),
    getRandomCardsBatch: builder.query<{ cards: YugiohCard[] }, { count?: number; cacheBust?: number }>({
      query: ({ count = 15, cacheBust = 0 }) =>
        `cardinfo.php?num=${count}&offset=0&sort=random&cachebust=${cacheBust}`,
      transformResponse: (response: any) => {
        let rawList: any[] = [];
        if (response && Array.isArray(response.data)) {
          rawList = response.data;
        } else if (Array.isArray(response)) {
          rawList = response;
        }
        const playable = rawList.filter(isPlayableCard).map(normalizeCard);
        return {
          cards: playable
        };
      }
    })
  })
});

export const { useGetCardsByFilterQuery, useLazyGetCardsByFilterQuery, useLazyGetRandomCardsBatchQuery } =
  ygoprodeckRtkApi;
