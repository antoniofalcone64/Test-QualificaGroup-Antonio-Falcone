import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Upload, TrendingUp, Building2, Euro, Users, Clock, BarChart3, PieChart, AlertCircle, Search, ChevronRight, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, ComposedChart, Line } from 'recharts';
import { useJsonData } from './context/JsonDataContext';
import MultiSelect from './components/ui/MultiSelect';
import * as XLSX from 'xlsx';
import FullPageLoader from './components/ui/FullPageLoader';
import FullPageError from './components/ui/FullPageError';


interface MultiFilters {
    status: string[];
    regione: string[];
    societa: string[];
    sede: string[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C', '#8DD1E1', '#D084D0'];

const STATUS_COLORS = {
    'In partenza': '#10B981',
    'In partenza - pianificato': '#3B82F6',
    'In corso': '#F59E0B',
    'Concluso': '#6B7280'
};


export default function FormationDashboard() {
    const { jsonData, loading: jsonDataLoading, error: jsonDataError } = useJsonData();
    
    // Tutti gli useState devono essere chiamati prima di qualsiasi return condizionale
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});
    const [multiFilters, setMultiFilters] = useState<MultiFilters>({
        status: [],
        regione: [],
        societa: [],
        sede: []
    });
    const [selectedEntity, setSelectedEntity] = useState('');
    const [analysisLevel, setAnalysisLevel] = useState('sede');
    const [expandedSedi, setExpandedSedi] = useState({});
    const [expandedStati, setExpandedStati] = useState({});
    const [expandedSocieta, setExpandedSocieta] = useState({});
    const [expandedSediInSocieta, setExpandedSediInSocieta] = useState({});
    const [expandedStatiAggregati, setExpandedStatiAggregati] = useState({});
    const [expandedCorsi, setExpandedCorsi] = useState({});

