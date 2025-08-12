import React, { useState, useMemo, useRef } from 'react';
import { Trip } from '../../types';
import Card, { CardContent, CardHeader } from '../ui/Card';
import Button from '../ui/Button';
import SyncIndicator from '../ui/SyncIndicator';
import {
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Upload,
  Download,
  RefreshCw,
  Activity,
  Clock,
  Globe,
  MapPin,
  Calculator,
} from 'lucide-react';
import { formatCurrency, calculateTotalCosts, getFlaggedCostsCount, parseCSV, downloadCSVTemplate } from '../../utils/helpers';
import LoadImportModal from '../trips/LoadImportModal';
import { useRealtimeTrips } from '../../hooks/useRealtimeTrips';
import { useWebBookTrips } from '../../hooks/useWebBookTrips';
import { useAppContext } from '../../context/AppContext';

interface ActiveTripsProps {
  trips: Trip[];
  onEdit: (trip: Trip) => void;
  onDelete: (id: string) => void;
  onView: (trip: Trip) => void;
}

const ActiveTrips: React.FC<ActiveTripsProps> = ({ trips: manualTrips, onEdit, onDelete, onView }) => {
  const { addTrip } = useAppContext();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [filterWebBookOnly, setFilterWebBookOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks for fetching different data sources
  const { trips: firestoreTrips } = useRealtimeTrips({ status: 'active' });
  const { 
    trips: webBookTrips, 
    loading: webBookLoading,
    activeTrips: activeWebBookTrips 
  } = useWebBookTrips();

  // State for webhook trips (simulated)
  const [webhookTrips, setWebhookTrips] = useState<Trip[]>([
    {
      id: 'webhook-1',
      fleetNumber: 'WH-001',
      route: 'Seattle, WA - Portland, OR',
      clientName: 'Pacific Freight',
      clientType: 'external',
      baseRevenue: 1650,
      revenueCurrency: 'USD',
      startDate: '2025-01-15',
      endDate: '2025-01-16',
      driverName: 'David Kim',
      distanceKm: 280,
      description: 'Webhook integrated trip',
      status: 'active',
      costs: [],
      source: 'webhook',
      externalId: 'wh-12345',
      lastUpdated: new Date().toISOString(),
      totalCost: 890,
      costBreakdown: {
        fuel: 420,
        maintenance: 150,
        driver: 250,
        tolls: 45,
        other: 25,
      },
    },
  ]);

  // Edit form state
  const [editForm, setEditForm] = useState<{
    cost: number;
    fuel?: number;
    maintenance?: number;
    driver?: number;
    tolls?: number;
    other?: number;
  }>({
    cost: 0,
    fuel: 0,
    maintenance: 0,
    driver: 0,
    tolls: 0,
    other: 0,
  });

  // Normalize different trip formats
  const normalizeTrip = (trip: any): Trip => {
    if (trip.source === 'firestore') {
      return {
        ...trip,
        id: trip.id,
        fleetNumber: trip.fleetNumber,
        route: trip.route,
        clientName: trip.clientName,
        clientType: trip.clientType,
        baseRevenue: trip.baseRevenue,
        revenueCurrency: trip.revenueCurrency,
        startDate: trip.startDate,
        endDate: trip.endDate,
        driverName: trip.driverName,
        distanceKm: trip.distanceKm,
        description: trip.description,
        status: trip.status,
        costs: trip.costs || [],
        source: 'firestore',
      };
    }

    if (trip.source === 'web_book') {
      return {
        ...trip,
        id: trip.id,
        fleetNumber: trip.fleetNumber || trip.loadRef,
        route: trip.route,
        clientName: trip.clientName,
        clientType: trip.clientType,
        baseRevenue: trip.baseRevenue,
        revenueCurrency: trip.revenueCurrency,
        startDate: trip.startDate,
        endDate: trip.endDate,
        driverName: trip.driverName,
        distanceKm: trip.distanceKm,
        description: trip.description,
        status: trip.status,
        costs: trip.costs || [],
        source: 'web_book',
      };
    }

    return trip;
  };

  // Combine all trips with filtering
  const allTrips = useMemo(() => {
    let combinedTrips: Trip[] = [];

    // Add manual trips
    combinedTrips = [...combinedTrips, ...manualTrips.map(trip => ({ ...trip, source: 'manual' as const }))];

    // Add Firestore trips
    if (firestoreTrips && firestoreTrips.length > 0) {
      combinedTrips = [...combinedTrips, ...firestoreTrips.map(normalizeTrip)];
    }

    // Add Web Book trips
    if (webBookTrips && webBookTrips.length > 0) {
      combinedTrips = [...combinedTrips, ...webBookTrips.map(normalizeTrip)];
    }

    // Add webhook trips
    combinedTrips = [...combinedTrips, ...webhookTrips];

    return combinedTrips;
  }, [manualTrips, firestoreTrips, webBookTrips, webhookTrips]);

  // Apply filters
  const filteredTrips = useMemo(() => {
    let filtered = [...allTrips];

    if (filterWebBookOnly) {
      filtered = filtered.filter(trip => trip.source === 'web_book');
    }

    if (statusFilter) {
      filtered = filtered.filter(trip => trip.status === statusFilter);
    }

    return filtered;
  }, [allTrips, filterWebBookOnly, statusFilter]);

  // Calculate stats
  const webBookTripsCount = allTrips.filter(trip => trip.source === 'web_book').length;
  const firestoreTripsCount = allTrips.filter(trip => trip.source === 'firestore').length;
  const webhookTripsCount = allTrips.filter(trip => trip.source === 'webhook').length;
  const manualTripsCount = allTrips.filter(trip => trip.source === 'manual').length;

  const openImportModal = () => setIsImportModalOpen(true);
  const closeImportModal = () => setIsImportModalOpen(false);

  const handleEdit = (trip: Trip) => {
    if (trip.source === 'web_book') {
      // Web book trips can't be edited
      alert('Web Book trips cannot be edited directly. Please use the Web Book system to make changes.');
      return;
    }
    onEdit(trip);
  };

  const handleDelete = (id: string) => {
    const trip = allTrips.find(t => t.id === id);
    if (trip && trip.source === 'web_book') {
      alert('Web Book trips cannot be deleted from this interface. Please use the Web Book system.');
      return;
    }
    
    if (trip && confirm(`Delete trip ${trip.fleetNumber}? This cannot be undone.`)) {
      if (trip.source === 'webhook') {
        setWebhookTrips(prev => prev.filter(t => t.id !== id));
      } else {
        onDelete(id);
      }
    }
  };

  const handleEditCosts = (trip: Trip) => {
    if (trip.source === 'web_book') {
      alert('Web Book trip costs are managed through the Web Book system.');
      return;
    }

    setEditingTrip(trip);
    setEditForm({
      cost: trip.totalCost || calculateTotalCosts(trip.costs),
      fuel: trip.costBreakdown?.fuel || 0,
      maintenance: trip.costBreakdown?.maintenance || 0,
      driver: trip.costBreakdown?.driver || 0,
      tolls: trip.costBreakdown?.tolls || 0,
      other: trip.costBreakdown?.other || 0,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseFloat(value) || 0;

    setEditForm(prev => {
      const updated = { ...prev, [name]: numValue };
      
      // Auto-calculate total cost
      if (name !== 'cost') {
        const totalCost = 
          (updated.fuel || 0) +
          (updated.maintenance || 0) +
          (updated.driver || 0) +
          (updated.tolls || 0) +
          (updated.other || 0);
        updated.cost = totalCost;
      }
      
      return updated;
    });
  };

  const handleSaveCosts = () => {
    if (!editingTrip) return;

    if (editingTrip.source === 'webhook') {
      // Update webhook trips
      setWebhookTrips(prev => prev.map(trip => {
        if (trip.id === editingTrip.id) {
          return {
            ...trip,
            totalCost: editForm.cost,
            costBreakdown: {
              fuel: editForm.fuel,
              maintenance: editForm.maintenance,
              driver: editForm.driver,
              tolls: editForm.tolls,
              other: editForm.other,
            },
            lastUpdated: new Date().toISOString(),
          };
        }
        return trip;
      }));
    }
    
    setEditingTrip(null);
    setSuccess('Trip costs updated successfully');
  };

  const handleCancelEdit = () => {
    setEditingTrip(null);
  };

  // CSV Import functionality
  const handleFileUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedData = parseCSV(content);

        if (importedData.length > 0) {
          const newTrips: Trip[] = importedData.map((row, index) => ({
            id: `imported-${Date.now()}-${index}`,
            fleetNumber: row['Fleet Number'] || `IMP-${Date.now()}-${index}`,
            route: row['Route'] || 'Unknown',
            clientName: row['Client Name'] || 'Unknown',
            clientType: (row['Client Type'] as 'internal' | 'external') || 'external',
            baseRevenue: parseFloat(row['Base Revenue']) || 0,
            revenueCurrency: (row['Revenue Currency'] as 'USD' | 'ZAR') || 'USD',
            startDate: row['Start Date'] || new Date().toISOString().split('T')[0],
            endDate: row['End Date'] || new Date().toISOString().split('T')[0],
            driverName: row['Driver Name'] || 'Unknown',
            distanceKm: parseFloat(row['Distance (km)']) || 0,
            description: row['Description'] || '',
            status: 'active' as const,
            costs: [],
            source: 'manual' as const,
            totalCost: parseFloat(row['Fuel Cost'] || '0') + 
                      parseFloat(row['Maintenance Cost'] || '0') + 
                      parseFloat(row['Driver Cost'] || '0') + 
                      parseFloat(row['Tolls'] || '0') + 
                      parseFloat(row['Other Costs'] || '0'),
            costBreakdown: {
              fuel: parseFloat(row['Fuel Cost']) || 0,
              maintenance: parseFloat(row['Maintenance Cost']) || 0,
              driver: parseFloat(row['Driver Cost']) || 0,
              tolls: parseFloat(row['Tolls']) || 0,
              other: parseFloat(row['Other Costs']) || 0,
            },
            lastUpdated: new Date().toISOString(),
          }));

          // Add to context
          newTrips.forEach(trip => {
            addTrip({
              fleetNumber: trip.fleetNumber,
              route: trip.route,
              clientName: trip.clientName,
              clientType: trip.clientType,
              baseRevenue: trip.baseRevenue,
              revenueCurrency: trip.revenueCurrency,
              startDate: trip.startDate,
              endDate: trip.endDate,
              driverName: trip.driverName,
              distanceKm: trip.distanceKm,
              description: trip.description,
            });
          });

          setSuccess(`Successfully imported ${newTrips.length} trips.`);
        } else {
          setError('No valid trips found in the file.');
        }
      } catch (err) {
        console.error('Error importing trips:', err);
        setError('Failed to import trips. Please check the file format.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };

    reader.onerror = () => {
      setError('Error reading the file.');
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  const handleRefresh = () => {
    setError(null);
    setSuccess(null);
    // In a real app, this would refresh the webhook data
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Active Trips</h2>
          <div className="flex items-center mt-1">
            <p className="text-gray-500 mr-3">
              {allTrips.length} total trip{allTrips.length !== 1 ? 's' : ''} 
              ({manualTripsCount} manual, {firestoreTripsCount} firestore, {webBookTripsCount} web book, {webhookTripsCount} webhook)
            </p>
            <SyncIndicator />
          </div>
          <div className="flex items-center mt-2">
            <Globe className="h-4 w-4 text-green-600 mr-1" />
            <span className="text-xs text-green-600 font-medium">Real-time updates enabled</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* File input (hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
          />

          <Button
            variant="outline"
            onClick={handleFileUploadClick}
            disabled={isUploading}
            icon={isUploading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          >
            {isUploading ? 'Importing...' : 'Import CSV'}
          </Button>

          <Button
            variant="outline"
            onClick={downloadCSVTemplate}
            icon={<Download className="w-4 h-4" />}
          >
            Download Template
          </Button>

          <Button
            variant="outline"
            onClick={handleRefresh}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Refresh Data
          </Button>

          <Button
            icon={<Upload className="w-4 h-4" />}
            onClick={openImportModal}
          >
            Import Trips
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-md">
          <div className="flex justify-between">
            <span className="text-green-700">{success}</span>
            <button
              onClick={() => setSuccess(null)}
              className="text-green-500 hover:text-green-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md">
          <div className="flex justify-between">
            <span className="text-red-700">{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="webBookFilter"
                checked={filterWebBookOnly}
                onChange={(e) => setFilterWebBookOnly(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="webBookFilter" className="ml-2 text-sm text-gray-700">
                Web Book Trips Only
              </label>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent>
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <div className="ml-5">
                <dt className="text-sm text-gray-500">Total Active</dt>
                <dd className="text-lg font-medium text-gray-900">{filteredTrips.length}</dd>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent>
            <div className="flex items-center">
              <Globe className="h-8 w-8 text-green-600" />
              <div className="ml-5">
                <dt className="text-sm text-gray-500">Web Book</dt>
                <dd className="text-lg font-medium text-gray-900">{webBookTripsCount}</dd>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-5">
                <dt className="text-sm text-gray-500">Firestore</dt>
                <dd className="text-lg font-medium text-gray-900">{firestoreTripsCount}</dd>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent>
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div className="ml-5">
                <dt className="text-sm text-gray-500">Manual/Webhook</dt>
                <dd className="text-lg font-medium text-gray-900">{manualTripsCount + webhookTripsCount}</dd>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trips found</h3>
          <p className="text-gray-500">
            {filterWebBookOnly || statusFilter
              ? 'Try adjusting your filters or create your first trip.'
              : 'Create your first trip or import data to start tracking.'}
          </p>
          <Button
            icon={<Upload className="w-4 h-4" />}
            onClick={openImportModal}
            className="mt-4"
          >
            Import Trips
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTrips.map((trip) => {
            const currency = trip.revenueCurrency;
            const totalCosts = trip.totalCost || calculateTotalCosts(trip.costs);
            const profit = (trip.baseRevenue || 0) - totalCosts;
            const flaggedCount = getFlaggedCostsCount(trip.costs);

            return (
              <Card key={trip.id} className="hover:shadow-md transition-shadow">
                <CardHeader
                  title={
                    <div className="flex items-center gap-3">
                      <span>Fleet {trip.fleetNumber} - {trip.route}</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        trip.source === 'web_book' ? 'bg-blue-100 text-blue-800' :
                        trip.source === 'firestore' ? 'bg-green-100 text-green-800' :
                        trip.source === 'webhook' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {trip.source === 'web_book' ? 'Web Book' :
                         trip.source === 'firestore' ? 'Firestore' :
                         trip.source === 'webhook' ? 'Webhook' : 'Manual'}
                      </span>
                      {trip.externalId && (
                        <span className="text-xs text-gray-500">ID: {trip.externalId}</span>
                      )}
                    </div>
                  }
                  subtitle={`${trip.clientName} • ${trip.startDate} to ${trip.endDate}`}
                />
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">Driver</p>
                      <p className="font-medium">{trip.driverName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Revenue</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(trip.baseRevenue || 0, currency)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Costs</p>
                      <p className="font-medium text-red-600">
                        {formatCurrency(totalCosts, currency)}
                      </p>
                      {trip.costBreakdown && (
                        <button
                          className="text-xs text-blue-600 hover:underline mt-1"
                          onClick={() => handleEditCosts(trip)}
                        >
                          View Breakdown
                        </button>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Net Profit</p>
                      <p className={`font-medium ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(profit, currency)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        {trip.costs.length} cost entries
                        {trip.distanceKm && ` • ${trip.distanceKm} km`}
                        {trip.lastUpdated && (
                          <div className="text-xs text-gray-400 mt-1">
                            Updated: {new Date(trip.lastUpdated).toLocaleString()}
                          </div>
                        )}
                      </div>
                      {flaggedCount > 0 && (
                        <div className="flex items-center space-x-1 text-amber-600">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">{flaggedCount} flagged</span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onView(trip)}
                        icon={<Eye className="w-3 h-3" />}
                      >
                        View
                      </Button>
                      {trip.costBreakdown && trip.source !== 'web_book' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditCosts(trip)}
                          icon={<Calculator className="w-3 h-3" />}
                        >
                          Edit Costs
                        </Button>
                      )}
                      {trip.source === 'manual' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(trip)}
                            icon={<Edit className="w-3 h-3" />}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(trip.id)}
                            icon={<Trash2 className="w-3 h-3" />}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cost Editing Modal */}
      {editingTrip && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 m-4">
            <h2 className="text-xl font-bold mb-4">
              Edit Trip Costs: {editingTrip.fleetNumber}
              {editingTrip.source && (
                <span className="ml-2 px-2 inline-flex text-xs leading-5 font-medium rounded-full bg-blue-100 text-blue-800">
                  {editingTrip.source.charAt(0).toUpperCase() + editingTrip.source.slice(1)} Trip
                </span>
              )}
            </h2>
            
            <div className="mb-4">
              <p><span className="font-medium">Route:</span> {editingTrip.route}</p>
              <p><span className="font-medium">Driver:</span> {editingTrip.driverName}</p>
              {editingTrip.externalId && (
                <p><span className="font-medium">External ID:</span> {editingTrip.externalId}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fuel Cost</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="fuel"
                      value={editForm.fuel}
                      onChange={handleInputChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Cost</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="maintenance"
                      value={editForm.maintenance}
                      onChange={handleInputChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Driver Cost</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="driver"
                      value={editForm.driver}
                      onChange={handleInputChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tolls</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="tolls"
                      value={editForm.tolls}
                      onChange={handleInputChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Costs</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="other"
                      value={editForm.other}
                      onChange={handleInputChange}
                      className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Cost</label>
                  <div className="mt-1 relative rounded-md shadow-sm bg-gray-50">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      name="cost"
                      value={editForm.cost}
                      readOnly
                      className="bg-gray-50 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Total is calculated automatically</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleCancelEdit}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveCosts}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      <LoadImportModal isOpen={isImportModalOpen} onClose={closeImportModal} />
    </div>
  );
};

export default ActiveTrips;