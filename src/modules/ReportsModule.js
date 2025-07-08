import React, { useState, useMemo } from 'react';
import InputField from '../components/InputField';
import SelectField from '../components/SelectField';
import SearchableSelect from '../components/SearchableSelect';

const ReportsModule = ({ members, payments, dues }) => {
    const [reportType, setReportType] = useState('ingresos');
    const [filters, setFilters] = useState({ startDate: '', endDate: '', memberId: '' });
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'asc' });

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleMemberSelect = (member) => {
        setFilters(prev => ({ ...prev, memberId: member ? member.id : '' }));
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        let data = [];
        if (reportType === 'ingresos') {
            data = payments.map(p => ({ ...p, date: p.date?.toDate(), memberName: members.find(m => m.id === p.memberId)?.name || 'N/A' }));
        } else if (reportType === 'socios') {
            data = [...members];
        } else if (reportType === 'cuentaCorriente' && filters.memberId) {
            const memberDues = dues.filter(d => d.memberId === filters.memberId).map(d => ({
                id: d.id,
                date: d.createdAt?.toDate(),
                concept: `Cuota ${d.period}`,
                debit: d.amount,
                credit: 0
            }));
            const memberPayments = payments.filter(p => p.memberId === filters.memberId).map(p => ({
                id: p.id,
                date: p.date?.toDate(),
                concept: `Pago ${p.period}`,
                debit: 0,
                credit: p.amount
            }));
            data = [...memberDues, ...memberPayments];
        }
        
        const sorted = [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });
        
        return sorted;

    }, [reportType, payments, members, dues, filters.memberId, sortConfig]);


    const filteredAndBalancedData = useMemo(() => {
        let data = sortedData;
        
        const startDate = filters.startDate ? new Date(filters.startDate).getTime() : 0;
        const endDate = filters.endDate ? new Date(filters.endDate).setHours(23, 59, 59, 999) : Infinity;

        data = data.filter(item => {
            const itemDate = item.date || (item.createdAt && item.createdAt.toDate());
            if(!itemDate) return true;
            return itemDate.getTime() >= startDate && itemDate.getTime() <= endDate;
        });
        
        if (reportType === 'cuentaCorriente') {
            let runningBalance = 0;
            return data.map(item => {
                runningBalance = runningBalance - (item.debit || 0) + (item.credit || 0);
                return { ...item, balance: runningBalance };
            });
        }

        return data;

    }, [sortedData, filters.startDate, filters.endDate, reportType]);


    const renderIncomeReport = () => (
        <table className="w-full text-left">
            <thead className="bg-gray-700">
                <tr>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('date')}>Fecha</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('memberName')}>Socio</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('period')}>Período</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('amount')}>Monto</th>
                </tr>
            </thead>
            <tbody>
                {filteredAndBalancedData.map(p => (
                    <tr key={p.id} className="border-b border-gray-700">
                        <td className="p-3">{p.date?.toLocaleDateString()}</td>
                        <td className="p-3">{p.memberName}</td>
                        <td className="p-3">{p.period}</td>
                        <td className="p-3">${p.amount}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderMembersReport = () => (
         <table className="w-full text-left">
            <thead className="bg-gray-700">
                <tr>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('name')}>Nombre</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('email')}>Email</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('memberType')}>Tipo</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('status')}>Estado</th>
                </tr>
            </thead>
            <tbody>
                {filteredAndBalancedData.map(m => (
                    <tr key={m.id} className="border-b border-gray-700">
                        <td className="p-3">{m.name}</td>
                        <td className="p-3">{m.email}</td>
                        <td className="p-3">{m.memberType}</td>
                        <td className="p-3">{m.status}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderAccountStatementReport = () => (
        <table className="w-full text-left">
            <thead className="bg-gray-700">
                <tr>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('date')}>Fecha</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('concept')}>Concepto</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('debit')}>Cargo (-)</th>
                    <th className="p-3 cursor-pointer" onClick={() => requestSort('credit')}>Abono (+)</th>
                    <th className="p-3">Saldo</th>
                </tr>
            </thead>
            <tbody>
                {filteredAndBalancedData.map(item => (
                    <tr key={item.id} className="border-b border-gray-700">
                        <td className="p-3">{item.date?.toLocaleDateString()}</td>
                        <td className="p-3">{item.concept}</td>
                        <td className="p-3 text-red-400">{item.debit > 0 ? `$${item.debit.toFixed(2)}` : '-'}</td>
                        <td className="p-3 text-green-400">{item.credit > 0 ? `$${item.credit.toFixed(2)}` : '-'}</td>
                        <td className={`p-3 font-bold ${item.balance < 0 ? 'text-red-400' : 'text-green-400'}`}>${item.balance.toFixed(2)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
             <h2 className="text-2xl font-bold text-white mb-6">Informes</h2>
             <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4 p-4 bg-gray-700/50 rounded-lg">
                <SelectField id="reportType" label="Tipo de Informe" value={reportType} onChange={e => setReportType(e.target.value)}>
                    <option value="ingresos">Ingresos</option>
                    <option value="socios">Socios</option>
                    <option value="cuentaCorriente">Cuenta Corriente de Socio</option>
                </SelectField>

                {reportType === 'cuentaCorriente' && (
                    <SearchableSelect
                        label="Seleccionar Socio"
                        options={members}
                        selectedOption={filters.memberId}
                        onSelect={handleMemberSelect}
                        placeholder="Buscar socio por nombre..."
                    />
                )}

                <div className="flex gap-2 items-end">
                    <InputField type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} label="Desde"/>
                    <InputField type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} label="Hasta"/>
                </div>
             </div>
             <div className="overflow-x-auto">
                {reportType === 'ingresos' && renderIncomeReport()}
                {reportType === 'socios' && renderMembersReport()}
                {reportType === 'cuentaCorriente' && filters.memberId && renderAccountStatementReport()}
             </div>
        </div>
    );
};

export default ReportsModule;
