import React from 'react';
import { Trip } from '../../types';
import { formatCurrency, calculateKPIs } from '../../utils/helpers';

interface TripReportProps {
  trip: Trip;
}

const TripReport: React.FC<TripReportProps> = ({ trip }) => {
  const kpis = calculateKPIs(trip);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Trip Report: Fleet {trip.fleetNumber}
        </h2>
        <p className="text-gray-600">{trip.route} • {trip.startDate} to {trip.endDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-900">
            {formatCurrency(kpis.totalRevenue, kpis.currency)}
          </p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-900">
            {formatCurrency(kpis.totalExpenses, kpis.currency)}
          </p>
        </div>
        
        <div className={`p-4 rounded-lg ${kpis.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
          <h3 className={`text-sm font-medium ${kpis.netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
            Net Profit/Loss
          </h3>
          <p className={`text-2xl font-bold ${kpis.netProfit >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {formatCurrency(kpis.netProfit, kpis.currency)}
          </p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">Profit Margin</h3>
          <p className={`text-2xl font-bold ${kpis.profitMargin >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
            {kpis.profitMargin.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cost Breakdown</h3>
        <div className="space-y-2">
          {trip.costs.length === 0 ? (
            <p className="text-gray-500">No cost entries recorded</p>
          ) : (
            trip.costs.map((cost, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <span className="font-medium">{cost.category} - {cost.subCategory}</span>
                  <span className="text-sm text-gray-500 ml-2">({cost.date})</span>
                </div>
                <span className="font-medium">
                  {formatCurrency(cost.amount, cost.currency)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default TripReport;