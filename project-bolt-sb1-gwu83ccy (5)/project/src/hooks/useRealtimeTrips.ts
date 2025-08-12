import { useEffect, useState } from 'react';
import { Trip } from '../types';

interface UseRealtimeTripsParams {
  status?: 'active' | 'completed' | 'scheduled';
}

export const useRealtimeTrips = ({ status }: UseRealtimeTripsParams = {}) => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRealtimeTrips = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate Firestore real-time data
        const mockFirestoreTrips: Trip[] = [
          {
            id: 'firestore-1',
            fleetNumber: 'FS-001',
            route: 'Atlanta, GA - Charlotte, NC',
            clientName: 'Logistics Corp',
            clientType: 'external',
            baseRevenue: 2800,
            revenueCurrency: 'USD',
            startDate: '2025-01-15',
            endDate: '2025-01-17',
            driverName: 'Michael Chen',
            distanceKm: 385,
            description: 'Priority freight delivery',
            status: status || 'active',
            costs: [],
            source: 'firestore',
            externalId: 'fs-12345',
            lastUpdated: new Date().toISOString(),
            costBreakdown: {
              fuel: 850.25,
              maintenance: 200.0,
              driver: 450.0,
              tolls: 125.0,
              other: 75.0,
            },
            totalCost: 1700.25,
          },
          {
            id: 'firestore-2',
            fleetNumber: 'FS-002',
            route: 'Phoenix, AZ - Las Vegas, NV',
            clientName: 'Desert Transport',
            clientType: 'internal',
            baseRevenue: 2200,
            revenueCurrency: 'USD',
            startDate: '2025-01-16',
            endDate: '2025-01-18',
            driverName: 'Lisa Rodriguez',
            distanceKm: 480,
            description: 'Equipment transport',
            status: status || 'active',
            costs: [],
            source: 'firestore',
            externalId: 'fs-67890',
            lastUpdated: new Date().toISOString(),
            costBreakdown: {
              fuel: 920.0,
              maintenance: 180.0,
              driver: 380.0,
              tolls: 95.0,
              other: 45.0,
            },
            totalCost: 1620.0,
          },
        ];

        // Filter by status if provided
        const filteredTrips = status 
          ? mockFirestoreTrips.filter(trip => trip.status === status)
          : mockFirestoreTrips;

        setTrips(filteredTrips);
      } catch (err) {
        console.error('Error fetching real-time trips:', err);
        setError('Failed to fetch real-time trips');
      } finally {
        setLoading(false);
      }
    };

    fetchRealtimeTrips();

    // Simulate real-time updates
    const interval = setInterval(fetchRealtimeTrips, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [status]);

  return { trips, loading, error };
};