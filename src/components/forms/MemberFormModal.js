import React, { useState, useMemo } from 'react';
import Modal from '../Modal';
import InputField from '../InputField';
import SelectField from '../SelectField';
import TextAreaField from '../TextAreaField';
import FileUploader from '../FileUploader';
import { Loader2, Upload } from 'lucide-react';

const MemberFormModal = ({ isOpen, onClose, onSave, memberData, setMemberData, config, activities, handleFileUpload }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);

    const handleChange = (e) => {
        let { name, value, type, checked } = e.target;
        if (name === 'celular') {
            value = value.replace(/[^0-9+]/g, '');
        }
        setMemberData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handlePhotoUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        const url = await handleFileUpload(selectedFile, 'member_photos');
        if (url) {
            setMemberData(prev => ({ ...prev, photoURL: url }));
        }
        setIsUploading(false);
        setSelectedFile(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (memberData.password && memberData.password !== memberData.confirmPassword) {
            alert("Las contraseñas no coinciden.");
            return;
        }
        onSave(memberData);
    };

    const memberTypes = useMemo(() => Object.keys(config?.fees || {}), [config]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={memberData?.id ? "Editar Socio" : "Añadir Nuevo Socio"} size="xl">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <InputField id="name" name="name" label="Nombre Completo" placeholder="John Doe" value={memberData?.name || ''} onChange={handleChange} required />
                        <InputField id="dni" name="dni" label="DNI" placeholder="12345678" value={memberData?.dni || ''} onChange={handleChange} />
                        <InputField id="email" name="email" label="Email" type="email" placeholder="john.doe@example.com" value={memberData?.email || ''} onChange={handleChange} />
                        <InputField id="birthDate" name="birthDate" label="Fecha de Nacimiento" type="date" value={memberData?.birthDate || ''} onChange={handleChange} />
                        <InputField id="celular" name="celular" label="Nº de Celular (con +)" placeholder="+5491112345678" value={memberData?.celular || ''} onChange={handleChange} />
                        <InputField id="otroContacto" name="otroContacto" label="Otro Contacto" placeholder="Teléfono de familiar" value={memberData?.otroContacto || ''} onChange={handleChange} />
                    </div>
                    <div className="space-y-2">
                         <label className="block text-sm font-medium text-gray-300 mb-1">Foto de Perfil</label>
                         <FileUploader onFileSelect={setSelectedFile} currentFileUrl={memberData?.photoURL} identifier="member-photo" />
                         {selectedFile && (
                            <button type="button" onClick={handlePhotoUpload} disabled={isUploading} className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center disabled:bg-gray-500">
                                 {isUploading ? <Loader2 className="animate-spin" /> : <Upload size={16} className="mr-2" />}
                                 {isUploading ? 'Subiendo...' : "Confirmar Foto"}
                            </button>
                         )}
                    </div>
                 </div>
                 <div className="border-t border-gray-700 pt-4">
                     <h3 className="text-lg font-semibold text-gray-200 mb-2">Membresía y Actividad</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SelectField id="memberType" name="memberType" label="Tipo de Socio" value={memberData?.memberType || ''} onChange={handleChange} required>
                            <option value="">Seleccione un tipo</option>
                            {memberTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </SelectField>
                        <SelectField id="activityId" name="activityId" label="Actividad Principal" value={memberData?.activityId || ''} onChange={handleChange}>
                           <option value="">Ninguna</option>
                           {activities.map(act => <option key={act.id} value={act.id}>{act.name}</option>)}
                       </SelectField>
                    </div>
                </div>
                 <div className="border-t border-gray-700 pt-4">
                     <h3 className="text-lg font-semibold text-gray-200 mb-2">Grupo Familiar y Estado</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                          <InputField id="grupoFamiliar" name="grupoFamiliar" label="ID Grupo Familiar" placeholder="Ej: FAM-GARCIA-01" value={memberData?.grupoFamiliar || ''} onChange={handleChange} />
                          <div className="flex items-center pt-6">
                              <input id="tieneFamiliares" name="tieneFamiliares" type="checkbox" checked={!!memberData?.tieneFamiliares} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                              <label htmlFor="tieneFamiliares" className="ml-2 block text-sm text-gray-300">Tiene familiares</label>
                          </div>
                          <SelectField id="status" name="status" label="Estado" value={memberData?.status || 'Activo'} onChange={handleChange} required>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                            <option value="Suspendido">Suspendido</option>
                        </SelectField>
                     </div>
                 </div>
                 <div className="border-t border-gray-700 pt-4">
                     <h3 className="text-lg font-semibold text-gray-200 mb-2">Dirección</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputField id="direccion" name="direccion" label="Dirección" placeholder="Av. Siempre Viva 742" value={memberData?.direccion || ''} onChange={handleChange} />
                        <InputField id="localidad" name="localidad" label="Localidad" placeholder="Springfield" value={memberData?.localidad || ''} onChange={handleChange} />
                         <InputField id="codigoPostal" name="codigoPostal" label="Código Postal" placeholder="B1686" value={memberData?.codigoPostal || ''} onChange={handleChange} />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                         <InputField id="provincia" name="provincia" label="Provincia" placeholder="Buenos Aires" value={memberData?.provincia || ''} onChange={handleChange} />
                        <SelectField id="pais" name="pais" label="País" value={memberData?.pais || 'Argentina'} onChange={handleChange}>
                            <option value="Argentina">Argentina</option>
                             <option value="Uruguay">Uruguay</option>
                             <option value="Paraguay">Paraguay</option>
                             <option value="Bolivia">Bolivia</option>
                             <option value="Chile">Chile</option>
                             <option value="Otro">Otro</option>
                         </SelectField>
                    </div>
                 </div>
                 <div className="border-t border-gray-700 pt-4">
                     <h3 className="text-lg font-semibold text-gray-200 mb-2">Credenciales de Acceso</h3>
                      <p className="text-sm text-gray-400 mb-2">Establece la clave para que el socio acceda a su portal. Si dejas los campos en blanco, se mantendrá la clave actual.</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <InputField id="password" name="password" label="Nueva Clave de Acceso" type="password" placeholder="••••••••" value={memberData?.password || ''} onChange={handleChange} />
                         <InputField id="confirmPassword" name="confirmPassword" label="Confirmar Nueva Clave" type="password" placeholder="••••••••" value={memberData?.confirmPassword || ''} onChange={handleChange} />
                     </div>
                 </div>
                 <TextAreaField id="comentarios" name="comentarios" label="Comentarios" placeholder="Notas internas sobre el socio..." value={memberData?.comentarios || ''} onChange={handleChange} />
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-600">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Guardar Socio</button>
                </div>
            </form>
        </Modal>
    );
};

export default MemberFormModal;