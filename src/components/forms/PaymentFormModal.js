import React, { useState, useEffect } from 'react';
import Modal from '../Modal';
import TextAreaField from '../TextAreaField';
import FileUploader from '../FileUploader';
import { Loader2 } from 'lucide-react';

const PaymentFormModal = ({ isOpen, onClose, onSave, due, handleFileUpload }) => {
    const [details, setDetails] = useState("");
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setDetails('');
            setFile(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsUploading(true);
        let fileUrl = '';
        if (file) {
            fileUrl = await handleFileUpload(file, 'payment_proofs');
        }
        await onSave(due, details, fileUrl);
        setIsUploading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Registrar Pago de ${due?.period}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <p className="text-white">Socio: <span className="font-bold">{due?.memberName}</span></p>
                 <p className="text-white">Monto: <span className="font-bold">${due?.amount}</span></p>
                <TextAreaField id="details" name="details" label="Detalle del pago (opcional)" placeholder="Ej: Pago en efectivo, transferencia..." value={details} onChange={(e) => setDetails(e.target.value)} />
                <FileUploader 
                    onFileSelect={setFile}
                    identifier="payment-proof" 
                    acceptedFileTypes="*" 
                />
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="submit" disabled={isUploading} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-500">
                         {isUploading ? <Loader2 className="animate-spin" /> : "Confirmar Pago"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PaymentFormModal;