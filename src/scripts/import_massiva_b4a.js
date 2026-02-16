const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Configurações do Back4App
const APP_ID = 'qMwcFKLqhylXNbQghvjtz5zxYO63xlyCzqxOo5lD';
const MASTER_KEY = 'NMSblnvGvVjZkXuph9ud9jp5ZvKL8zz9E73cn5Y4';
const B4A_URL = 'https://parseapi.back4app.com/classes/NotaFiscal';

// Caminho do Excel
const EXCEL_PATH = path.join(__dirname, '..', 'assets', 'MARCANN', 'GERAL.xlsx');

async function importToB4A() {
    try {
        console.log('⏳ Iniciando importação massiva para Back4App...');

        if (!fs.existsSync(EXCEL_PATH)) {
            console.error(`❌ Erro: Arquivo ${EXCEL_PATH} não encontrado!`);
            return;
        }

        const workbook = xlsx.readFile(EXCEL_PATH);
        let totalImported = 0;

        for (const sheetName of workbook.SheetNames) {
            console.log(`\n  --- Processando aba: ${sheetName} ---`);
            const sheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            if (rows.length === 0) continue;

            const tableStarts = [];
            for (let r = 0; r < Math.min(15, rows.length); r++) {
                const row = rows[r];
                for (let c = 0; c < row.length; c++) {
                    if (row[c] && String(row[c]).trim().toUpperCase() === "CLIENTE") {
                        tableStarts.push({ col: c, row: r });
                    }
                }
            }

            const batch = [];
            for (const start of tableStarts) {
                for (let r = start.row + 1; r < rows.length; r++) {
                    const row = rows[r];
                    const c = start.col;
                    if (c >= row.length || (!row[c] && !row[c + 1])) continue;

                    const cleanNum = (val) => {
                        if (typeof val === 'number') return val;
                        if (!val) return 0;
                        const cleaned = String(val).replace(/[^0-9.,-]/g, '').replace(',', '.');
                        const n = parseFloat(cleaned);
                        return isNaN(n) ? 0 : n;
                    };

                    const record = {
                        cliente: String(row[c] || '').trim(),
                        produto: String(row[c + 1] || '').trim(),
                        pedido: String(row[c + 2] || '').trim(),
                        oc_cliente: String(row[c + 3] || '').trim(),
                        quantidade: cleanNum(row[c + 5]),
                        unidade: String(row[c + 6] || '').trim(),
                        preco_unitario: cleanNum(row[c + 8]),
                        nf: String(row[c + 11] || '').trim(),
                        valor_total: cleanNum(row[c + 14]),
                        origem: sheetName
                    };

                    if (record.cliente) batch.push(record);

                    // Lotes de 50 para não sobrecarregar a API
                    if (batch.length >= 50) {
                        await sendBatch(batch);
                        totalImported += batch.length;
                        process.stdout.write(`\r✅ Progresso: ${totalImported} registros...`);
                        batch.length = 0;
                    }
                }
            }
            if (batch.length > 0) {
                await sendBatch(batch);
                totalImported += batch.length;
                console.log(`\r✅ Progresso: ${totalImported} registros...`);
            }
        }

        console.log(`\n\n🎉 Importação concluída! Total: ${totalImported} registros.`);

    } catch (error) {
        console.error('\n❌ Erro fatal:', error.message);
    }
}

async function sendBatch(records) {
    // A API do Parse suporta Batch Requests através do endpoint /batch
    const requests = records.map(rec => ({
        method: 'POST',
        path: '/classes/NotaFiscal',
        body: rec
    }));

    try {
        const response = await fetch('https://parseapi.back4app.com/batch', {
            method: 'POST',
            headers: {
                'X-Parse-Application-Id': APP_ID,
                'X-Parse-Master-Key': MASTER_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ requests })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Erro no batch');
        }
    } catch (e) {
        console.error('\n⚠️ Erro ao enviar lote:', e.message);
    }
}

importToB4A();
