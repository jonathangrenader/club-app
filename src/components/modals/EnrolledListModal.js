import React from 'react';
import Modal from '../Modal';

/**
 * Muestra una lista de socios inscriptos en una clase.
 * @param {boolean} isOpen - Controla si la modal está visible.
 * @param {function} onClose - Función para cerrar la modal.
 * @param {Array<Object>} members - Array de objetos de socios a listar.
 * @param {string} title - El título de la modal.
 */
const EnrolledListModal = ({ isOpen, onClose, members, title }) => {
    if (!isOpen) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <ul className="space-y-2 max-h-80 overflow-y-auto">
                {members && members.length > 0 ? (
                    members.map(member => (
                        <li key={member.id} className="bg-gray-700 p-3 rounded-md text-white">
                            {member.name}
                        </li>
                    ))
                ) : (
                    <p className="text-gray-400">No hay socios inscriptos en esta clase.</p>
                )}
            </ul>
        </Modal>
    );
};

export default EnrolledListModal;
