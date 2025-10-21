import React, { useState } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from 'recharts';
import { Users, Euro, TrendingUp, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../../../utils/functions';


// KPI base con sicurezza per valori undefined
const kpis = useMemo(() => {
    if (filteredData.length === 0) return {};

    const safeParseFloat = (value) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    };

    const totalCorsi = filteredData.length;

    const totalMOL = keyColumns.molField ?
        filteredData.reduce((sum, row) => sum + safeParseFloat(row[keyColumns.molField]), 0) : 0;

    const totalFT = keyColumns.ftField ?
        filteredData.reduce((sum, row) => sum + safeParseFloat(row[keyColumns.ftField]), 0) : 0;

    const totalCosti = keyColumns.costiField ?
        filteredData.reduce((sum, row) => sum + safeParseFloat(row[keyColumns.costiField]), 0) : 0;

    const totalOre = keyColumns.oreField ?
        filteredData.reduce((sum, row) => sum + safeParseFloat(row[keyColumns.oreField]), 0) : 0;

    const marginalita = totalFT > 0 ? (totalMOL / totalFT * 100) : 0;
    const molMedio = totalCorsi > 0 ? totalMOL / totalCorsi : 0;
    const oreMedie = totalCorsi > 0 ? totalOre / totalCorsi : 0;

    return {
        totalCorsi,
        totalMOL,
        totalFT,
        totalCosti,
        totalOre,
        marginalita,
        molMedio,
        oreMedie
    };
}, [filteredData, keyColumns]);

