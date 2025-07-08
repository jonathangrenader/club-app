import React from 'react';
import Modal from '../Modal';

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