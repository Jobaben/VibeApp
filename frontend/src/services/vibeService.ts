import { apiClient } from './api';
import { Vibe, CreateVibeRequest } from '../types/vibe';

export const vibeService = {
  async createVibe(data: CreateVibeRequest): Promise<Vibe> {
    const response = await apiClient.post<Vibe>('/vibes/', data);
    return response.data;
  },

  async getVibeById(id: string): Promise<Vibe> {
    const response = await apiClient.get<Vibe>(`/vibes/${id}`);
    return response.data;
  },

  async getUserVibes(userId: string): Promise<Vibe[]> {
    const response = await apiClient.get<Vibe[]>(`/vibes/user/${userId}`);
    return response.data;
  },

  async getTrendingVibes(count: number = 10): Promise<Vibe[]> {
    const response = await apiClient.get<Vibe[]>('/vibes/trending/', {
      params: { count },
    });
    return response.data;
  },
};
