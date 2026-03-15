import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { partnerService } from '../services/partnerService';

export const usePartnerDashboard = () =>
  useQuery({
    queryKey: ['partner', 'dashboard'],
    queryFn: partnerService.getDashboard,
  });

export const usePartnerCustomers = () =>
  useQuery({
    queryKey: ['partner', 'customers'],
    queryFn: partnerService.getCustomers,
  });

export const usePartnerCommissions = () =>
  useQuery({
    queryKey: ['partner', 'commissions'],
    queryFn: partnerService.getCommissions,
  });

export const useCreatePartnerWithdrawRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: partnerService.createWithdrawRequest,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['partner', 'dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['partner', 'customers'] }),
        queryClient.invalidateQueries({ queryKey: ['partner', 'commissions'] }),
      ]);
    },
  });
};
