import React, { useState } from 'react';
import { Trip, AdditionalCost } from '../../types';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input } from '../ui/FormElements';
import { Send, Upload, X } from 'lucide-react';

interface InvoiceSubmissionModalProps {
  isOpen: boolean;
  trip: Trip;
  onClose: () => void;
  onSubmit: (invoiceData: {
    invoiceNumber: string;
    invoiceDate: string;
    invoiceDueDate: string;
    finalTimeline: {
      finalArrivalDateTime: string;
      finalOffloadDateTime: string;
      finalDepartureDateTime: string;
    };
    validationNotes: string;
    proofOfDelivery: FileList | null;
    signedInvoice: FileList | null;
  }) => void;
  onAddAdditionalCost: (cost: Omit<AdditionalCost, 'id'>, files?: FileList) => void;
  onRemoveAdditionalCost: (costId: string) => void;
}

const InvoiceSubmissionModal: React.FC<InvoiceSubmissionModalProps> = ({
  isOpen,
  trip,
  onClose,
  onSubmit,
  onAddAdditionalCost,
  onRemoveAdditionalCost
}) => {
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    invoiceDueDate: '',
    finalArrivalDateTime: trip.actualArrivalDateTime || '',
    finalOffloadDateTime: trip.actualOffloadDateTime || '',
    finalDepartureDateTime: trip.actualDepartureDateTime || '',
    validationNotes: ''
  });

  const [files, setFiles] = useState<{
    proofOfDelivery: FileList | null;
    signedInvoice: FileList | null;
  }>({
    proofOfDelivery: null,
    signedInvoice: null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      invoiceNumber: formData.invoiceNumber,
      invoiceDate: formData.invoiceDate,
      invoiceDueDate: formData.invoiceDueDate,
      finalTimeline: {
        finalArrivalDateTime: formData.finalArrivalDateTime,
        finalOffloadDateTime: formData.finalOffloadDateTime,
        finalDepartureDateTime: formData.finalDepartureDateTime
      },
      validationNotes: formData.validationNotes,
      proofOfDelivery: files.proofOfDelivery,
      signedInvoice: files.signedInvoice
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Submit Trip for Invoicing" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-green-800">Ready for Invoicing</h4>
          <p className="text-sm text-green-700 mt-1">
            This completed trip is ready to be submitted for invoicing. Please validate all information and attach required documents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Invoice Number"
            value={formData.invoiceNumber}
            onChange={(value) => setFormData({ ...formData, invoiceNumber: value })}
            placeholder="INV-2024-001"
            required
          />
          
          <Input
            label="Invoice Date"
            type="date"
            value={formData.invoiceDate}
            onChange={(value) => setFormData({ ...formData, invoiceDate: value })}
            required
          />
          
          <Input
            label="Due Date"
            type="date"
            value={formData.invoiceDueDate}
            onChange={(value) => setFormData({ ...formData, invoiceDueDate: value })}
            required
          />
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Final Timeline Validation</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Final Arrival Time"
              type="datetime-local"
              value={formData.finalArrivalDateTime}
              onChange={(value) => setFormData({ ...formData, finalArrivalDateTime: value })}
              required
            />
            
            <Input
              label="Final Offload Time"
              type="datetime-local"
              value={formData.finalOffloadDateTime}
              onChange={(value) => setFormData({ ...formData, finalOffloadDateTime: value })}
              required
            />
            
            <Input
              label="Final Departure Time"
              type="datetime-local"
              value={formData.finalDepartureDateTime}
              onChange={(value) => setFormData({ ...formData, finalDepartureDateTime: value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Validation Notes
          </label>
          <textarea
            value={formData.validationNotes}
            onChange={(e) => setFormData({ ...formData, validationNotes: e.target.value })}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any notes about timeline validation or special circumstances..."
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proof of Delivery *
            </label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => setFiles({ ...files, proofOfDelivery: e.target.files })}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                file:rounded-md file:border-0 file:text-sm file:font-medium 
                file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signed Invoice *
            </label>
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              onChange={(e) => setFiles({ ...files, signedInvoice: e.target.files })}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
                file:rounded-md file:border-0 file:text-sm file:font-medium 
                file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              required
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onClose} icon={<X className="w-4 h-4" />}>
            Cancel
          </Button>
          <Button type="submit" icon={<Send className="w-4 h-4" />}>
            Submit for Invoicing
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default InvoiceSubmissionModal;