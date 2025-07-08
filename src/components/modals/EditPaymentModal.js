import React from 'react';
import Modal from '../Modal';
import TextAreaField from '../TextAreaField';

const EditPaymentModal = ({ isOpen, onClose, onSave, payment, setPayment }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Editar Detalle del Pago">
            <div className="space-y-4">
                <p className="text-white">
                    Editando el pago del socio <span className="font-bold">{payment.memberName}</span> para el período <span className="font-bold">{payment.period}</span>.
                </p>
                <TextAreaField
                    id="editDetails"
                    label="Detalle / Observaciones del Recibo"
                    value={payment.details}
                    onChange={(e) => setPayment(prev => ({ ...prev, details: e.target.value }))}
                />
                <div className="flex justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button" 
                        onClick={onSave} 
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EditPaymentModal;