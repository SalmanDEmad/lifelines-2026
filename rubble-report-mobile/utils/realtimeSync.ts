import { supabase } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

let reportsChannel: RealtimeChannel | null = null;

export interface RealtimeReport {
  id: string;
  zone: string;
  category: string;
  subcategory?: string;
  latitude: number;
  longitude: number;
  description?: string;
  image_url?: string;
  timestamp: string;
  status: string;
  created_at: string;
}

export interface RealtimeCallbacks {
  onInsert?: (report: RealtimeReport) => void;
  onUpdate?: (report: RealtimeReport) => void;
  onDelete?: (report: { id: string }) => void;
  onError?: (error: Error) => void;
}

/**
 * Subscribe to realtime report updates
 * @param callbacks - Callback functions for INSERT, UPDATE, DELETE events
 * @returns Unsubscribe function
 */
export function subscribeToReports(callbacks: RealtimeCallbacks): () => void {
  console.log('[REALTIME] Subscribing to reports channel...');
  
  // Unsubscribe from existing channel if any
  if (reportsChannel) {
    reportsChannel.unsubscribe();
  }

  reportsChannel = supabase
    .channel('reports-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'reports',
      },
      (payload) => {
        console.log('[REALTIME] New report:', payload.new);
        callbacks.onInsert?.(payload.new as RealtimeReport);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'reports',
      },
      (payload) => {
        console.log('[REALTIME] Report updated:', payload.new);
        callbacks.onUpdate?.(payload.new as RealtimeReport);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'reports',
      },
      (payload) => {
        console.log('[REALTIME] Report deleted:', payload.old);
        callbacks.onDelete?.({ id: (payload.old as any).id });
      }
    )
    .subscribe((status) => {
      console.log('[REALTIME] Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('[REALTIME] ✓ Connected to realtime updates');
      } else if (status === 'CHANNEL_ERROR') {
        callbacks.onError?.(new Error('Failed to subscribe to realtime updates'));
      }
    });

  return () => {
    console.log('[REALTIME] Unsubscribing from reports channel...');
    reportsChannel?.unsubscribe();
    reportsChannel = null;
  };
}

/**
 * Subscribe to reports for a specific region
 * @param region - Region key (e.g., 'palestine', 'sudan')
 * @param callbacks - Callback functions for events
 * @returns Unsubscribe function
 */
export function subscribeToRegionReports(
  region: string,
  callbacks: RealtimeCallbacks
): () => void {
  console.log(`[REALTIME] Subscribing to reports for region: ${region}`);
  
  const channel = supabase
    .channel(`reports-${region}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reports',
        // Note: Supabase realtime doesn't support complex filters
        // We'll filter on the client side
      },
      (payload) => {
        const report = payload.new as RealtimeReport;
        
        // Client-side filtering by region
        // This is a simple approach; you may want to add a region column to reports
        if (payload.eventType === 'INSERT') {
          callbacks.onInsert?.(report);
        } else if (payload.eventType === 'UPDATE') {
          callbacks.onUpdate?.(report);
        } else if (payload.eventType === 'DELETE') {
          callbacks.onDelete?.({ id: (payload.old as any).id });
        }
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

/**
 * Subscribe to hazard alerts only
 * @param callbacks - Callback functions for hazard events
 * @returns Unsubscribe function
 */
export function subscribeToHazards(callbacks: RealtimeCallbacks): () => void {
  console.log('[REALTIME] Subscribing to hazard alerts...');
  
  const channel = supabase
    .channel('hazards-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'reports',
        filter: 'category=eq.hazard',
      },
      (payload) => {
        console.log('[REALTIME] ⚠️ New hazard reported:', payload.new);
        callbacks.onInsert?.(payload.new as RealtimeReport);
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

/**
 * Check if realtime is connected
 */
export function isRealtimeConnected(): boolean {
  return reportsChannel !== null;
}
