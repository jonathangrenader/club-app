import React from 'react';
import Modal from '../Modal';
import InputField from '../InputField';
import SelectField from '../SelectField';
import TextAreaField from '../TextAreaField';
import ActivityIcon, { activityIcons } from '../ActivityIcon';

const ActivityFormModal = ({ isOpen, onClose, onSave, activityData, setActivityData, spaces }) => {
    const handleChange = (e) => {
        const { name, value } = e.target;
        setActivityData(prev => ({ ...prev, [name]: value }));
    };

    const handleSpaceChange = (spaceName) => {
        const currentSpaces = activityData?.allowedSpaces || [];
        const newSpaces = currentSpaces.includes(spaceName) 
            ? currentSpaces.filter(s => s !== spaceName) 
            : [...currentSpaces, spaceName];
        setActivityData(prev => ({ ...prev, allowedSpaces: newSpaces }));
    };
    
    const handleIconChange = (iconName) => {
        setActivityData(prev => ({ ...prev, icon: iconName }))
    }

    const handleSubmit = (e) => { e.preventDefault(); onSave(activityData); };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={activityData?.id ? "Editar Actividad" : "Añadir Nueva Actividad"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <InputField id="name" name="name" label="Nombre de la Actividad" placeholder="Yoga" value={activityData?.name || ''} onChange={handleChange} required />
                <TextAreaField id="description" name="description" label="Descripción" placeholder="Clase de Yoga para todos los niveles." value={activityData?.description || ''} onChange={handleChange} />
                
                <SelectField id="icon" name="icon" label="Ícono" value={activityData?.icon || 'Dumbbell'} onChange={(e) => handleIconChange(e.target.value)}>
                    {Object.keys(activityIcons).map(iconName => (
                        <option key={iconName} value={iconName}>{iconName}</option>
                    ))}
                </SelectField>

                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Espacios Permitidos</label>
                    <div className="grid grid-cols-2 gap-2">
                        {spaces.map(space => (
                            <div key={space.name} className="flex items-center">
                                <input 
                                    id={`space-${space.name}`} 
                                    type="checkbox" 
                                    checked={activityData?.allowedSpaces?.includes(space.name) || false}
                                    onChange={() => handleSpaceChange(space.name)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
                                />
                                <label htmlFor={`space-${space.name}`} className="ml-2 block text-sm text-gray-300">{space.name}</label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Actividad</button>
                </div>
            </form>
        </Modal>
    );
};

export default ActivityFormModal;