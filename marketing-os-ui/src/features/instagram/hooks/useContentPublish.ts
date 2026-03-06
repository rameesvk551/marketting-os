// features/instagram/hooks/useContentPublish.ts
// React Query hook for Instagram content publishing and media management.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contentService } from '../services';
import { message } from 'antd';

const MEDIA_KEY = ['instagram', 'media'];
const LIMIT_KEY = ['instagram', 'publishing-limit'];

export function useContentPublish(accountId?: string) {
    const queryClient = useQueryClient();

    const mediaQuery = useQuery({
        queryKey: MEDIA_KEY,
        queryFn: () => contentService.getMedia({ limit: 50 }),
        staleTime: 30_000,
    });

    const limitQuery = useQuery({
        queryKey: [...LIMIT_KEY, accountId],
        queryFn: () => contentService.getPublishingLimit(accountId!),
        enabled: !!accountId,
        staleTime: 60_000,
    });

    const publishImageMutation = useMutation({
        mutationFn: (payload: { accountId: string; imageUrl: string; caption?: string; altText?: string }) =>
            contentService.publishImage(payload),
        onSuccess: () => {
            message.success('Post published to Instagram! 🎉');
            queryClient.invalidateQueries({ queryKey: MEDIA_KEY });
            queryClient.invalidateQueries({ queryKey: LIMIT_KEY });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to publish post');
        },
    });

    const publishCarouselMutation = useMutation({
        mutationFn: (payload: { accountId: string; items: Array<{ imageUrl?: string; videoUrl?: string; altText?: string }>; caption?: string }) =>
            contentService.publishCarousel(payload),
        onSuccess: () => {
            message.success('Carousel published to Instagram! 🎉');
            queryClient.invalidateQueries({ queryKey: MEDIA_KEY });
            queryClient.invalidateQueries({ queryKey: LIMIT_KEY });
        },
        onError: (error: any) => {
            message.error(error.response?.data?.message || 'Failed to publish carousel');
        },
    });

    const syncMediaMutation = useMutation({
        mutationFn: (accountId: string) => contentService.syncMedia(accountId),
        onSuccess: (data: any) => {
            message.success(`Synced ${data.data?.synced || 0} posts from Instagram`);
            queryClient.invalidateQueries({ queryKey: MEDIA_KEY });
        },
        onError: () => {
            message.error('Failed to sync media from Instagram');
        },
    });

    return {
        media: mediaQuery.data?.data?.items || [],
        totalMedia: mediaQuery.data?.data?.total || 0,
        isLoadingMedia: mediaQuery.isLoading,
        publishingLimit: limitQuery.data?.data,
        publishImage: publishImageMutation.mutate,
        isPublishing: publishImageMutation.isPending,
        publishCarousel: publishCarouselMutation.mutate,
        isPublishingCarousel: publishCarouselMutation.isPending,
        syncMedia: syncMediaMutation.mutate,
        isSyncing: syncMediaMutation.isPending,
        refetchMedia: mediaQuery.refetch,
    };
}
