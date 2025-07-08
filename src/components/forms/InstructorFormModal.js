import React, { useState } from 'react';
import Modal from '../Modal';
import InputField from '../InputField';
import FileUploader from '../FileUploader';
import { Loader2, Upload } from 'lucide-react';

const InstructorFormModal = ({ isOpen, onClose, onSave, instructorData, setInstructorData, activities, handleFileUpload }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleDisciplinesChange = (activityId) => {
        const currentDisciplines = instructorData?.disciplines || [];
        const newDisciplines = currentDisciplines.includes(activityId) 
            ? currentDisciplines.filter(id => id !== activityId) 
            : [...currentDisciplines, activityId];
        setInstructorData(prev => ({ ...prev, disciplines: newDisciplines }));
    };
    
    const handlePhotoUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        const url = await handleFileUpload(selectedFile, 'instructor_photos');
        if (url) {
            setInstructorData(prev => ({ ...prev, photoURL: url }));
        }
        setIsUploading(false);
        setSelectedFile(null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setInstructorData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(instructorData);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={instructorData?.id ? "Editar Instructor" : "Añadir Nuevo Instructor"} size="xl">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <InputField id="firstName" name="firstName" label="Nombre" placeholder="Jane" value={instructorData?.firstName || ''} onChange={handleChange} required />
                            <InputField id="lastName" name="lastName" label="Apellido" placeholder="Smith" value={instructorData?.lastName || ''} onChange={handleChange} required />
                        </div>
                        <InputField id="email" name="email" label="Email de Acceso" type="email" placeholder="instructor@ejemplo.com" value={instructorData?.email || ''} onChange={handleChange} required />
                        <InputField id="phone" name="phone" label="Teléfono" placeholder="+549..." value={instructorData?.phone || ''} onChange={handleChange} />
                        <InputField id="password" name="password" label="Contraseña" type="password" placeholder={instructorData?.id ? "Dejar en blanco para no cambiar" : "••••••••"} value={instructorData?.password || ''} onChange={handleChange} />
                        <div className="flex items-center">
                           <input id="canScanQR" name="canScanQR" type="checkbox" checked={!!instructorData?.canScanQR} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                           <label htmlFor="canScanQR" className="ml-2 block text-sm text-gray-300">Permitir escanear QR para asistencia</label>
                       </div>
                    </div>
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Foto de Perfil</label>
                        <FileUploader onFileSelect={setSelectedFile} currentFileUrl={instructorData?.photoURL} identifier="instructor-photo" />
                        {selectedFile && (
                           <button type="button" onClick={handlePhotoUpload} disabled={isUploading} className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center disabled:bg-gray-500">
                                {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={16} className="mr-2" />}
                                {isUploading ? 'Subiendo...' : "Confirmar Foto"}
                           </button>
                        )}
                    </div>
                </div>

                <div className="border-t border-gray-700 pt-4">
                    <h3 className="text-lg font-semibold text-gray-200 mb-2">Disciplinas que enseña</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {activities.map(activity => (
                            <div key={activity.id} className="flex items-center">
                                <input 
                                    id={`discipline-${activity.id}`} 
                                    type="checkbox" 
                                    checked={instructorData?.disciplines?.includes(activity.id) || false}
                                    onChange={() => handleDisciplinesChange(activity.id)}
                                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-gray-700"
                                />
                                <label htmlFor={`discipline-${activity.id}`} className="ml-2 block text-sm text-gray-300">{activity.name}</label>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Instructor</button>
                </div>
            </form>
        </Modal>
    );
};

export default InstructorFormModal;