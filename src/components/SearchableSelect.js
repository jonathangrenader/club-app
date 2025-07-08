import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import InputField from './InputField';

/**
 * Un componente de selección con capacidad de búsqueda.
 * @param {string} label - El texto de la etiqueta para el campo.
 * @param {Array<Object>} options - El array de opciones a mostrar. Cada objeto debe tener 'id' y 'name'.
 * @param {string} selectedOption - El ID de la opción actualmente seleccionada.
 * @param {function} onSelect - La función a llamar cuando se selecciona una opción.
 * @param {string} placeholder - El texto del marcador de posición para el campo de búsqueda.
 */
const SearchableSelect = ({ label, options, selectedOption, onSelect, placeholder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(option =>
            option.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const handleSelect = (option) => {
        onSelect(option);
        setSearchTerm(option.name);
        setIsOpen(false);
    };

    // Cierra el dropdown si se hace clic fuera de él
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [wrapperRef]);

    // Actualiza el texto del input cuando la opción seleccionada cambia desde fuera
    useEffect(() => {
        const selected = options.find(o => o.id === selectedOption);
        setSearchTerm(selected ? selected.name : '');
    }, [selectedOption, options]);

    return (
        <div className="relative" ref={wrapperRef}>
            <InputField
                label={label}
                id="searchable-select"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!isOpen) setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                placeholder={placeholder}
                icon={Search}
            />
            {isOpen && (
                <ul className="absolute z-10 w-full bg-gray-800 border border-gray-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
                    {filteredOptions.length > 0 ? filteredOptions.map(option => (
                        <li
                            key={option.id}
                            onClick={() => handleSelect(option)}
                            className="px-3 py-2 text-sm text-white hover:bg-blue-600 cursor-pointer"
                        >
                            {option.name}
                        </li>
                    )) : <li className="px-3 py-2 text-sm text-gray-400">No se encontraron opciones.</li>}
                </ul>
            )}
        </div>
    );
};

export default SearchableSelect;
