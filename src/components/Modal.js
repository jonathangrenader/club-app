import React from 'react';
import { X } from 'lucide-react';

/**
 * Componente de ventana modal genérica.
 * @param {boolean} isOpen - Controla si la modal está visible.
 * @param {function} onClose - Función para cerrar la modal.
 * @param {string} title - El título a mostrar en la cabecera de la modal.
 * @param {React.ReactNode} children - El contenido a renderizar dentro de la modal.
 * @param {'lg' | 'xl' | '7xl'} [size='lg'] - El tamaño de la modal.
 */
const Modal = ({ isOpen, onClose, title, children, size = 'lg' }) => {
    if (!isOpen) return null;

    // Determina la clase de Tailwind para el tamaño de la modal
    const sizeClass = {
        'lg': 'max-w-lg',
        'xl': 'max-w-3xl',
        '7xl': 'max-w-7xl'
    }[size];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
            <div className={`bg-gray-800 rounded-xl shadow-2xl w-full ${sizeClass} p-6 sm:p-8 border border-gray-700`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
};

export default Modal;
