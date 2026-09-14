import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

export const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete',
  confirmVariant = 'danger',
  loading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md" showClose={false}>
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 mb-4 ring-8 ring-rose-50/50">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">{message}</p>
        <div className="flex items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={onClose} disabled={loading} className="w-full">
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={loading}
            className="w-full"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
