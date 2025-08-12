import { useEffect, useState } from 'react';
import { Trip } from '../types';

export const useWebBookTrips = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Categorized trips
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [deliveredTrips, setDeliveredTrips] = useState<Trip[]>([]);
  const [completedTrips, setCompletedTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const fetchWebBookTrips = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate Web Book API data
        const mockWebBookTrips: Trip[] = [
          {
            id: 'wb-001',
            fleetNumber: 'WB-101',
            route: 'Miami, FL - Tampa, FL',
            clientName: 'Sunshine Logistics',
            clientType: 'external',
            baseRevenue: 1850,
            revenueCurrency: 'USD',
            startDate: '2025-01-15',
            endDate: '2025-01-16',
            driverName: 'Carlos Martinez',
            distanceKm: 285,
            description: 'Web booked freight',
            status: 'active',
            costs: [],
            source: 'web_book',
            externalId: 'wb-load-12345',
            lastUpdated: new Date().toISOString(),
            loadRef: 'WB-LOAD-001',
            costBreakdown: {
              fuel: 485.0,
              maintenance: 120.0,
              driver: 285.0,
              tolls: 65.0,
              other: 35.0,
            },
            totalCost: 990.0,
          },
          {
            id: 'wb-002',
            fleetNumber: 'WB-102',
            route: 'Houston, TX - Austin, TX',
            clientName: 'Texas Freight Co',
            clientType: 'external',
            baseRevenue: 1250,
            revenueCurrency: 'USD',
            startDate: '2025-01-16',
            endDate: '2025-01-17',
            driverName: 'Jennifer Wilson',
            distanceKm: 265,
            description: 'Express delivery',
            status: 'active',
            costs: [],
            source: 'web_book',
            externalId: 'wb-load-67890',
            lastUpdated: new Date().toISOString(),
            loadRef: 'WB-LOAD-002',
            costBreakdown: {
              fuel: 425.0,
              maintenance: 95.0,
              driver: 245.0,
              tolls: 45.0,
              other: 25.0,
            },
            totalCost: 835.0,
          },
          {
            id: 'wb-003',
            fleetNumber: 'WB-103',
            route: 'Denver, CO - Salt Lake City, UT',
            clientName: 'Mountain Transport',
            clientType: 'external',
            baseRevenue: 2950,
            revenueCurrency: 'USD',
            startDate: '2025-01-14',
            endDate: '2025-01-16',
            driverName: 'Robert Taylor',
            distanceKm: 525,
            description: 'Long haul delivery',
            status: 'completed',
            costs: [],
            source: 'web_book',
            externalId: 'wb-load-11111',
            lastUpdated: new Date().toISOString(),
            loadRef: 'WB-LOAD-003',
            costBreakdown: {
              fuel: 1250.0,
              maintenance: 285.0,
              driver: 525.0,
              tolls: 155.0,
              other: 85.0,
            },
            totalCost: 2300.0,
          },
        ];

        setTrips(mockWebBookTrips);

        // Categorize trips
        setActiveTrips(mockWebBookTrips.filter(trip => trip.status === 'active'));
        setDeliveredTrips(mockWebBookTrips.filter(trip => trip.status === 'delivered'));
        setCompletedTrips(mockWebBookTrips.filter(trip => trip.status === 'completed'));

      } catch (err) {
        console.error('Error fetching web book trips:', err);
        setError('Failed to fetch web book trips');
      } finally {
        setLoading(false);
      }
    };

    fetchWebBookTrips();

    // Simulate periodic updates
    const interval = setInterval(fetchWebBookTrips, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  return {
    trips,
    loading,
    error,
    activeTrips,
    deliveredTrips,
    completedTrips,
  };
};