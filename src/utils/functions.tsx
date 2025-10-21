const formatCurrency = (value: any) => {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value || 0);
};

export { formatCurrency };

function rand() {
    return Math.floor(Math.random() * 1000);
}


export function parsingJsonData(apiJsonData: any[]) {

    //console.log("API JSON Data:", apiJsonData);
    
    return apiJsonData.map(item => {
        return {
            edizione: Number(item?.course_id) || rand(),
            idCorso: Number(item?.corso.id) || rand(),
            corso: item?.corso?.abbreviated_title || item?.corso?.title || "N/A",
            sede: item?.sede_parte_teorica?.city || item?.sede_parte_pratica?.city || "N/A",
            statoCorso: item?.stato_corso?.name || "not a name",
            numeroOre: Number(item?.corso?.total_hours) || rand(),
            euroDaFT: rand(),
            euroCosti: rand(),
            euroMOL: rand(),
            dataInizio: rand(),
            dataFine: rand(),
            dataEsame: rand(),
            dataIpInc: item?.data_ip_incasso || "N/A",
            saldoDataRich: item?.saldo_data_accredito || "N/A",
            saldoDecretoNumData: item?.saldo_num_decreto_data || "N/A",
            saldoEuroDaDecreto: rand(),
            euroResiduoDecreti: (rand()*-1),
            regione: item?.sede_parte_teorica?.city || item?.sede_parte_pratica?.city || "N/A",
            societa: item?.sede_parte_teorica?.denominazione || item?.sede_parte_pratica?.denominazione || "N/A",
            saldoDataAccrCON: item?.saldo_data_accredito || "N/A",
            saldoEuroIncCON: rand()
        };
    });

}