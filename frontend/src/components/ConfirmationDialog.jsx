import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', isDangerous = false }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-full ${isDangerous ? 'bg-rose-950 text-rose-500' : 'bg-amber-950 text-amber-500'}`}>
          <AlertTriangle size={24} />
        </div>
        <div>
          <p className="text-slate-300 mb-6">{message}</p>
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className={`px-5 py-2 font-semibold text-white rounded-xl transition ${
                isDangerous ? 'bg-rose-600 hover:bg-rose-500' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmationDialog;
