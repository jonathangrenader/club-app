import React from 'react';
import Modal from '../Modal';
import QRCode from "qrcode.react";

/**
 * Muestra una modal con un código QR para un socio.
 * @param {boolean} isOpen - Controla si la modal está visible.
 * @param {function} onClose - Función para cerrar la modal.
 * @param {string} qrValue - El valor (string) a codificar en el QR.
 * @param {string} memberName - El nombre del socio para mostrar en el título.
 */
const QRDisplayModal = ({ isOpen, onClose, qrValue, memberName }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Código QR para ${memberName}`}>
            <div className="bg-white p-6 rounded-lg flex flex-col items-center">
                <QRCode value={qrValue || ''} size={256} />
                <p className="text-gray-800 mt-4 text-center">Este QR contiene la información de la credencial del socio.</p>
            </div>
        </Modal>
    );
};

export default QRDisplayModal;
