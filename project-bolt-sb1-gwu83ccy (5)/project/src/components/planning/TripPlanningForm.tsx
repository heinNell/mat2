import React, { useState } from 'react';
import { Trip, DelayReason } from '../../types';
import Button from '../ui/Button';
import { Input, Select } from '../ui/FormElements';
import { Calendar, Clock, AlertTriangle } from 'lucide-react';

interface TripPlanningFormProps {
  trip: Trip;
  onUpdate: (trip: Trip) => void;
  onAddDelay: (delay: Omit<DelayReason, 'id'>) => void;
}

const TripPlanningForm: React.FC<TripPlanningFormProps> = ({ trip, onUpdate, onAddDelay }) => {
  const [timeline, setTimeline] = useState({
    plannedArrival: trip.plannedArrivalDateTime || '',
    actualArrival: trip.actualArrivalDateTime || '',
    plannedOffload: trip.plannedOffloadDateTime || '',
    actualOffload: trip.actualOffloadDateTime || '',
    plannedDeparture: trip.plannedDepartureDateTime || '',
    actualDeparture: trip.actualDepartureDateTime || ''
  });

  const [delayForm, setDelayForm] = useState({
    type: 'weather' as DelayReason['type'],
    description: '',
    impact: 'minor' as DelayReason['impact'],
    duration: ''
  });

  const handleTimelineUpdate = () => {
    const updatedTrip: Trip = {
      ...trip,
      plannedArrivalDateTime: timeline.plannedArrival,
      actualArrivalDateTime: timeline.actualArrival,
      plannedOffloadDateTime: timeline.plannedOffload,
      actualOffloadDateTime: timeline.actualOffload,
      plannedDepartureDateTime: timeline.plannedDeparture,
      actualDepartureDateTime: timeline.actualDeparture
    };
    onUpdate(updatedTrip);
  };

  const handleAddDelay = () => {
    if (!delayForm.description || !delayForm.duration) return;
    
    onAddDelay({
      type: delayForm.type,
      description: delayForm.description,
      impact: delayForm.impact,
      duration: parseFloat(delayForm.duration)
    });
    
    setDelayForm({
      type: 'weather',
      description: '',
      impact: 'minor',
      duration: ''
    });
  };

  const delayTypes = [
    { value: 'weather', label: 'Weather' },
    { value: 'traffic', label: 'Traffic' },
    { value: 'mechanical', label: 'Mechanical' },
    { value: 'client', label: 'Client Related' },
    { value: 'other', label: 'Other' }
  ];

  const impactLevels = [
    { value: 'minor', label: 'Minor (< 2 hours)' },
    { value: 'moderate', label: 'Moderate (2-8 hours)' },
    { value: 'major', label: 'Major (> 8 hours)' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h4 className="text-sm font-medium text-blue-800">Trip Timeline Management</h4>
        </div>
        <p className="text-sm text-blue-700 mt-1">
          Track planned vs actual timeline events and manage delay reasons for accurate reporting.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Timeline Events</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Planned Timeline</h4>
            <Input
              label="Planned Arrival"
              type="datetime-local"
              value={timeline.plannedArrival}
              onChange={(value) => setTimeline({ ...timeline, plannedArrival: value })}
            />
            <Input
              label="Planned Offload Start"
              type="datetime-local"
              value={timeline.plannedOffload}
              onChange={(value) => setTimeline({ ...timeline, plannedOffload: value })}
            />
            <Input
              label="Planned Departure"
              type="datetime-local"
              value={timeline.plannedDeparture}
              onChange={(value) => setTimeline({ ...timeline, plannedDeparture: value })}
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-gray-700">Actual Timeline</h4>
            <Input
              label="Actual Arrival"
              type="datetime-local"
              value={timeline.actualArrival}
              onChange={(value) => setTimeline({ ...timeline, actualArrival: value })}
            />
            <Input
              label="Actual Offload Start"
              type="datetime-local"
              value={timeline.actualOffload}
              onChange={(value) => setTimeline({ ...timeline, actualOffload: value })}
            />
            <Input
              label="Actual Departure"
              type="datetime-local"
              value={timeline.actualDeparture}
              onChange={(value) => setTimeline({ ...timeline, actualDeparture: value })}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleTimelineUpdate} icon={<Clock className="w-4 h-4" />}>
            Update Timeline
          </Button>
        </div>
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Delay Reasons</h3>
        
        {trip.delayReasons && trip.delayReasons.length > 0 && (
          <div className="mb-4 space-y-2">
            {trip.delayReasons.map((delay) => (
              <div key={delay.id} className="bg-amber-50 border border-amber-200 rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-medium capitalize">{delay.type}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      delay.impact === 'major' ? 'bg-red-100 text-red-800' :
                      delay.impact === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {delay.impact}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600">{delay.duration} hours</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{delay.description}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Add Delay Reason</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Delay Type"
              value={delayForm.type}
              onChange={(value) => setDelayForm({ ...delayForm, type: value as DelayReason['type'] })}
              options={delayTypes}
            />
            <Select
              label="Impact Level"
              value={delayForm.impact}
              onChange={(value) => setDelayForm({ ...delayForm, impact: value as DelayReason['impact'] })}
              options={impactLevels}
            />
          </div>
          <div className="mt-4 space-y-4">
            <Input
              label="Description"
              value={delayForm.description}
              onChange={(value) => setDelayForm({ ...delayForm, description: value })}
              placeholder="Describe the cause and nature of the delay"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Duration (hours)"
                type="number"
                value={delayForm.duration}
                onChange={(value) => setDelayForm({ ...delayForm, duration: value })}
                placeholder="2.5"
              />
              <div className="flex items-end">
                <Button onClick={handleAddDelay} icon={<AlertTriangle className="w-4 h-4" />}>
                  Add Delay
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripPlanningForm;