import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import StatCard from '../components/StatCard';
import { Users, DollarSign, AlertCircle, UserCheck } from 'lucide-react';

/**
 * Módulo del Dashboard que muestra las estadísticas principales.
 * @param {Array} members - Lista de todos los socios.
 * @param {Array} payments - Lista de todos los pagos.
 * @param {Array} dues - Lista de todas las cuotas.
 * @param {Array} activities - Lista de todas las actividades.
 * @param {Object} config - Objeto de configuración del club.
 */
const DashboardModule = ({ members, payments, dues, activities, config }) => {
    const { showStatCards, showMonthlyIncome, showActivityPopularity } = config?.dashboardWidgets || {};

    const monthlyIncome = useMemo(() => {
        const data = {};
        const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        
        // Inicializar los últimos 6 meses
        for(let i = 5; i >= 0; i--) { 
            const d = new Date(); 
            d.setMonth(d.getMonth() - i); 
            const month = monthNames[d.getMonth()];
            data[month] = { Ingresos: 0 };
        }

        payments.forEach(p => { 
            const date = p.date?.toDate ? p.date.toDate() : new Date();
            const month = monthNames[date.getMonth()];
            if (data[month]) {
                data[month].Ingresos += p.amount;
            }
        });

        return Object.keys(data).map(month => ({ month, Ingresos: data[month].Ingresos }));
    }, [payments]);

    const totalDebt = useMemo(() => {
        return dues.filter(d => d.status === 'Pendiente').reduce((sum, d) => sum + d.amount, 0);
    }, [dues]);
    
    const currentMonthIncome = monthlyIncome.length > 0 ? monthlyIncome[monthlyIncome.length - 1].Ingresos : 0;
    
    const activityData = useMemo(() => {
        if (!members || !activities) return [];
        const counts = members.reduce((acc, member) => {
            if (member.activityId) {
                acc[member.activityId] = (acc[member.activityId] || 0) + 1;
            }
            return acc;
        }, {});
        
        const activityMap = new Map(activities.map(a => [a.id, a.name]));

        const data = Object.entries(counts).map(([activityId, count]) => ({
            name: activityMap.get(activityId) || 'Desconocida',
            value: count
        }));

        return data.filter(item => item.value > 0);

    }, [members, activities]);

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

    return (
        <div className="space-y-6">
            {showStatCards && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total de Socios" value={members.length} icon={Users} />
                    <StatCard title="Ingresos del Mes Actual" value={`$${currentMonthIncome.toFixed(2)}`} icon={DollarSign} />
                    <StatCard title="Deuda Total Pendiente" value={`$${totalDebt.toFixed(2)}`} icon={AlertCircle} />
                    <StatCard title="Socios Activos" value={members.filter(m => m.status === 'Activo').length} icon={UserCheck} />
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {showMonthlyIncome && (
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Ingresos de los últimos 6 meses</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={monthlyIncome}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                                <XAxis dataKey="month" stroke="#a0aec0" />
                                <YAxis stroke="#a0aec0" />
                                <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }} />
                                <Legend />
                                <Bar dataKey="Ingresos" fill="#4299e1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 )}
                 {showActivityPopularity && (
                    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
                        <h3 className="text-xl font-bold text-white mb-4">Inscripciones por Actividad</h3>
                        <ResponsiveContainer width="100%" height={300}>
                             <PieChart>
                                <Pie 
                                    data={activityData} 
                                    cx="50%" 
                                    cy="50%" 
                                    labelLine={false} 
                                    outerRadius={100} 
                                    fill="#8884d8" 
                                    dataKey="value" 
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {activityData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                                </Pie>
                                 <Tooltip contentStyle={{ backgroundColor: '#2d3748', border: 'none' }}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default DashboardModule;
