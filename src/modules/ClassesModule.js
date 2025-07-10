import React, { useState } from 'react';
import ScheduleModule from './classes/ScheduleModule';
import ActivitiesModuleFull from './classes/ActivitiesModuleFull';
import InstructorsModuleFull from './classes/InstructorsModuleFull';
import { Loader2 } from 'lucide-react';

const ClassesModule = ({ db, currentClub, config, activities, schedule, instructors, handleFileUpload }) => {
    const [activeTab, setActiveTab] = useState('schedule');
    
    // El useEffect para buscar datos se ha eliminado.
    // Los datos ahora vienen por props.

    // Si los datos principales no han llegado, mostramos un loader.
    if (!activities || !schedule || !instructors) {
        return <div className="text-center p-8"><Loader2 className="animate-spin inline-block"/></div>;
    }

    return (
        <div>
            <div className="flex space-x-1 rounded-lg bg-gray-800 p-1 mb-6">
                <button onClick={() => setActiveTab('schedule')} className={`w-full p-2 text-sm font-medium rounded-md ${activeTab === 'schedule' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Horarios</button>
                <button onClick={() => setActiveTab('activities')} className={`w-full p-2 text-sm font-medium rounded-md ${activeTab === 'activities' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Actividades</button>
                <button id="instructor-tab-button" onClick={() => setActiveTab('instructors')} className={`w-full p-2 text-sm font-medium rounded-md ${activeTab === 'instructors' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Instructores</button>
            </div>
            
            {activeTab === 'schedule' && <ScheduleModule db={db} currentClub={currentClub} schedule={schedule} activities={activities} instructors={instructors} spaces={config.spaces || []} />}
            {activeTab === 'activities' && <ActivitiesModuleFull db={db} currentClub={currentClub} activities={activities} spaces={config.spaces || []} />}
            {activeTab === 'instructors' && <InstructorsModuleFull db={db} currentClub={currentClub} instructors={instructors} activities={activities} handleFileUpload={handleFileUpload} />}
        </div>
    );
};

export default ClassesModule;