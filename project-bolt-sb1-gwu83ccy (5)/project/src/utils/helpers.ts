import { Trip, CostEntry, KPIs } from '../types';

export const formatCurrency = (amount: number, currency: string): string => {
  const symbol = currency === 'USD' ? '$' : 'R';
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const calculateTotalCosts = (costs: CostEntry[]): number => {
  return costs.reduce((total, cost) => total + cost.amount, 0);
};

export const getFlaggedCostsCount = (costs: CostEntry[]): number => {
  return costs.filter(cost => cost.isFlagged).length;
};

export const getUnresolvedFlagsCount = (costs: CostEntry[]): number => {
  return costs.filter(cost => cost.isFlagged && cost.investigationStatus !== 'resolved').length;
};

export const getAllFlaggedCosts = (trips: Trip[]): FlaggedCost[] => {
  const flaggedCosts: FlaggedCost[] = [];
  
  trips.forEach(trip => {
    trip.costs.filter(cost => cost.isFlagged).forEach(cost => {
      flaggedCosts.push({
        ...cost,
        tripId: trip.id,
        tripFleetNumber: trip.fleetNumber,
        tripRoute: trip.route
      });
    });
  });
  
  return flaggedCosts.sort((a, b) => {
    // Sort by investigation status (unresolved first), then by date
    const statusOrder = { 'pending': 0, 'in-progress': 1, 'resolved': 2 };
    const aStatus = statusOrder[a.investigationStatus || 'pending'];
    const bStatus = statusOrder[b.investigationStatus || 'pending'];
    
    if (aStatus !== bStatus) {
      return aStatus - bStatus;
    }
    
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
};

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getFileIcon = (fileType: string) => {
  if (fileType.includes('pdf')) return 'FileText';
  if (fileType.includes('image')) return 'Image';
  return 'Paperclip';
};

export const canCompleteTrip = (trip: Trip): boolean => {
  const unresolvedFlags = getUnresolvedFlagsCount(trip.costs);
  return unresolvedFlags === 0;
};

export const calculateKPIs = (trip: Trip): KPIs => {
  const totalRevenue = trip.baseRevenue || 0;
  const totalExpenses = calculateTotalCosts(trip.costs);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const costPerKm = trip.distanceKm && trip.distanceKm > 0 ? totalExpenses / trip.distanceKm : 0;

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    costPerKm,
    currency: trip.revenueCurrency
  };
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const parseCSV = (text: string): any[] => {
  try {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length < headers.length) continue;

      const row: Record<string, any> = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });
      data.push(row);
    }

    return data;
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error('Failed to parse CSV file. Please check the format.');
  }
};

export const generateCSVTemplate = (): string => {
  const headers = [
    'Fleet Number',
    'Route',
    'Client Name',
    'Start Date',
    'End Date',
    'Driver Name',
    'Distance (km)',
    'Base Revenue',
    'Revenue Currency',
    'Description',
    'Fuel Cost',
    'Maintenance Cost',
    'Driver Cost',
    'Tolls',
    'Other Costs',
  ];

  const sampleData = [
    'FL-001,New York NY - Boston MA,ABC Corp,2025-01-20,2025-01-22,John Smith,350,2500,USD,Sample trip,800,200,400,100,50',
  ];

  return [headers.join(','), ...sampleData].join('\n');
};

export const downloadCSVTemplate = () => {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', 'trips-import-template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};