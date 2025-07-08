import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import ScheduleModule from './classes/ScheduleModule';
import ActivitiesModuleFull from './classes/ActivitiesModuleFull';
import InstructorsModuleFull from './classes/InstructorsModuleFull';
import { Loader2 } from 'lucide-react';

const appId = 'the-club-cloud';

const ClassesModule = ({ db, currentClub, config, handleFileUpload }) => {
    const [activeTab, setActiveTab] = useState('schedule');
    const [activities, setActivities] = useState([]);
    const [instructors, setInstructors] = useState([]);
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!db || !currentClub?.id) return;
        setLoading(true);

        const activitiesQuery = query(collection(db, `artifacts/${appId}/public/data/activities`), where("clubId", "==", currentClub.id));
        const instructorsQuery = query(collection(db, `artifacts/${appId}/public/data/instructors`), where("clubId", "==", currentClub.id));
        const scheduleQuery = query(collection(db, `artifacts/${appId}/public/data/schedule`), where("clubId", "==", currentClub.id));

        const unsubActivities = onSnapshot(activitiesQuery, snap => setActivities(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubInstructors = onSnapshot(instructorsQuery, snap => setInstructors(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
        const unsubSchedule = onSnapshot(scheduleQuery, snap => {
            setSchedule(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            setLoading(false); // Consideramos que la carga termina cuando llega el último set de datos.
        });

        return () => {
            unsubActivities();
            unsubInstructors();
            unsubSchedule();
        };
    }, [db, currentClub.id]);

    return (
        <div>
            <div className="flex space-x-1 rounded-lg bg-gray-800 p-1 mb-6">
                <button onClick={() => setActiveTab('schedule')} className={`w-full p-2 text-sm font-medium rounded-md ${activeTab === 'schedule' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Horarios</button>
                <button onClick={() => setActiveTab('activities')} className={`w-full p-2 text-sm font-medium rounded-md ${activeTab === 'activities' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Actividades</button>
                <button id="instructor-tab-button" onClick={() => setActiveTab('instructors')} className={`w-full p-2 text-sm font-medium rounded-md ${activeTab === 'instructors' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>Instructores</button>
            </div>
            {loading ? <div className="text-center p-8"><Loader2 className="animate-spin inline-block"/></div> :
            <>
                {activeTab === 'schedule' && <ScheduleModule db={db} currentClub={currentClub} schedule={schedule} activities={activities} instructors={instructors} spaces={config.spaces || []} />}
                {activeTab === 'activities' && <ActivitiesModuleFull db={db} currentClub={currentClub} activities={activities} spaces={config.spaces || []} />}
                {activeTab === 'instructors' && <InstructorsModuleFull db={db} currentClub={currentClub} instructors={instructors} activities={activities} handleFileUpload={handleFileUpload} />}
            </>
            }
        </div>
    );
};

export default ClassesModule;
