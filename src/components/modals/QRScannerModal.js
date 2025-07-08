import React from 'react';
import Modal from '../Modal';
import { Scanner } from '@yudiel/react-qr-scanner';

const QRScannerModal = ({ isOpen, onClose, onScanSuccess }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Escanear Código QR">
            <Scanner
                onDecode={(result) => onScanSuccess(result)}
                onError={(error) => console.log(error?.message)}
            />
            <p className="text-center text-gray-400 mt-4">Apunta la cámara al código QR del socio o instructor.</p>
        </Modal>
    );
};

export default QRScannerModal;