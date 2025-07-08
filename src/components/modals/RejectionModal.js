import React, { useState } from 'react';
import Modal from '../Modal';
import TextAreaField from '../TextAreaField';

const RejectionModal = ({ isOpen, onClose, onConfirm, title = "Rechazar Clase", placeholder = "Ej: No tengo disponibilidad..." }) => {
    const [comment, setComment] = useState("");

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(comment);
        setComment("");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <TextAreaField
                    id="rejectionComment"
                    label="Motivo (opcional)"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={placeholder}
                />
                <div className="flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="button" onClick={handleConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Confirmar</button>
                </div>
            </div>
        </Modal>
    );
};

export default RejectionModal;