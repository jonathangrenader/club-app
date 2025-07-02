import React from 'react';

/**
 * Un componente reutilizable para campos de selección (dropdown).
 * @param {string} id - El ID del campo de selección.
 * @param {string} label - El texto de la etiqueta para el campo.
 * @param {string} value - El valor actual del campo.
 * @param {function} onChange - La función a llamar cuando el valor cambia.
 * @param {React.ReactNode} children - Las opciones (<option>) a renderizar dentro del select.
 * @param {boolean} [disabled=false] - Si el campo está deshabilitado.
 */
const SelectField = ({ id, label, value, onChange, children, disabled = false }) => (
    <div>
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">{label}</label>}
        <select 
            id={id} 
            name={id} 
            value={value || ''} 
            onChange={onChange} 
            disabled={disabled} 
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
            {children}
        </select>
    </div>
);

export default SelectField;
