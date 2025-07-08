import React, { useState } from 'react';
import Modal from '../Modal';
import InputField from '../InputField';
import SelectField from '../SelectField';

const UserFormModal = ({ isOpen, onClose, onSave, userData, setUserData }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(userData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={userData?.id ? "Editar Usuario" : "Añadir Nuevo Usuario"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField id="email" name="email" label="Email" type="email" placeholder="usuario@ejemplo.com" value={userData?.email || ''} onChange={handleChange} required />
                <InputField id="password" name="password" label="Contraseña" type="password" placeholder={userData?.id ? 'Dejar en blanco para no cambiar' : '••••••••'} value={userData?.password || ''} onChange={handleChange} />
                <SelectField id="role" name="role" label="Rol" value={userData?.role || 'Staff'} onChange={handleChange}>
                    <option value="Staff">Staff</option>
                    <option value="Admin">Admin</option>
                    <option value="Instructor">Instructor</option>
                </SelectField>
                <div className="flex justify-end gap-3 pt-4">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Usuario</button>
                </div>
            </form>
        </Modal>
    );
};

export default UserFormModal;