function Overview() {
    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Corsi Totali</p>
                            <p className="text-3xl font-bold">{kpis.totalCorsi || 0}</p>
                        </div>
                        <Users className="w-12 h-12 text-blue-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">MOL Totale</p>
                            <p className="text-2xl font-bold">{formatCurrency(kpis.totalMOL)}</p>
                            <p className="text-green-200 text-xs mt-1">Marginalità: {(kpis.marginalita || 0).toFixed(1)}%</p>
                        </div>
                        <Euro className="w-12 h-12 text-green-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Ricavi Totali</p>
                            <p className="text-2xl font-bold">{formatCurrency(kpis.totalFT)}</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-purple-200" />
                    </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Ore Totali</p>
                            <p className="text-2xl font-bold">{(kpis.totalOre || 0).toFixed(0)}h</p>
                            <p className="text-orange-200 text-xs mt-1">Media: {(kpis.oreMedie || 0).toFixed(0)}h/corso</p>
                        </div>
                        <Clock className="w-12 h-12 text-orange-200" />
                    </div>
                </div>
            </div>

            {/* Grafici */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg border p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Distribuzione Stati Corso</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                            <Pie
                                data={chartData.statusDistribution}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="value"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            >
                                {chartData.statusDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-lg border p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-4">Performance per Regione</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.regioneAnalysis.slice(0, 8)}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                            <YAxis tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                            <Tooltip formatter={(value, name) => {
                                if (name === 'ricavi' || name === 'mol') return [formatCurrency(value), name.toUpperCase()];
                                return [value, name];
                            }} />
                            <Legend />
                            <Bar dataKey="ricavi" fill="#3B82F6" name="Ricavi" />
                            <Bar dataKey="mol" fill="#10B981" name="MOL" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tabella Sedi Espandibile */}
            {sediData.length > 0 && (
                <div className="bg-white rounded-lg border p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">📍 Performance per Sede</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setExpandedSedi({})}
                                className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                            >
                                Chiudi tutto
                            </button>
                            <button
                                onClick={() => {
                                    const allExpanded = {};
                                    sediData.forEach(item => { allExpanded[item.sede] = true; });
                                    setExpandedSedi(allExpanded);
                                }}
                                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                                Espandi tutto
                            </button>
                        </div>
                    </div>

                    <div className="overflow-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left p-3 font-medium border-b w-8"></th>
                                    <th className="text-left p-3 font-medium border-b">Sede / Stato</th>
                                    <th className="text-right p-3 font-medium border-b">N° Corsi</th>
                                    <th className="text-right p-3 font-medium border-b">Ricavi €</th>
                                    <th className="text-right p-3 font-medium border-b">Costi €</th>
                                    <th className="text-right p-3 font-medium border-b">MOL €</th>
                                    <th className="text-right p-3 font-medium border-b">Marginalità %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sediData.map((sedeData, index) => (
                                    <React.Fragment key={sedeData.sede}>
                                        {/* Riga Sede (Livello 1) */}
                                        <tr
                                            className="bg-blue-50 hover:bg-blue-100 cursor-pointer font-semibold border-b"
                                            onClick={() => toggleSedeExpansion(sedeData.sede)}
                                        >
                                            <td className="p-3">
                                                {expandedSedi[sedeData.sede] ? (
                                                    <ChevronDown className="w-4 h-4 text-blue-600" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-blue-600" />
                                                )}
                                            </td>
                                            <td className="p-3 text-blue-900">
                                                📍 {sedeData.sede}
                                            </td>
                                            <td className="p-3 text-right">{sedeData.totale.corsi}</td>
                                            <td className="p-3 text-right text-green-700 font-bold">
                                                {formatCurrency(sedeData.totale.ricavi)}
                                            </td>
                                            <td className="p-3 text-right text-red-700 font-bold">
                                                {formatCurrency(sedeData.totale.costi)}
                                            </td>
                                            <td className="p-3 text-right text-blue-700 font-bold">
                                                {formatCurrency(sedeData.totale.mol)}
                                            </td>
                                            <td className="p-3 text-right font-bold">
                                                {sedeData.totale.ricavi > 0
                                                    ? `${((sedeData.totale.mol / sedeData.totale.ricavi) * 100).toFixed(1)}%`
                                                    : '0%'
                                                }
                                            </td>
                                        </tr>

                                        {/* Stati per Sede (Livello 2) - Solo se espanso */}
                                        {expandedSedi[sedeData.sede] && Object.values(sedeData.statiAggregati).map((statoData, statoIndex) => (
                                            <React.Fragment key={`${sedeData.sede}_${statoData.stato}`}>
                                                <tr
                                                    className="bg-indigo-50 hover:bg-indigo-100 border-b cursor-pointer"
                                                    onClick={() => toggleStatoAggregatoExpansion(sedeData.sede, statoData.stato)}
                                                >
                                                    <td className="p-3 pl-8">
                                                        {Object.keys(statoData.sottostati).length > 0 ? (
                                                            expandedStatiAggregati[`${sedeData.sede}_${statoData.stato}`] ? (
                                                                <ChevronDown className="w-3 h-3 text-indigo-600" />
                                                            ) : (
                                                                <ChevronRight className="w-3 h-3 text-indigo-600" />
                                                            )
                                                        ) : (
                                                            <span
                                                                className="w-3 h-3 rounded-full inline-block cursor-pointer"
                                                                style={{ backgroundColor: STATUS_COLORS[statoData.stato] || '#6366F1' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleCorsiExpansion(sedeData.sede, statoData.stato);
                                                                }}
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-indigo-800">
                                                        <span className="flex items-center">
                                                            <span className="text-indigo-400 mr-2">└─</span>
                                                            <span className="font-medium">{statoData.stato}</span>
                                                            {Object.keys(statoData.sottostati).length > 0 && (
                                                                <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                                                    {Object.keys(statoData.sottostati).length}
                                                                </span>
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right text-indigo-700 font-medium">{statoData.corsi}</td>
                                                    <td className="p-3 text-right text-green-700 font-medium">
                                                        {formatCurrency(statoData.ricavi)}
                                                    </td>
                                                    <td className="p-3 text-right text-red-700 font-medium">
                                                        {formatCurrency(statoData.costi)}
                                                    </td>
                                                    <td className="p-3 text-right text-blue-700 font-medium">
                                                        {formatCurrency(statoData.mol)}
                                                    </td>
                                                    <td className="p-3 text-right text-indigo-700 font-medium">
                                                        {statoData.ricavi > 0
                                                            ? `${((statoData.mol / statoData.ricavi) * 100).toFixed(1)}%`
                                                            : '0%'
                                                        }
                                                    </td>
                                                </tr>

                                                {/* Elenco Corsi (Livello 2.5) - Se non ci sono sottostati */}
                                                {!Object.keys(statoData.sottostati).length && expandedCorsi[`${sedeData.sede}_${statoData.stato}`] &&
                                                    statoData.corsiDettaglio.map((corso, corsoIndex) => (
                                                        <tr
                                                            key={`${sedeData.sede}_${statoData.stato}_corso_${corsoIndex}`}
                                                            className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-b transition-all duration-200"
                                                        >
                                                            <td className="p-3 pl-12"></td>
                                                            <td className="p-3 text-slate-700">
                                                                <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-blue-400">
                                                                    <div className="flex items-start">
                                                                        <span className="text-blue-500 mr-3 mt-1">📚</span>
                                                                        <div className="flex-1">
                                                                            <div className="font-semibold text-slate-800 mb-2 leading-tight">
                                                                                {corso.nome}
                                                                            </div>
                                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                                                                {corso.dataInizio && (
                                                                                    <div className="flex items-center text-green-700 bg-green-50 px-2 py-1 rounded">
                                                                                        <span className="mr-1">🚀</span>
                                                                                        <span className="font-medium">Inizio: {corso.dataInizio}</span>
                                                                                    </div>
                                                                                )}
                                                                                {corso.dataFine && (
                                                                                    <div className="flex items-center text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                                                                        <span className="mr-1">🏁</span>
                                                                                        <span className="font-medium">Fine: {corso.dataFine}</span>
                                                                                    </div>
                                                                                )}
                                                                                {corso.dataEsame && (
                                                                                    <div className="flex items-center text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                                                                        <span className="mr-1">📋</span>
                                                                                        <span className="font-medium">Esame: {corso.dataEsame}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded-full text-sm font-medium">1</span>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <span className="text-green-700 font-bold">{formatCurrency(corso.ricavi)}</span>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <span className="text-red-700 font-bold">{formatCurrency(corso.costi)}</span>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <span className="text-blue-700 font-bold">{formatCurrency(corso.mol)}</span>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <span className="bg-slate-700 text-white px-2 py-1 rounded text-sm font-medium">
                                                                    {corso.ricavi > 0
                                                                        ? `${((corso.mol / corso.ricavi) * 100).toFixed(1)}%`
                                                                        : '0%'
                                                                    }
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}

                                                {/* Sottostati specifici (Livello 3) */}
                                                {expandedStatiAggregati[`${sedeData.sede}_${statoData.stato}`] &&
                                                    Object.values(statoData.sottostati).map((sottostato, sottIndex) => (
                                                        <React.Fragment key={`${sedeData.sede}_${statoData.stato}_${sottostato.stato}`}>
                                                            <tr
                                                                className="bg-emerald-50 hover:bg-emerald-100 border-b cursor-pointer"
                                                                onClick={() => toggleCorsiExpansion(sedeData.sede, sottostato.stato)}
                                                            >
                                                                <td className="p-2 pl-12">
                                                                    <span
                                                                        className="w-2 h-2 rounded-full inline-block"
                                                                        style={{ backgroundColor: STATUS_COLORS[sottostato.stato] || '#10B981' }}
                                                                    />
                                                                </td>
                                                                <td className="p-2 text-emerald-700 text-sm">
                                                                    <span className="flex items-center">
                                                                        <span className="text-emerald-400 mr-2">└──</span>
                                                                        <span className="font-medium">{sottostato.stato}</span>
                                                                    </span>
                                                                </td>
                                                                <td className="p-2 text-right text-emerald-600 text-sm font-medium">{sottostato.corsi}</td>
                                                                <td className="p-2 text-right text-green-600 text-sm font-medium">
                                                                    {formatCurrency(sottostato.ricavi)}
                                                                </td>
                                                                <td className="p-2 text-right text-red-600 text-sm font-medium">
                                                                    {formatCurrency(sottostato.costi)}
                                                                </td>
                                                                <td className="p-2 text-right text-blue-600 text-sm font-medium">
                                                                    {formatCurrency(sottostato.mol)}
                                                                </td>
                                                                <td className="p-2 text-right text-emerald-600 text-sm font-medium">
                                                                    {sottostato.ricavi > 0
                                                                        ? `${((sottostato.mol / sottostato.ricavi) * 100).toFixed(1)}%`
                                                                        : '0%'
                                                                    }
                                                                </td>
                                                            </tr>

                                                            {/* Elenco Corsi per Sottostato (Livello 4) */}
                                                            {expandedCorsi[`${sedeData.sede}_${sottostato.stato}`] &&
                                                                sottostato.corsiDettaglio?.map((corso, corsoIndex) => (
                                                                    <tr
                                                                        key={`${sedeData.sede}_${sottostato.stato}_corso_${corsoIndex}`}
                                                                        className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-b transition-all duration-200"
                                                                    >
                                                                        <td className="p-3 pl-16"></td>
                                                                        <td className="p-3 text-slate-700">
                                                                            <div className="bg-white rounded-lg p-2 shadow-sm border-l-4 border-emerald-400">
                                                                                <div className="flex items-start">
                                                                                    <span className="text-emerald-500 mr-2 mt-1 text-sm">📚</span>
                                                                                    <div className="flex-1">
                                                                                        <div className="font-semibold text-slate-800 mb-1 leading-tight text-sm">
                                                                                            {corso.nome}
                                                                                        </div>
                                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 text-xs">
                                                                                            {corso.dataInizio && (
                                                                                                <div className="flex items-center text-green-700 bg-green-50 px-1 py-0.5 rounded text-xs">
                                                                                                    <span className="mr-1">🚀</span>
                                                                                                    <span className="font-medium">{corso.dataInizio}</span>
                                                                                                </div>
                                                                                            )}
                                                                                            {corso.dataFine && (
                                                                                                <div className="flex items-center text-blue-700 bg-blue-50 px-1 py-0.5 rounded text-xs">
                                                                                                    <span className="mr-1">🏁</span>
                                                                                                    <span className="font-medium">{corso.dataFine}</span>
                                                                                                </div>
                                                                                            )}
                                                                                            {corso.dataEsame && (
                                                                                                <div className="flex items-center text-purple-700 bg-purple-50 px-1 py-0.5 rounded text-xs">
                                                                                                    <span className="mr-1">📋</span>
                                                                                                    <span className="font-medium">{corso.dataEsame}</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-3 text-right">
                                                                            <span className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded-full text-xs font-medium">1</span>
                                                                        </td>
                                                                        <td className="p-3 text-right">
                                                                            <span className="text-green-700 font-bold text-sm">{formatCurrency(corso.ricavi)}</span>
                                                                        </td>
                                                                        <td className="p-3 text-right">
                                                                            <span className="text-red-700 font-bold text-sm">{formatCurrency(corso.costi)}</span>
                                                                        </td>
                                                                        <td className="p-3 text-right">
                                                                            <span className="text-blue-700 font-bold text-sm">{formatCurrency(corso.mol)}</span>
                                                                        </td>
                                                                        <td className="p-3 text-right">
                                                                            <span className="bg-slate-700 text-white px-1 py-0.5 rounded text-xs font-medium">
                                                                                {corso.ricavi > 0
                                                                                    ? `${((corso.mol / corso.ricavi) * 100).toFixed(1)}%`
                                                                                    : '0%'
                                                                                }
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                        </React.Fragment>
                                                    ))}
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>

                            {/* Totale generale */}
                            <tfoot className="bg-gray-100 font-bold border-t-2">
                                <tr>
                                    <td className="p-3"></td>
                                    <td className="p-3">TOTALE GENERALE</td>
                                    <td className="p-3 text-right">
                                        {sediData.reduce((sum, sede) => sum + sede.totale.corsi, 0)}
                                    </td>
                                    <td className="p-3 text-right text-green-700">
                                        {formatCurrency(sediData.reduce((sum, sede) => sum + sede.totale.ricavi, 0))}
                                    </td>
                                    <td className="p-3 text-right text-red-700">
                                        {formatCurrency(sediData.reduce((sum, sede) => sum + sede.totale.costi, 0))}
                                    </td>
                                    <td className="p-3 text-right text-blue-700">
                                        {formatCurrency(sediData.reduce((sum, sede) => sum + sede.totale.mol, 0))}
                                    </td>
                                    <td className="p-3 text-right">
                                        {(() => {
                                            const totalRicavi = sediData.reduce((sum, sede) => sum + sede.totale.ricavi, 0);
                                            const totalMol = sediData.reduce((sum, sede) => sum + sede.totale.mol, 0);
                                            return totalRicavi > 0 ? `${((totalMol / totalRicavi) * 100).toFixed(1)}%` : '0%';
                                        })()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Tabella Stati Espandibile */}
            {statiData.length > 0 && (
                <div className="bg-white rounded-lg border p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">🎯 Performance per Stato Corso</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setExpandedStati({})}
                                className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                            >
                                Chiudi tutto
                            </button>
                            <button
                                onClick={() => {
                                    const allExpanded = {};
                                    statiData.forEach(item => { allExpanded[item.stato] = true; });
                                    setExpandedStati(allExpanded);
                                }}
                                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                            >
                                Espandi tutto
                            </button>
                        </div>
                    </div>

                    <div className="overflow-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left p-3 font-medium border-b w-8"></th>
                                    <th className="text-left p-3 font-medium border-b">Stato / Sede</th>
                                    <th className="text-right p-3 font-medium border-b">N° Corsi</th>
                                    <th className="text-right p-3 font-medium border-b">Ricavi €</th>
                                    <th className="text-right p-3 font-medium border-b">Costi €</th>
                                    <th className="text-right p-3 font-medium border-b">MOL €</th>
                                    <th className="text-right p-3 font-medium border-b">Marginalità %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {statiData.map((statoData, index) => (
                                    <React.Fragment key={statoData.stato}>
                                        {/* Riga Stato (Livello 1) */}
                                        <tr
                                            className="bg-green-50 hover:bg-green-100 cursor-pointer font-semibold border-b"
                                            onClick={() => toggleStatoExpansion(statoData.stato)}
                                        >
                                            <td className="p-3">
                                                {expandedStati[statoData.stato] ? (
                                                    <ChevronDown className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-green-600" />
                                                )}
                                            </td>
                                            <td className="p-3 text-green-900">
                                                <span className="flex items-center">
                                                    <span
                                                        className="inline-block w-3 h-3 rounded-full mr-2"
                                                        style={{ backgroundColor: STATUS_COLORS[statoData.stato] || '#10B981' }}
                                                    ></span>
                                                    {statoData.stato}
                                                </span>
                                            </td>
                                            <td className="p-3 text-right">{statoData.totale.corsi}</td>
                                            <td className="p-3 text-right text-green-700 font-bold">
                                                {formatCurrency(statoData.totale.ricavi)}
                                            </td>
                                            <td className="p-3 text-right text-red-700 font-bold">
                                                {formatCurrency(statoData.totale.costi)}
                                            </td>
                                            <td className="p-3 text-right text-blue-700 font-bold">
                                                {formatCurrency(statoData.totale.mol)}
                                            </td>
                                            <td className="p-3 text-right font-bold">
                                                {statoData.totale.ricavi > 0
                                                    ? `${((statoData.totale.mol / statoData.totale.ricavi) * 100).toFixed(1)}%`
                                                    : '0%'
                                                }
                                            </td>
                                        </tr>

                                        {/* Sedi per Stato (Livello 2) - Solo se espanso */}
                                        {expandedStati[statoData.stato] && Object.values(statoData.sedi).map((sedeData, sedeIndex) => (
                                            <React.Fragment key={`${statoData.stato}_${sedeData.sede}`}>
                                                <tr
                                                    className="bg-sky-50 hover:bg-sky-100 border-b cursor-pointer"
                                                    onClick={() => toggleCorsiExpansion(statoData.stato, sedeData.sede)}
                                                >
                                                    <td className="p-3 pl-8">
                                                        <span
                                                            className="w-3 h-3 rounded-full inline-block"
                                                            style={{ backgroundColor: '#0EA5E9' }}
                                                        />
                                                    </td>
                                                    <td className="p-3 text-sky-700">
                                                        <span className="flex items-center">
                                                            📍
                                                            <span className="ml-2 font-medium">└─ {sedeData.sede}</span>
                                                        </span>
                                                    </td>
                                                    <td className="p-3 text-right text-sky-600 font-medium">{sedeData.corsi}</td>
                                                    <td className="p-3 text-right text-green-700 font-medium">
                                                        {formatCurrency(sedeData.ricavi)}
                                                    </td>
                                                    <td className="p-3 text-right text-red-700 font-medium">
                                                        {formatCurrency(sedeData.costi)}
                                                    </td>
                                                    <td className="p-3 text-right text-blue-700 font-medium">
                                                        {formatCurrency(sedeData.mol)}
                                                    </td>
                                                    <td className="p-3 text-right text-sky-600 font-medium">
                                                        {sedeData.ricavi > 0
                                                            ? `${((sedeData.mol / sedeData.ricavi) * 100).toFixed(1)}%`
                                                            : '0%'
                                                        }
                                                    </td>
                                                </tr>

                                                {/* Elenco Corsi per Sede nello Stato (Livello 3) */}
                                                {expandedCorsi[`${statoData.stato}_${sedeData.sede}`] &&
                                                    sedeData.corsiDettaglio?.map((corso, corsoIndex) => (
                                                        <tr
                                                            key={`${statoData.stato}_${sedeData.sede}_corso_${corsoIndex}`}
                                                            className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-b transition-all duration-200"
                                                        >
                                                            <td className="p-3 pl-12"></td>
                                                            <td className="p-3 text-slate-700">
                                                                <div className="bg-white rounded-lg p-3 shadow-sm border-l-4 border-sky-400">
                                                                    <div className="flex items-start">
                                                                        <span className="text-sky-500 mr-3 mt-1">📚</span>
                                                                        <div className="flex-1">
                                                                            <div className="font-semibold text-slate-800 mb-2 leading-tight">
                                                                                {corso.nome}
                                                                            </div>
                                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                                                                                {corso.dataInizio && (
                                                                                    <div className="flex items-center text-green-700 bg-green-50 px-2 py-1 rounded">
                                                                                        <span className="mr-1">🚀</span>
                                                                                        <span className="font-medium">Inizio: {corso.dataInizio}</span>
                                                                                    </div>
                                                                                )}
                                                                                {corso.dataFine && (
                                                                                    <div className="flex items-center text-blue-700 bg-blue-50 px-2 py-1 rounded">
                                                                                        <span className="mr-1">🏁</span>
                                                                                        <span className="font-medium">Fine: {corso.dataFine}</span>
                                                                                    </div>
                                                                                )}
                                                                                {corso.dataEsame && (
                                                                                    <div className="flex items-center text-purple-700 bg-purple-50 px-2 py-1 rounded">
                                                                                        <span className="mr-1">📋</span>
                                                                                        <span className="font-medium">Esame: {corso.dataEsame}</span>
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <span className="bg-slate-200 text-slate-700 px-2 py-1 rounded-full text-sm font-medium">1</span>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <span className="text-green-700 font-bold">{formatCurrency(corso.ricavi)}</span>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <span className="text-red-700 font-bold">{formatCurrency(corso.costi)}</span>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <span className="text-blue-700 font-bold">{formatCurrency(corso.mol)}</span>
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <span className="bg-slate-700 text-white px-2 py-1 rounded text-sm font-medium">
                                                                    {corso.ricavi > 0
                                                                        ? `${((corso.mol / corso.ricavi) * 100).toFixed(1)}%`
                                                                        : '0%'
                                                                    }
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>

                            {/* Totale generale */}
                            <tfoot className="bg-gray-100 font-bold border-t-2">
                                <tr>
                                    <td className="p-3"></td>
                                    <td className="p-3">TOTALE GENERALE</td>
                                    <td className="p-3 text-right">
                                        {statiData.reduce((sum, stato) => sum + stato.totale.corsi, 0)}
                                    </td>
                                    <td className="p-3 text-right text-green-700">
                                        {formatCurrency(statiData.reduce((sum, stato) => sum + stato.totale.ricavi, 0))}
                                    </td>
                                    <td className="p-3 text-right text-red-700">
                                        {formatCurrency(statiData.reduce((sum, stato) => sum + stato.totale.costi, 0))}
                                    </td>
                                    <td className="p-3 text-right text-blue-700">
                                        {formatCurrency(statiData.reduce((sum, stato) => sum + stato.totale.mol, 0))}
                                    </td>
                                    <td className="p-3 text-right">
                                        {(() => {
                                            const totalRicavi = statiData.reduce((sum, stato) => sum + stato.totale.ricavi, 0);
                                            const totalMol = statiData.reduce((sum, stato) => sum + stato.totale.mol, 0);
                                            return totalRicavi > 0 ? `${((totalMol / totalRicavi) * 100).toFixed(1)}%` : '0%';
                                        })()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}

            {/* Tabella Società Espandibile */}
            {societaData.length > 0 && (
                <div className="bg-white rounded-lg border p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">🏢 Performance per Società</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setExpandedSocieta({});
                                    setExpandedSediInSocieta({});
                                }}
                                className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                            >
                                Chiudi tutto
                            </button>
                            <button
                                onClick={() => {
                                    const allSocieta = {};
                                    const allSedi = {};
                                    societaData.forEach(item => {
                                        allSocieta[item.societa] = true;
                                        Object.keys(item.sedi).forEach(sede => {
                                            allSedi[`${item.societa}_${sede}`] = true;
                                        });
                                    });
                                    setExpandedSocieta(allSocieta);
                                    setExpandedSediInSocieta(allSedi);
                                }}
                                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                            >
                                Espandi tutto
                            </button>
                        </div>
                    </div>

                    <div className="overflow-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="text-left p-3 font-medium border-b w-8"></th>
                                    <th className="text-left p-3 font-medium border-b">Società / Sede / Stato</th>
                                    <th className="text-right p-3 font-medium border-b">N° Corsi</th>
                                    <th className="text-right p-3 font-medium border-b">Ricavi €</th>
                                    <th className="text-right p-3 font-medium border-b">Costi €</th>
                                    <th className="text-right p-3 font-medium border-b">MOL €</th>
                                    <th className="text-right p-3 font-medium border-b">Marginalità %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {societaData.map((societaDataItem, index) => (
                                    <React.Fragment key={societaDataItem.societa}>
                                        {/* Riga Società (Livello 1) */}
                                        <tr
                                            className="bg-purple-50 hover:bg-purple-100 cursor-pointer font-semibold border-b"
                                            onClick={() => toggleSocietaExpansion(societaDataItem.societa)}
                                        >
                                            <td className="p-3">
                                                {expandedSocieta[societaDataItem.societa] ? (
                                                    <ChevronDown className="w-4 h-4 text-purple-600" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4 text-purple-600" />
                                                )}
                                            </td>
                                            <td className="p-3 text-purple-900">
                                                🏢 {societaDataItem.societa}
                                            </td>
                                            <td className="p-3 text-right">{societaDataItem.totale.corsi}</td>
                                            <td className="p-3 text-right text-green-700 font-bold">
                                                {formatCurrency(societaDataItem.totale.ricavi)}
                                            </td>
                                            <td className="p-3 text-right text-red-700 font-bold">
                                                {formatCurrency(societaDataItem.totale.costi)}
                                            </td>
                                            <td className="p-3 text-right text-blue-700 font-bold">
                                                {formatCurrency(societaDataItem.totale.mol)}
                                            </td>
                                            <td className="p-3 text-right font-bold">
                                                {societaDataItem.totale.ricavi > 0
                                                    ? `${((societaDataItem.totale.mol / societaDataItem.totale.ricavi) * 100).toFixed(1)}%`
                                                    : '0%'
                                                }
                                            </td>
                                        </tr>

                                        {/* Sedi per Società (Livello 2) - Solo se espanso */}
                                        {expandedSocieta[societaDataItem.societa] && Object.values(societaDataItem.sedi).map((sedeDataItem, sedeIndex) => (
                                            <React.Fragment key={`${societaDataItem.societa}_${sedeDataItem.sede}`}>
                                                <tr
                                                    className="bg-blue-50 hover:bg-blue-100 cursor-pointer border-b"
                                                    onClick={() => toggleSedeInSocietaExpansion(societaDataItem.societa, sedeDataItem.sede)}
                                                >
                                                    <td className="p-3 pl-8">
                                                        {expandedSediInSocieta[`${societaDataItem.societa}_${sedeDataItem.sede}`] ? (
                                                            <ChevronDown className="w-3 h-3 text-blue-600" />
                                                        ) : (
                                                            <ChevronRight className="w-3 h-3 text-blue-600" />
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-blue-700 font-medium">
                                                        📍 └─ {sedeDataItem.sede}
                                                    </td>
                                                    <td className="p-3 text-right text-blue-600">{sedeDataItem.corsi}</td>
                                                    <td className="p-3 text-right text-blue-600">
                                                        {formatCurrency(sedeDataItem.ricavi)}
                                                    </td>
                                                    <td className="p-3 text-right text-blue-600">
                                                        {formatCurrency(sedeDataItem.costi)}
                                                    </td>
                                                    <td className="p-3 text-right text-blue-600">
                                                        {formatCurrency(sedeDataItem.mol)}
                                                    </td>
                                                    <td className="p-3 text-right text-blue-600">
                                                        {sedeDataItem.ricavi > 0
                                                            ? `${((sedeDataItem.mol / sedeDataItem.ricavi) * 100).toFixed(1)}%`
                                                            : '0%'
                                                        }
                                                    </td>
                                                </tr>

                                                {/* Stati per Sede in Società (Livello 3) */}
                                                {expandedSediInSocieta[`${societaDataItem.societa}_${sedeDataItem.sede}`] &&
                                                    Object.values(sedeDataItem.statiAggregati).map((statoDataItem, statoIndex) => (
                                                        <React.Fragment key={`${societaDataItem.societa}_${sedeDataItem.sede}_${statoDataItem.stato}`}>
                                                            <tr
                                                                className="bg-indigo-50 hover:bg-indigo-100 border-b cursor-pointer"
                                                                onClick={() => toggleStatoAggregatoExpansion(`${societaDataItem.societa}_${sedeDataItem.sede}`, statoDataItem.stato)}
                                                            >
                                                                <td className="p-2 pl-12">
                                                                    {Object.keys(statoDataItem.sottostati).length > 0 ? (
                                                                        expandedStatiAggregati[`${societaDataItem.societa}_${sedeDataItem.sede}_${statoDataItem.stato}`] ? (
                                                                            <ChevronDown className="w-2 h-2 text-indigo-600" />
                                                                        ) : (
                                                                            <ChevronRight className="w-2 h-2 text-indigo-600" />
                                                                        )
                                                                    ) : (
                                                                        <span
                                                                            className="w-2 h-2 rounded-full inline-block cursor-pointer"
                                                                            style={{ backgroundColor: STATUS_COLORS[statoDataItem.stato] || '#6366F1' }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleCorsiExpansion(`${societaDataItem.societa}_${sedeDataItem.sede}`, statoDataItem.stato);
                                                                            }}
                                                                        />
                                                                    )}
                                                                </td>
                                                                <td className="p-2 text-indigo-700 text-sm">
                                                                    <span className="flex items-center">
                                                                        <span className="text-indigo-400 mr-2">└──</span>
                                                                        <span className="font-medium">{statoDataItem.stato}</span>
                                                                        {Object.keys(statoDataItem.sottostati).length > 0 && (
                                                                            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1 py-0.5 rounded-full">
                                                                                {Object.keys(statoDataItem.sottostati).length}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                </td>
                                                                <td className="p-2 text-right text-indigo-600 text-sm">{statoDataItem.corsi}</td>
                                                                <td className="p-2 text-right text-green-600 text-sm">
                                                                    {formatCurrency(statoDataItem.ricavi)}
                                                                </td>
                                                                <td className="p-2 text-right text-red-600 text-sm">
                                                                    {formatCurrency(statoDataItem.costi)}
                                                                </td>
                                                                <td className="p-2 text-right text-blue-600 text-sm">
                                                                    {formatCurrency(statoDataItem.mol)}
                                                                </td>
                                                                <td className="p-2 text-right text-indigo-600 text-sm">
                                                                    {statoDataItem.ricavi > 0
                                                                        ? `${((statoDataItem.mol / statoDataItem.ricavi) * 100).toFixed(1)}%`
                                                                        : '0%'
                                                                    }
                                                                </td>
                                                            </tr>

                                                            {/* Elenco Corsi per Stato Aggregato (Livello 3.5) */}
                                                            {!Object.keys(statoDataItem.sottostati).length && expandedCorsi[`${societaDataItem.societa}_${sedeDataItem.sede}_${statoDataItem.stato}`] &&
                                                                statoDataItem.corsiDettaglio?.map((corso, corsoIndex) => (
                                                                    <tr
                                                                        key={`${societaDataItem.societa}_${sedeDataItem.sede}_${statoDataItem.stato}_corso_${corsoIndex}`}
                                                                        className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-b transition-all duration-200"
                                                                    >
                                                                        <td className="p-3 pl-16"></td>
                                                                        <td className="p-3 text-slate-700">
                                                                            <div className="bg-white rounded-lg p-2 shadow-sm border-l-4 border-indigo-400">
                                                                                <div className="flex items-start">
                                                                                    <span className="text-indigo-500 mr-2 mt-1 text-sm">📚</span>
                                                                                    <div className="flex-1">
                                                                                        <div className="font-semibold text-slate-800 mb-1 leading-tight text-sm">
                                                                                            {corso.nome}
                                                                                        </div>
                                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-1 text-xs">
                                                                                            {corso.dataInizio && (
                                                                                                <div className="flex items-center text-green-700 bg-green-50 px-1 py-0.5 rounded text-xs">
                                                                                                    <span className="mr-1">🚀</span>
                                                                                                    <span className="font-medium">{corso.dataInizio}</span>
                                                                                                </div>
                                                                                            )}
                                                                                            {corso.dataFine && (
                                                                                                <div className="flex items-center text-blue-700 bg-blue-50 px-1 py-0.5 rounded text-xs">
                                                                                                    <span className="mr-1">🏁</span>
                                                                                                    <span className="font-medium">{corso.dataFine}</span>
                                                                                                </div>
                                                                                            )}
                                                                                            {corso.dataEsame && (
                                                                                                <div className="flex items-center text-purple-700 bg-purple-50 px-1 py-0.5 rounded text-xs">
                                                                                                    <span className="mr-1">📋</span>
                                                                                                    <span className="font-medium">{corso.dataEsame}</span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="p-3 text-right">
                                                                            <span className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded-full text-xs font-medium">1</span>
                                                                        </td>
                                                                        <td className="p-3 text-right">
                                                                            <span className="text-green-700 font-bold text-sm">{formatCurrency(corso.ricavi)}</span>
                                                                        </td>
                                                                        <td className="p-3 text-right">
                                                                            <span className="text-red-700 font-bold text-sm">{formatCurrency(corso.costi)}</span>
                                                                        </td>
                                                                        <td className="p-3 text-right">
                                                                            <span className="text-blue-700 font-bold text-sm">{formatCurrency(corso.mol)}</span>
                                                                        </td>
                                                                        <td className="p-3 text-right">
                                                                            <span className="bg-slate-700 text-white px-1 py-0.5 rounded text-xs font-medium">
                                                                                {corso.ricavi > 0
                                                                                    ? `${((corso.mol / corso.ricavi) * 100).toFixed(1)}%`
                                                                                    : '0%'
                                                                                }
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}

                                                            {/* Sottostati specifici (Livello 4) */}
                                                            {expandedStatiAggregati[`${societaDataItem.societa}_${sedeDataItem.sede}_${statoDataItem.stato}`] &&
                                                                Object.values(statoDataItem.sottostati).map((sottostato, sottIndex) => (
                                                                    <React.Fragment key={`${societaDataItem.societa}_${sedeDataItem.sede}_${statoDataItem.stato}_${sottostato.stato}`}>
                                                                        <tr
                                                                            className="bg-emerald-50 hover:bg-emerald-100 border-b cursor-pointer"
                                                                            onClick={() => toggleCorsiExpansion(`${societaDataItem.societa}_${sedeDataItem.sede}`, sottostato.stato)}
                                                                        >
                                                                            <td className="p-2 pl-16">
                                                                                <span
                                                                                    className="w-1 h-1 rounded-full inline-block"
                                                                                    style={{ backgroundColor: STATUS_COLORS[sottostato.stato] || '#10B981' }}
                                                                                />
                                                                            </td>
                                                                            <td className="p-2 text-emerald-700 text-xs">
                                                                                <span className="flex items-center">
                                                                                    <span className="text-emerald-400 mr-2">└───</span>
                                                                                    <span className="font-medium">{sottostato.stato}</span>
                                                                                </span>
                                                                            </td>
                                                                            <td className="p-2 text-right text-emerald-600 text-xs">{sottostato.corsi}</td>
                                                                            <td className="p-2 text-right text-green-600 text-xs">
                                                                                {formatCurrency(sottostato.ricavi)}
                                                                            </td>
                                                                            <td className="p-2 text-right text-red-600 text-xs">
                                                                                {formatCurrency(sottostato.costi)}
                                                                            </td>
                                                                            <td className="p-2 text-right text-blue-600 text-xs">
                                                                                {formatCurrency(sottostato.mol)}
                                                                            </td>
                                                                            <td className="p-2 text-right text-emerald-600 text-xs">
                                                                                {sottostato.ricavi > 0
                                                                                    ? `${((sottostato.mol / sottostato.ricavi) * 100).toFixed(1)}%`
                                                                                    : '0%'
                                                                                }
                                                                            </td>
                                                                        </tr>

                                                                        {/* Elenco Corsi per Sottostato (Livello 5) */}
                                                                        {expandedCorsi[`${societaDataItem.societa}_${sedeDataItem.sede}_${sottostato.stato}`] &&
                                                                            sottostato.corsiDettaglio?.map((corso, corsoIndex) => (
                                                                                <tr
                                                                                    key={`${societaDataItem.societa}_${sedeDataItem.sede}_${sottostato.stato}_corso_${corsoIndex}`}
                                                                                    className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 border-b transition-all duration-200"
                                                                                >
                                                                                    <td className="p-3 pl-20"></td>
                                                                                    <td className="p-3 text-slate-700">
                                                                                        <div className="bg-white rounded-lg p-2 shadow-sm border-l-4 border-emerald-400">
                                                                                            <div className="flex items-start">
                                                                                                <span className="text-emerald-500 mr-2 mt-1 text-sm">📚</span>
                                                                                                <div className="flex-1">
                                                                                                    <div className="font-semibold text-slate-800 mb-1 leading-tight text-sm">
                                                                                                        {corso.nome}
                                                                                                    </div>
                                                                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 text-xs">
                                                                                                        {corso.dataInizio && (
                                                                                                            <div className="flex items-center text-green-700 bg-green-50 px-1 py-0.5 rounded text-xs">
                                                                                                                <span className="mr-1">🚀</span>
                                                                                                                <span className="font-medium">{corso.dataInizio}</span>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {corso.dataFine && (
                                                                                                            <div className="flex items-center text-blue-700 bg-blue-50 px-1 py-0.5 rounded text-xs">
                                                                                                                <span className="mr-1">🏁</span>
                                                                                                                <span className="font-medium">{corso.dataFine}</span>
                                                                                                            </div>
                                                                                                        )}
                                                                                                        {corso.dataEsame && (
                                                                                                            <div className="flex items-center text-purple-700 bg-purple-50 px-1 py-0.5 rounded text-xs">
                                                                                                                <span className="mr-1">📋</span>
                                                                                                                <span className="font-medium">{corso.dataEsame}</span>
                                                                                                            </div>
                                                                                                        )}
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </td>
                                                                                    <td className="p-3 text-right">
                                                                                        <span className="bg-slate-200 text-slate-700 px-1 py-0.5 rounded-full text-xs font-medium">1</span>
                                                                                    </td>
                                                                                    <td className="p-3 text-right">
                                                                                        <span className="text-green-700 font-bold text-sm">{formatCurrency(corso.ricavi)}</span>
                                                                                    </td>
                                                                                    <td className="p-3 text-right">
                                                                                        <span className="text-red-700 font-bold text-sm">{formatCurrency(corso.costi)}</span>
                                                                                    </td>
                                                                                    <td className="p-3 text-right">
                                                                                        <span className="text-blue-700 font-bold text-sm">{formatCurrency(corso.mol)}</span>
                                                                                    </td>
                                                                                    <td className="p-3 text-right">
                                                                                        <span className="bg-slate-700 text-white px-1 py-0.5 rounded text-xs font-medium">
                                                                                            {corso.ricavi > 0
                                                                                                ? `${((corso.mol / corso.ricavi) * 100).toFixed(1)}%`
                                                                                                : '0%'
                                                                                            }
                                                                                        </span>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                    </React.Fragment>
                                                                ))}
                                                        </React.Fragment>
                                                    ))}
                                            </React.Fragment>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </tbody>

                            {/* Totale generale */}
                            <tfoot className="bg-gray-100 font-bold border-t-2">
                                <tr>
                                    <td className="p-3"></td>
                                    <td className="p-3">TOTALE GENERALE</td>
                                    <td className="p-3 text-right">
                                        {societaData.reduce((sum, societa) => sum + societa.totale.corsi, 0)}
                                    </td>
                                    <td className="p-3 text-right text-green-700">
                                        {formatCurrency(societaData.reduce((sum, societa) => sum + societa.totale.ricavi, 0))}
                                    </td>
                                    <td className="p-3 text-right text-red-700">
                                        {formatCurrency(societaData.reduce((sum, societa) => sum + societa.totale.costi, 0))}
                                    </td>
                                    <td className="p-3 text-right text-blue-700">
                                        {formatCurrency(societaData.reduce((sum, societa) => sum + societa.totale.mol, 0))}
                                    </td>
                                    <td className="p-3 text-right">
                                        {(() => {
                                            const totalRicavi = societaData.reduce((sum, societa) => sum + societa.totale.ricavi, 0);
                                            const totalMol = societaData.reduce((sum, societa) => sum + societa.totale.mol, 0);
                                            return totalRicavi > 0 ? `${((totalMol / totalRicavi) * 100).toFixed(1)}%` : '0%';
                                        })()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Overview;