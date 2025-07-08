import React, { useMemo } from 'react';
import Modal from '../Modal';
import InputField from '../InputField';
import SelectField from '../SelectField';

const ScheduleFormModal = ({ isOpen, onClose, onSave, scheduleData, setScheduleData, activities, instructors, spaces }) => {
    
    const handleChange = (e) => {
        const { name, value } = e.target;
        const newState = { ...scheduleData, [name]: value };

        if (name === 'activityId') {
            const selectedActivity = activities.find(a => a.id === value);
            const allowedSpaces = selectedActivity?.allowedSpaces || [];
            if (!allowedSpaces.includes(newState.space)) {
                newState.space = ''; 
            }
        }
        
        setScheduleData(newState);
    };
    
    const availableSpaces = useMemo(() => {
        if (!scheduleData?.activityId) {
            return [];
        }
        const selectedActivity = activities.find(a => a.id === scheduleData.activityId);
        if (!selectedActivity || !selectedActivity.allowedSpaces) {
            return [];
        }
        return spaces.filter(s => selectedActivity.allowedSpaces.includes(s.name));
    }, [scheduleData?.activityId, activities, spaces]);

    const handleSubmit = (e) => { e.preventDefault(); onSave(scheduleData); };

    const daysOfWeek = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={scheduleData?.id ? "Editar Clase" : "Programar Nueva Clase"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <SelectField id="activityId" name="activityId" label="Actividad" value={scheduleData?.activityId || ''} onChange={handleChange} required>
                    <option value="">Seleccione una actividad</option>
                    {activities.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                </SelectField>
                 <SelectField id="instructorId" name="instructorId" label="Instructor" value={scheduleData?.instructorId || ''} onChange={handleChange} required>
                    <option value="">Seleccione un instructor</option>
                    {instructors.map(inst => <option key={inst.id} value={inst.id}>{inst.firstName} {inst.lastName}</option>)}
                </SelectField>
                 <SelectField id="space" name="space" label="Espacio/Lugar" value={scheduleData?.space || ''} onChange={handleChange} disabled={!scheduleData?.activityId || availableSpaces.length === 0} required>
                    <option value="">{scheduleData?.activityId ? "Seleccione un espacio" : "Primero elija una actividad"}</option>
                    {availableSpaces.map(sp => <option key={sp.name} value={sp.name}>{sp.name}</option>)}
                </SelectField>
                 <InputField id="maxCapacity" name="maxCapacity" label="Cupo Máximo" type="number" value={scheduleData?.maxCapacity || ''} onChange={handleChange} required />
                <SelectField id="dayOfWeek" name="dayOfWeek" label="Día de la Semana" value={scheduleData?.dayOfWeek || ''} onChange={handleChange} required>
                    <option value="">Seleccione un día</option>
                    {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                </SelectField>
                <InputField id="startTime" name="startTime" label="Hora de Inicio" type="time" value={scheduleData?.startTime || ''} onChange={handleChange} required />
                <InputField id="endTime" name="endTime" label="Hora de Fin" type="time" value={scheduleData?.endTime || ''} onChange={handleChange} required />
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Clase</button>
                </div>
            </form>
        </Modal>
    );
};

export default ScheduleFormModal;