const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const db = require('../config/database');
const NotaFiscal = require('../models/NotaFiscal');

// Configurações
const EXCEL_PATH = path.join(__dirname, '..', 'assets', 'MARCANN', 'GERAL.xlsx');

async function importGeral() {
    try {
        console.log('⏳ Iniciando conexão com o banco de dados...');
        await db.authenticate();
        console.log('✅ Conectado ao banco de dados!');

        // Sincronizar modelo (sem forçar delete)
        await NotaFiscal.sync();

        if (!fs.existsSync(EXCEL_PATH)) {
            console.error(`❌ Erro: Arquivo ${EXCEL_PATH} não encontrado!`);
            return;
        }

        console.log(`⏳ Lendo planilha gigante: ${EXCEL_PATH}...`);
        const workbook = xlsx.readFile(EXCEL_PATH);
        console.log(`📊 Abas encontradas: ${workbook.SheetNames.length}`);

        for (const sheetName of workbook.SheetNames) {
            console.log(`  Processando aba: ${sheetName}`);
            const sheet = workbook.Sheets[sheetName];
            const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

            if (rows.length === 0) continue;

            // Lógica de detecção de Fornecedor (similar ao unificar.py)
            let potentialFornecedor = "DESCONHECIDO";
            for (let r = 0; r < Math.min(5, rows.length); r++) {
                const lineText = rows[r].join(" ").toUpperCase();
                if (lineText.includes("SERRAPLAST")) {
                    potentialFornecedor = "SERRAPLAST";
                    break;
                }
                if (rows[r][0] && String(rows[r][0]).trim()) {
                    potentialFornecedor = String(rows[r][0]).split("  ")[0].trim();
                    break;
                }
            }

            // Encontrar cabeçalhos "CLIENTE"
            const tableStarts = [];
            for (let r = 0; r < Math.min(15, rows.length); r++) {
                const row = rows[r];
                for (let c = 0; c < row.length; c++) {
                    if (row[c] && String(row[c]).trim().toUpperCase() === "CLIENTE") {
                        // Mapeia colunas extras
                        const headerMap = { 'CÓDIGO': -1, 'PESO': -1, 'IPI': -1 };
                        for (let offset = 0; offset < 30; offset++) {
                            if (c + offset < row.length) {
                                const hCell = String(row[c + offset]).trim().toUpperCase();
                                if (hCell.includes("CÓDIGO") || hCell.includes("CODIGO")) headerMap['CÓDIGO'] = offset;
                                if (hCell.includes("PESO")) headerMap['PESO'] = offset;
                                if (hCell.includes("IPI")) headerMap['IPI'] = offset;
                            }
                        }
                        tableStarts.push({ col: c, row: r, headerMap });
                    }
                }
            }

            const batch = [];
            for (const start of tableStarts) {
                for (let r = start.row + 1; r < rows.length; r++) {
                    const row = rows[r];
                    const c = start.col;

                    if (c >= row.length || (!row[c] && !row[c + 1])) continue;

                    // Mapeamento baseado no bloco de 18 colunas + extras
                    // 0:CLIENTE, 1:PRODUTO, 2:PEDIDO, 3:OC, 4:DATA, 5:QUANT, 6:UND...
                    const cleanNum = (val) => {
                        if (typeof val === 'number') return val;
                        if (!val) return null;
                        const cleaned = String(val).replace(/[^0-9.,-]/g, '').replace(',', '.');
                        const n = parseFloat(cleaned);
                        return isNaN(n) ? null : n;
                    };

                    const cleanDate = (val) => {
                        if (!val) return null;
                        if (val instanceof Date) return val;
                        // Se for serial do Excel
                        if (typeof val === 'number') {
                            const date = xlsx.utils.format_cell({ t: 'n', v: val, z: 'yyyy-mm-dd' });
                            return date || null;
                        }
                        return null;
                    };

                    const record = {
                        cliente: String(row[c] || '').trim(),
                        produto: String(row[c + 1] || '').trim(),
                        pedido: String(row[c + 2] || '').trim(),
                        oc_cliente: String(row[c + 3] || '').trim(),
                        data_pedido: cleanDate(row[c + 4]),
                        quantidade: cleanNum(row[c + 5]),
                        unidade: String(row[c + 6] || '').trim(),
                        preco_unitario: cleanNum(row[c + 8]),
                        data_entrega: cleanDate(row[c + 9]),
                        data_fatura: cleanDate(row[c + 10]),
                        nf: String(row[c + 11] || '').trim(),
                        saldo: cleanNum(row[c + 13]),
                        valor_total: cleanNum(row[c + 14]),
                        comissao: cleanNum(row[c + 15]),
                        observacao: String(row[c + 17] || '').trim(),
                        origem: sheetName,
                        mes_ano: sheetName // Fallback
                    };

                    if (record.cliente) {
                        batch.push(record);
                    }

                    // Inserir em lotes para performance
                    if (batch.length >= 100) {
                        await NotaFiscal.bulkCreate(batch);
                        batch.length = 0;
                    }
                }
            }
            if (batch.length > 0) {
                await NotaFiscal.bulkCreate(batch);
            }
        }

        console.log('✅ Importação concluída com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro durante a importação:', error);
        process.exit(1);
    }
}

importGeral();
