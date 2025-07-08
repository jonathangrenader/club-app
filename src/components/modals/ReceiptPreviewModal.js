import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import Modal from '../Modal';
import TalonarioPreview from '../../modules/config/TalonarioPreview';
import { Download } from 'lucide-react';

const ReceiptPreviewModal = ({ isOpen, onClose, payment, clubConfig }) => {
    const receiptRef = useRef(null);

    const handleDownload = () => {
        if (receiptRef.current) {
            html2canvas(receiptRef.current, { backgroundColor: '#111827' }).then(canvas => {
                const link = document.createElement('a');
                link.download = `recibo-${payment.memberName}-${payment.period}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            });
        }
    };

    if (!isOpen) return null;
    
    // Asegurarse de que talonarioConfig no sea undefined
    const talonarioConfig = payment.receiptConfig || {};
    
    const receiptData = {
        socioName: payment.memberName,
        dni: payment.memberDni,
        plan: payment.memberType,
        paymentDate: payment.date?.toDate().toLocaleDateString(),
        amount: payment.amount,
        observaciones: payment.details
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Recibo de ${payment.memberName}`}>
            <div className="flex flex-col items-center gap-4">
                <TalonarioPreview 
                    ref={receiptRef} 
                    talonarioConfig={talonarioConfig} 
                    clubConfig={clubConfig} 
                    receiptData={receiptData} 
                />
                <button 
                    onClick={handleDownload} 
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700"
                >
                    <Download size={16} className="mr-2" /> Descargar Recibo
                </button>
            </div>
        </Modal>
    );
};

export default ReceiptPreviewModal;