    // Processo file CSV semplificato
    const processCSV = useCallback((text: string) => {
        const lines = text.split('\n').filter((line: string) => line.trim());
        if (lines.length === 0) throw new Error('File CSV vuoto');

        const headers = lines[0].split(',').map((h: string) => h.trim().replace(/"/g, ''));
        const rows = lines.slice(1).map((line: string) => {
            const values = line.split(',').map((v: string) => v.trim().replace(/"/g, ''));
            const obj: Record<string, string> = {};
            headers.forEach((header: string, index: number) => {
                obj[header] = values[index] || '';
            });
            return obj;
        }).filter((row: Record<string, string>) => Object.values(row).some(val => val && val !== ''));

        return rows;
    }, []);

    // Processo file Excel
    const processExcel = useCallback((arrayBuffer: ArrayBuffer) => {
        const workbook = XLSX.read(arrayBuffer);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length === 0) throw new Error('File Excel vuoto');

        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);


        const result = rows.map((row: unknown[]) => {
            const obj: Record<string, unknown> = {};
            headers.forEach((header: string, index: number) => {
                obj[header] = row[index];
            });
            return obj;
        }).filter((row: Record<string, unknown>) => Object.values(row).some(val => val != null && val !== ''));

        console.log("Processed Excel data:", result);

        return result;
    }, []);

   useEffect(() => {
        if (jsonData) {
            setData(jsonData);
            const cols = Object.keys(jsonData[0]);
            setColumns(cols);
            setActiveTab('overview');
        } else {
            console.error("No JSON data available");
        }
   }, [jsonData]);

   useEffect(() => {
        console.log("Detected columns:", columns);
   }, [columns]);


        
    // Trova le colonne chiave con fallback sicuri
    const keyColumns = useMemo(() => {
        const statusField = columns.find(col =>
            col.toLowerCase().includes('stato') ||
            col.toLowerCase().includes('status')
        ) || columns[0];

        const molField = columns.find(col =>
            col.includes('MOL') ||
            col.includes('€. MOL')
        ) || columns.find(col => col.toLowerCase().includes('margine'));

        const ftField = columns.find(col =>
            col.includes('da FT') ||
            col.includes('€. da FT') ||
            col.toLowerCase().includes('ricav')
        ) || columns.find(col => col.includes('€'));

        const costiField = columns.find(col =>
            col.includes('Costi') ||
            col.includes('€. Costi') ||
            col.toLowerCase().includes('cost')
        );

        const regioneField = columns.find(col =>
            col.toLowerCase().includes('regione')
        );

        const societaField = columns.find(col =>
            col.toLowerCase().includes('societ')
        );

        const sedeField = columns.find(col =>
            col.toLowerCase().includes('sede')
        );

        const oreField = columns.find(col =>
            col.toLowerCase().includes('ore') || col.includes('N° Ore')
        );

        // Trova le colonne per il nome corso composto
        const edizioneField = columns.find(col =>
            col.includes('Ed.') || col.toLowerCase().includes('edizione')
        );

        const corsoNumeroField = columns.find(col =>
            col === 'CORSO' || col.toUpperCase() === 'CORSO'
        );

        // Campo corso legacy (fallback)
        const corsoField = columns.find(col =>
            col.toUpperCase().includes('CORSO') && !col.toLowerCase().includes('stato')
        ) || columns.find(col =>
            col.toLowerCase().includes('denominazione')
        ) || columns.find(col =>
            col.toLowerCase().includes('titolo')
        ) || columns.find(col =>
            col.toLowerCase().includes('nome') && col.toLowerCase().includes('corso')
        ) || columns.find(col =>
            col.toLowerCase().includes('descrizione')
        ) || columns.find(col =>
            col.toLowerCase().includes('formazione')
        ) || columns[1];

        const dataInizioField = columns.find(col =>
            col.toLowerCase().includes('inizio') ||
            col.toLowerCase().includes('data inizio') ||
            col.toLowerCase().includes('start')
        );

        const dataFineField = columns.find(col =>
            col.toLowerCase().includes('fine') ||
            col.toLowerCase().includes('data fine') ||
            col.toLowerCase().includes('end')
        );

        const dataEsameField = columns.find(col =>
            col.toLowerCase().includes('esame') ||
            col.toLowerCase().includes('data esame') ||
            col.toLowerCase().includes('exam')
        );

        return {
            statusField,
            molField,
            ftField,
            costiField,
            regioneField,
            societaField,
            sedeField,
            oreField,
            corsoField,
            edizioneField,
            corsoNumeroField,
            dataInizioField,
            dataFineField,
            dataEsameField
        };
    }, [columns]);

    // Dati filtrati
    const filteredData = useMemo(() => {
        let filtered = [...data];

        // Filtri per colonna
        Object.entries(filters).forEach(([column, value]) => {
            if (value) {
                filtered = filtered.filter(row =>
                    String(row[column] || '').toLowerCase().includes(String(value).toLowerCase())
                );
            }
        });

        // Filtri multipli
        if (multiFilters.status.length > 0 && keyColumns.statusField) {
            filtered = filtered.filter(row =>
                multiFilters.status.some(status =>
                    String(row[keyColumns.statusField] || '').toLowerCase().includes(status.toLowerCase())
                )
            );
        }

        if (multiFilters.regione.length > 0 && keyColumns.regioneField) {
            filtered = filtered.filter(row =>
                multiFilters.regione.includes(row[keyColumns.regioneField])
            );
        }

        if (multiFilters.societa.length > 0 && keyColumns.societaField) {
            filtered = filtered.filter(row =>
                multiFilters.societa.includes(row[keyColumns.societaField])
            );
        }

        if (multiFilters.sede.length > 0 && keyColumns.sedeField) {
            filtered = filtered.filter(row =>
                multiFilters.sede.includes(row[keyColumns.sedeField])
            );
        }

        // Ricerca globale
        if (searchTerm) {
            filtered = filtered.filter(row =>
                Object.values(row).some(value =>
                    String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }

        return filtered;
    }, [data, filters, searchTerm, multiFilters, keyColumns]);

    // Opzioni per entità
    const entityOptions = useMemo(() => {
        const field = analysisLevel === 'sede' ? keyColumns.sedeField :
            analysisLevel === 'societa' ? keyColumns.societaField :
                keyColumns.regioneField;

        if (!field) return [];
        return [...new Set(data.map(row => row[field]).filter(Boolean))].sort();
    }, [analysisLevel, data, keyColumns]);

    // Debug info per filtri E colonne rilevate
    const debugInfo = useMemo(() => {
        if (data.length === 0) return {};

        const uniqueStatuses = keyColumns.statusField ?
            [...new Set(data.map(row => row[keyColumns.statusField]).filter(Boolean))] : [];
        const uniqueRegioni = keyColumns.regioneField ?
            [...new Set(data.map(row => row[keyColumns.regioneField]).filter(Boolean))] : [];
        const uniqueSocieta = keyColumns.societaField ?
            [...new Set(data.map(row => row[keyColumns.societaField]).filter(Boolean))] : [];
        const uniqueSedi = keyColumns.sedeField ?
            [...new Set(data.map(row => row[keyColumns.sedeField]).filter(Boolean))] : [];

        return {
            uniqueStatuses,
            uniqueRegioni,
            uniqueSocieta,
            uniqueSedi,
            // Debug colonne rilevate
            colonneRilevate: {
                edizione: keyColumns.edizioneField,
                corsoNumero: keyColumns.corsoNumeroField,
                corso: keyColumns.corsoField,
                status: keyColumns.statusField,
                mol: keyColumns.molField,
                ricavi: keyColumns.ftField,
                costi: keyColumns.costiField,
                sede: keyColumns.sedeField,
                societa: keyColumns.societaField,
                regione: keyColumns.regioneField,
                dataInizio: keyColumns.dataInizioField,
                dataFine: keyColumns.dataFineField,
                dataEsame: keyColumns.dataEsameField
            }
        };
    }, [data, keyColumns]);

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

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('it-IT', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value || 0);
    };

    // Funzione per generare il nome corso combinato: "CORSO" + " " + "Ed."
    const getNomeCorsoCompleto = useCallback((row) => {
        const { edizioneField, corsoNumeroField, corsoField } = keyColumns;

        // Se abbiamo entrambi i campi CORSO ed Ed., combinali (CORSO + Ed.)
        if (edizioneField && corsoNumeroField && row[corsoNumeroField] && row[edizioneField]) {
            return `${row[corsoNumeroField]} ${row[edizioneField]}`;
        }

        // Fallback ai campi singoli
        if (corsoNumeroField && row[corsoNumeroField]) {
            return row[corsoNumeroField];
        }

        if (edizioneField && row[edizioneField]) {
            return row[edizioneField];
        }

        // Ultimo fallback al campo corso tradizionale
        if (corsoField && row[corsoField]) {
            return row[corsoField];
        }

        return 'Corso non specificato';
    }, [keyColumns]);

    // Funzione per convertire date Excel in formato leggibile
    const formatExcelDate = useCallback((value: string | number | Date | null | undefined): string => {
        if (!value) return '';

        // Se è già una stringa che sembra una data, ritornala
        if (typeof value === 'string' && (value.includes('/') || value.includes('-'))) {
            return value;
        }

        // Se è un numero (formato Excel)
        if (typeof value === 'number' && value > 25000 && value < 100000) {
            // Excel serial date (dal 1 gennaio 1900)
            const excelEpoch = new Date(1899, 11, 30); // 30 dicembre 1899 (Excel inizia da 1 gennaio 1900)
            const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);

            if (!isNaN(date.getTime())) {
                return date.toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        }

        // Fallback: prova a convertire come data normale
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('it-IT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        return String(value);
    }, []);

    // Toggle espansione sede
    const toggleSedeExpansion = (sede) => {
        setExpandedSedi(prev => ({
            ...prev,
            [sede]: !prev[sede]
        }));
    };

    // Toggle espansione stato
    const toggleStatoExpansion = (stato) => {
        setExpandedStati(prev => ({
            ...prev,
            [stato]: !prev[stato]
        }));
    };

    // Toggle espansione società
    const toggleSocietaExpansion = (societa) => {
        setExpandedSocieta(prev => ({
            ...prev,
            [societa]: !prev[societa]
        }));
    };

    // Toggle espansione sede in società
    const toggleSedeInSocietaExpansion = (societa, sede) => {
        const key = `${societa}_${sede}`;
        setExpandedSediInSocieta(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Toggle espansione stato aggregato
    const toggleStatoAggregatoExpansion = (sede, statoBase) => {
        const key = `${sede}_${statoBase}`;
        setExpandedStatiAggregati(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Toggle espansione corsi (gestisce tutti i contesti)
    const toggleCorsiExpansion = (context1, context2, context3 = null) => {
        let key;
        if (context3) {
            // Contesto società: societa_sede_stato
            key = `${context1}_${context2}_${context3}`;
        } else {
            // Contesto normale: sede_stato o stato_sede
            key = `${context1}_${context2}`;
        }
        setExpandedCorsi(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Helper per aggregare stati con "_"
    const aggregateStati = (stati) => {
        const aggregated = {};

        Object.entries(stati).forEach(([statoCompleto, data]) => {
            // Se contiene "_", prendi solo la parte prima dell'underscore
            const statoBase = statoCompleto.includes('_') ? statoCompleto.split('_')[0] : statoCompleto;

            if (!aggregated[statoBase]) {
                aggregated[statoBase] = {
                    stato: statoBase,
                    ricavi: 0,
                    costi: 0,
                    mol: 0,
                    corsi: 0,
                    sottostati: {},
                    corsiDettaglio: []
                };
            }

            // Aggrega i totali
            aggregated[statoBase].ricavi += data.ricavi;
            aggregated[statoBase].costi += data.costi;
            aggregated[statoBase].mol += data.mol;
            aggregated[statoBase].corsi += data.corsi;

            // Aggiungi i corsi al dettaglio
            if (data.corsiDettaglio) {
                aggregated[statoBase].corsiDettaglio.push(...data.corsiDettaglio);
            }

            // Se è un sottostato, salvalo
            if (statoCompleto.includes('_')) {
                aggregated[statoBase].sottostati[statoCompleto] = data;
            }
        });

        return aggregated;
    };

    // Dati aggregati per sedi con breakdown per stato AGGREGATO
    const sediData = useMemo(() => {
        if (filteredData.length === 0 || !keyColumns.sedeField) return [];

        const safeParseFloat = (value) => {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
        };

        // Raggruppa per sede
        const sedeGroups = {};

        filteredData.forEach(row => {
            const sede = row[keyColumns.sedeField] || 'Sede non specificata';
            const stato = row[keyColumns.statusField] || 'Stato non specificato';
            const ricavi = safeParseFloat(row[keyColumns.ftField]);
            const costi = safeParseFloat(row[keyColumns.costiField]);
            const mol = safeParseFloat(row[keyColumns.molField]);

            if (!sedeGroups[sede]) {
                sedeGroups[sede] = {
                    sede,
                    totale: { ricavi: 0, costi: 0, mol: 0, corsi: 0 },
                    stati: {}
                };
            }

            // Totali sede
            sedeGroups[sede].totale.ricavi += ricavi;
            sedeGroups[sede].totale.costi += costi;
            sedeGroups[sede].totale.mol += mol;
            sedeGroups[sede].totale.corsi += 1;

            // Per stato
            if (!sedeGroups[sede].stati[stato]) {
                sedeGroups[sede].stati[stato] = {
                    stato,
                    ricavi: 0,
                    costi: 0,
                    mol: 0,
                    corsi: 0,
                    corsiDettaglio: []
                };
            }

            sedeGroups[sede].stati[stato].ricavi += ricavi;
            sedeGroups[sede].stati[stato].costi += costi;
            sedeGroups[sede].stati[stato].mol += mol;
            sedeGroups[sede].stati[stato].corsi += 1;

            // Aggiungi dettaglio corso
            sedeGroups[sede].stati[stato].corsiDettaglio.push({
                nome: getNomeCorsoCompleto(row),
                ricavi,
                costi,
                mol,
                ore: safeParseFloat(row[keyColumns.oreField]),
                societa: row[keyColumns.societaField] || '',
                regione: row[keyColumns.regioneField] || '',
                dataInizio: formatExcelDate(row[keyColumns.dataInizioField]),
                dataFine: formatExcelDate(row[keyColumns.dataFineField]),
                dataEsame: formatExcelDate(row[keyColumns.dataEsameField])
            });
        });

        // Aggrega gli stati per ogni sede
        Object.values(sedeGroups).forEach(sedeGroup => {
            sedeGroup.statiAggregati = aggregateStati(sedeGroup.stati);
        });

        // Converti in array e ordina per ricavi
        return Object.values(sedeGroups).sort((a, b) => b.totale.ricavi - a.totale.ricavi);
    }, [filteredData, keyColumns, getNomeCorsoCompleto, formatExcelDate]);

    // Dati aggregati per società con breakdown per sede e stato
    const societaData = useMemo(() => {
        if (filteredData.length === 0 || !keyColumns.societaField) return [];

        const safeParseFloat = (value) => {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
        };

        // Raggruppa per società
        const societaGroups = {};

        filteredData.forEach(row => {
            const societa = row[keyColumns.societaField] || 'Società non specificata';
            const sede = row[keyColumns.sedeField] || 'Sede non specificata';
            const stato = row[keyColumns.statusField] || 'Stato non specificato';
            const ricavi = safeParseFloat(row[keyColumns.ftField]);
            const costi = safeParseFloat(row[keyColumns.costiField]);
            const mol = safeParseFloat(row[keyColumns.molField]);

            if (!societaGroups[societa]) {
                societaGroups[societa] = {
                    societa,
                    totale: { ricavi: 0, costi: 0, mol: 0, corsi: 0 },
                    sedi: {}
                };
            }

            // Totali società
            societaGroups[societa].totale.ricavi += ricavi;
            societaGroups[societa].totale.costi += costi;
            societaGroups[societa].totale.mol += mol;
            societaGroups[societa].totale.corsi += 1;

            // Per sede
            if (!societaGroups[societa].sedi[sede]) {
                societaGroups[societa].sedi[sede] = {
                    sede,
                    ricavi: 0,
                    costi: 0,
                    mol: 0,
                    corsi: 0,
                    stati: {}
                };
            }

            societaGroups[societa].sedi[sede].ricavi += ricavi;
            societaGroups[societa].sedi[sede].costi += costi;
            societaGroups[societa].sedi[sede].mol += mol;
            societaGroups[societa].sedi[sede].corsi += 1;

            // Per stato nella sede
            if (!societaGroups[societa].sedi[sede].stati[stato]) {
                societaGroups[societa].sedi[sede].stati[stato] = {
                    stato,
                    ricavi: 0,
                    costi: 0,
                    mol: 0,
                    corsi: 0,
                    corsiDettaglio: []
                };
            }

            societaGroups[societa].sedi[sede].stati[stato].ricavi += ricavi;
            societaGroups[societa].sedi[sede].stati[stato].costi += costi;
            societaGroups[societa].sedi[sede].stati[stato].mol += mol;
            societaGroups[societa].sedi[sede].stati[stato].corsi += 1;

            // Aggiungi dettaglio corso
            societaGroups[societa].sedi[sede].stati[stato].corsiDettaglio.push({
                nome: getNomeCorsoCompleto(row),
                ricavi,
                costi,
                mol,
                ore: safeParseFloat(row[keyColumns.oreField]),
                societa: row[keyColumns.societaField] || '',
                regione: row[keyColumns.regioneField] || '',
                dataInizio: formatExcelDate(row[keyColumns.dataInizioField]),
                dataFine: formatExcelDate(row[keyColumns.dataFineField]),
                dataEsame: formatExcelDate(row[keyColumns.dataEsameField])
            });
        });

        // Aggrega gli stati per ogni sede nelle società
        Object.values(societaGroups).forEach(societaGroup => {
            Object.values(societaGroup.sedi).forEach(sedeGroup => {
                sedeGroup.statiAggregati = aggregateStati(sedeGroup.stati);
            });
        });

        // Converti in array e ordina per ricavi
        return Object.values(societaGroups).sort((a, b) => b.totale.ricavi - a.totale.ricavi);
    }, [filteredData, keyColumns, getNomeCorsoCompleto, formatExcelDate]);

    // Dati aggregati per stati con breakdown per sede
    const statiData = useMemo(() => {
        if (filteredData.length === 0 || !keyColumns.statusField) return [];

        const safeParseFloat = (value) => {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
        };

        // Raggruppa per stato
        const statoGroups = {};

        filteredData.forEach(row => {
            const stato = row[keyColumns.statusField] || 'Stato non specificato';
            const sede = row[keyColumns.sedeField] || 'Sede non specificata';
            const ricavi = safeParseFloat(row[keyColumns.ftField]);
            const costi = safeParseFloat(row[keyColumns.costiField]);
            const mol = safeParseFloat(row[keyColumns.molField]);

            if (!statoGroups[stato]) {
                statoGroups[stato] = {
                    stato,
                    totale: { ricavi: 0, costi: 0, mol: 0, corsi: 0 },
                    sedi: {}
                };
            }

            // Totali stato
            statoGroups[stato].totale.ricavi += ricavi;
            statoGroups[stato].totale.costi += costi;
            statoGroups[stato].totale.mol += mol;
            statoGroups[stato].totale.corsi += 1;

            // Per sede
            if (!statoGroups[stato].sedi[sede]) {
                statoGroups[stato].sedi[sede] = {
                    sede,
                    ricavi: 0,
                    costi: 0,
                    mol: 0,
                    corsi: 0,
                    corsiDettaglio: []
                };
            }

            statoGroups[stato].sedi[sede].ricavi += ricavi;
            statoGroups[stato].sedi[sede].costi += costi;
            statoGroups[stato].sedi[sede].mol += mol;
            statoGroups[stato].sedi[sede].corsi += 1;

            // Aggiungi dettaglio corso per sede
            statoGroups[stato].sedi[sede].corsiDettaglio.push({
                nome: getNomeCorsoCompleto(row),
                ricavi,
                costi,
                mol,
                ore: safeParseFloat(row[keyColumns.oreField]),
                societa: row[keyColumns.societaField] || '',
                regione: row[keyColumns.regioneField] || '',
                dataInizio: formatExcelDate(row[keyColumns.dataInizioField]),
                dataFine: formatExcelDate(row[keyColumns.dataFineField]),
                dataEsame: formatExcelDate(row[keyColumns.dataEsameField])
            });
        });

        // Converti in array e ordina per ricavi
        return Object.values(statoGroups).sort((a, b) => b.totale.ricavi - a.totale.ricavi);
    }, [filteredData, keyColumns, getNomeCorsoCompleto, formatExcelDate]);

    // Dati per grafici
    const chartData = useMemo(() => {
        if (!keyColumns.statusField) return { statusDistribution: [], regioneAnalysis: [] };

        const statusDistribution = debugInfo.uniqueStatuses?.map(status => {
            const courses = filteredData.filter(row => row[keyColumns.statusField] === status);
            return {
                name: status,
                value: courses.length,
                mol: keyColumns.molField ? courses.reduce((sum, course) => sum + (parseFloat(course[keyColumns.molField]) || 0), 0) : 0,
                ricavi: keyColumns.ftField ? courses.reduce((sum, course) => sum + (parseFloat(course[keyColumns.ftField]) || 0), 0) : 0
            };
        }) || [];

        const regioneAnalysis = debugInfo.uniqueRegioni?.map(regione => {
            const courses = filteredData.filter(row => row[keyColumns.regioneField] === regione);
            const totalMol = keyColumns.molField ? courses.reduce((sum, course) => sum + (parseFloat(course[keyColumns.molField]) || 0), 0) : 0;
            const totalRicavi = keyColumns.ftField ? courses.reduce((sum, course) => sum + (parseFloat(course[keyColumns.ftField]) || 0), 0) : 0;

            return {
                name: regione,
                corsi: courses.length,
                mol: totalMol,
                ricavi: totalRicavi,
                marginalita: totalRicavi > 0 ? (totalMol / totalRicavi * 100) : 0
            };
        }).sort((a, b) => b.ricavi - a.ricavi) || [];

        return { statusDistribution, regioneAnalysis };
    }, [filteredData, keyColumns, debugInfo]);

    const renderOverview = () => (
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

    const renderFilters = () => (
        <div className="bg-white rounded-lg border p-6 shadow-sm mb-6">
            <h3 className="text-lg font-semibold mb-4">🔍 Filtri</h3>

            {/* Debug Colonne Rilevate */}
            {debugInfo.colonneRilevate && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-900 mb-3">🔧 Debug: Colonne Rilevate Automaticamente</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
                        <div>
                            <span className="font-medium text-blue-700">📚 Ed.:</span>
                            <span className="ml-1 bg-white px-2 py-1 rounded text-blue-800">
                                {debugInfo.colonneRilevate.edizione || 'Non trovato'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-blue-700">🔢 CORSO:</span>
                            <span className="ml-1 bg-white px-2 py-1 rounded text-blue-800">
                                {debugInfo.colonneRilevate.corsoNumero || 'Non trovato'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-blue-700">💡 Nome Composto:</span>
                            <span className="ml-1 bg-green-100 px-2 py-1 rounded text-green-800 font-bold">
                                {debugInfo.colonneRilevate.corsoNumero && debugInfo.colonneRilevate.edizione
                                    ? `${debugInfo.colonneRilevate.corsoNumero} + ${debugInfo.colonneRilevate.edizione}`
                                    : 'Incompleto'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-blue-700">📊 Ricavi:</span>
                            <span className="ml-1 bg-white px-2 py-1 rounded text-blue-800">
                                {debugInfo.colonneRilevate.ricavi || 'Non trovato'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-blue-700">💰 MOL:</span>
                            <span className="ml-1 bg-white px-2 py-1 rounded text-blue-800">
                                {debugInfo.colonneRilevate.mol || 'Non trovato'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-blue-700">🏢 Sede:</span>
                            <span className="ml-1 bg-white px-2 py-1 rounded text-blue-800">
                                {debugInfo.colonneRilevate.sede || 'Non trovato'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-blue-700">📅 Data Inizio:</span>
                            <span className="ml-1 bg-white px-2 py-1 rounded text-blue-800">
                                {debugInfo.colonneRilevate.dataInizio || 'Non trovato'}
                            </span>
                        </div>
                        <div>
                            <span className="font-medium text-blue-700">🏁 Data Fine:</span>
                            <span className="ml-1 bg-white px-2 py-1 rounded text-blue-800">
                                {debugInfo.colonneRilevate.dataFine || 'Non trovato'}
                            </span>
                        </div>
                    </div>
                    <p className="text-blue-700 text-xs mt-2">
                        💡 <strong>Nome corso = "CORSO" + " " + "Ed."</strong> → esempio: "1 OPI"
                    </p>
                </div>
            )}

            {/* Lista tutte le colonne disponibili */}
            {columns.length > 0 && (
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">📋 Tutte le colonne nel file:</p>
                    <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                        {columns.map((col, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-blue-100 cursor-pointer"
                                title={`Clicca per vedere un valore di esempio: ${data[0]?.[col]}`}>
                                {col}
                            </span>
                        ))}
                    </div>
                    <p className="text-gray-600 text-xs mt-2">
                        💡 Passa il mouse sulle colonne per vedere un valore di esempio
                    </p>
                </div>
            )}

            {debugInfo.uniqueStatuses?.length > 0 && (
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Stati rilevati:</p>
                    <div className="flex flex-wrap gap-1">
                        {debugInfo.uniqueStatuses.map(status => (
                            <span key={status} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {status}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {debugInfo.uniqueStatuses?.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Stati Corso</label>
                        <MultiSelect
                            options={debugInfo.uniqueStatuses}
                            value={multiFilters.status}
                            onChange={(value) => setMultiFilters({ ...multiFilters, status: value })}
                            placeholder="Seleziona stati..."
                        />
                    </div>
                )}

                {debugInfo.uniqueRegioni?.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Regioni</label>
                        <MultiSelect
                            options={debugInfo.uniqueRegioni}
                            value={multiFilters.regione}
                            onChange={(value) => setMultiFilters({ ...multiFilters, regione: value })}
                            placeholder="Seleziona regioni..."
                        />
                    </div>
                )}

                {debugInfo.uniqueSocieta?.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Società</label>
                        <MultiSelect
                            options={debugInfo.uniqueSocieta}
                            value={multiFilters.societa}
                            onChange={(value) => setMultiFilters({ ...multiFilters, societa: value })}
                            placeholder="Seleziona società..."
                        />
                    </div>
                )}

                {debugInfo.uniqueSedi?.length > 0 && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sedi</label>
                        <MultiSelect
                            options={debugInfo.uniqueSedi}
                            value={multiFilters.sede}
                            onChange={(value) => setMultiFilters({ ...multiFilters, sede: value })}
                            placeholder="Seleziona sedi..."
                        />
                    </div>
                )}
            </div>

            <div className="flex gap-2 items-center">
                <button
                    onClick={() => setMultiFilters({ status: [], regione: [], societa: [], sede: [] })}
                    className="px-4 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                >
                    Cancella Filtri
                </button>
                <span className="text-sm text-gray-600">
                    Risultati: <strong>{filteredData.length}</strong> / {data.length} corsi
                </span>
            </div>
        </div>
    );

    const renderAnalytics = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Performance Dettagliata per Regione</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={chartData.regioneAnalysis}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis yAxisId="left" tickFormatter={(value) => `€${(value / 1000).toFixed(0)}k`} />
                        <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value.toFixed(0)}%`} />
                        <Tooltip
                            formatter={(value, name) => {
                                if (name === 'ricavi' || name === 'mol') return [formatCurrency(value), name.toUpperCase()];
                                if (name === 'marginalita') return [`${value.toFixed(1)}%`, 'Marginalità'];
                                return [value, name];
                            }}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="ricavi" fill="#3B82F6" name="Ricavi" />
                        <Bar yAxisId="left" dataKey="mol" fill="#10B981" name="MOL" />
                        <Line yAxisId="right" type="monotone" dataKey="marginalita" stroke="#F59E0B" strokeWidth={3} name="Marginalità %" />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );

    const renderDetailed = () => (
        <div className="space-y-6">
            <div className="bg-white rounded-lg border p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">🔍 Analisi Dettagliata per Entità</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Livello Analisi</label>
                        <select
                            value={analysisLevel}
                            onChange={(e) => {
                                setAnalysisLevel(e.target.value);
                                setSelectedEntity('');
                            }}
                            className="w-full px-3 py-2 border rounded text-sm"
                        >
                            <option value="sede">Per Sede</option>
                            <option value="societa">Per Società</option>
                            <option value="regione">Per Regione</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {analysisLevel === 'sede' ? 'Sede' : analysisLevel === 'societa' ? 'Società' : 'Regione'}
                        </label>
                        <select
                            value={selectedEntity}
                            onChange={(e) => setSelectedEntity(e.target.value)}
                            className="w-full px-3 py-2 border rounded text-sm"
                        >
                            <option value="">Seleziona {analysisLevel}...</option>
                            {entityOptions.map(option => (
                                <option key={option} value={option}>{option}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {selectedEntity && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-blue-900 font-medium mb-2">
                            Analisi per {analysisLevel}: {selectedEntity}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {(() => {
                                const field = analysisLevel === 'sede' ? keyColumns.sedeField :
                                    analysisLevel === 'societa' ? keyColumns.societaField :
                                        keyColumns.regioneField;

                                const entityData = filteredData.filter(row => row[field] === selectedEntity);
                                const totalMOL = keyColumns.molField ? entityData.reduce((sum, row) => sum + (parseFloat(row[keyColumns.molField]) || 0), 0) : 0;
                                const totalRicavi = keyColumns.ftField ? entityData.reduce((sum, row) => sum + (parseFloat(row[keyColumns.ftField]) || 0), 0) : 0;

                                return (
                                    <>
                                        <div className="bg-white p-3 rounded">
                                            <p className="text-sm text-gray-600">Corsi</p>
                                            <p className="text-xl font-bold text-blue-600">{entityData.length}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded">
                                            <p className="text-sm text-gray-600">Ricavi</p>
                                            <p className="text-xl font-bold text-green-600">{formatCurrency(totalRicavi)}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded">
                                            <p className="text-sm text-gray-600">MOL</p>
                                            <p className="text-xl font-bold text-purple-600">{formatCurrency(totalMOL)}</p>
                                        </div>
                                        <div className="bg-white p-3 rounded">
                                            <p className="text-sm text-gray-600">Marginalità</p>
                                            <p className="text-xl font-bold text-orange-600">
                                                {totalRicavi > 0 ? `${((totalMOL / totalRicavi) * 100).toFixed(1)}%` : '0%'}
                                            </p>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderDataTable = () => (
        <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">Dati Dettagliati ({filteredData.length} corsi)</h3>
            </div>
            <div className="overflow-auto max-h-96">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            {columns.slice(0, 8).map(col => (
                                <th key={col} className="text-left p-3 font-medium border-b min-w-32">
                                    <div className="flex flex-col space-y-1">
                                        <span className="truncate" title={col}>{col}</span>
                                        <input
                                            type="text"
                                            placeholder="Filtra..."
                                            value={filters[col] || ''}
                                            onChange={(e) => setFilters({ ...filters, [col]: e.target.value })}
                                            className="text-xs p-1 border rounded w-full"
                                        />
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.slice(0, 50).map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50 border-b">
                                {columns.slice(0, 8).map(col => (
                                    <td key={col} className="p-3">
                                        <div className="max-w-32 truncate" title={String(row[col] || '')}>
                                            {col.includes('€') && row[col] ? formatCurrency(row[col]) : String(row[col] || '')}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredData.length > 50 && (
                <div className="p-4 text-center text-gray-500 border-t">
                    Mostrate prime 50 righe di {filteredData.length}
                </div>
            )}
        </div>
    );

    // Render condizionali
    if (jsonDataLoading) return <FullPageLoader />;
    if (jsonDataError) return <FullPageError message={jsonDataError} />;
    
    console.log("Fetched JSON data:", jsonData);

    return (
        <div className="min-h-screen min-w-full bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">🎓 Dashboard Monitoraggio Corsi</h1>
                    <p className="text-gray-600">Sistema di monitoraggio completo per corsi di formazione</p>
                </div>

                <>
                    <div className="bg-white rounded-lg border mb-6 p-4 shadow-sm">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cerca globalmente..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 pr-4 py-2 border rounded-lg w-64"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {renderFilters()}

                    <div className="bg-white rounded-lg border mb-6 shadow-sm">
                        <div className="border-b">
                            <nav className="flex space-x-8 px-6">
                                {[
                                    { id: 'overview', label: 'Panoramica', icon: BarChart3 },
                                    { id: 'analytics', label: 'Analytics', icon: PieChart },
                                    { id: 'detailed', label: 'Analisi Dettagliata', icon: Building2 },
                                    { id: 'data', label: 'Dati', icon: Users }
                                ].map(tab => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm transition ${activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        <div className="p-6">
                            {activeTab === 'overview' && renderOverview()}
                            {activeTab === 'analytics' && renderAnalytics()}
                            {activeTab === 'detailed' && renderDetailed()}
                            {activeTab === 'data' && renderDataTable()}
                        </div>
                    </div>
                </>

            </div>
        </div>
    );
}
