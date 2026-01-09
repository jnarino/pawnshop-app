import { http } from './http';

export const customerApi = {
  findCustomer: async (params: string): Promise<any[]> => {
    return http(`/api/customer?${params}`);
  },
};