const xlsx = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// ====================== CONFIGURAÇÃO DE CAMINHOS ======================
const EXCEL_PATH = path.join(__dirname, 'src', 'assets', 'BASE.xlsx');
const DB_PATH = path.join(__dirname, 'notas.db');

// ====================== CRIAÇÃO DA BASE ======================
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Erro ao abrir o banco de dados', err.message);
        process.exit(1);
    }
    console.log(`Banco ${DB_PATH} preparado com sucesso!`);
});

const createTable = () => {
    return new Promise((resolve, reject) => {
        db.run(`
            CREATE TABLE IF NOT EXISTS notas_fiscais (
                id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                mes_ano             TEXT,           -- ex: "MARÇO 2014"
                data_pedido         DATE,
                data_entrega        DATE,
                data_fatura         DATE,
                cliente             TEXT,
                produto             TEXT,
                pedido              TEXT,
                oc_cliente          TEXT,
                quantidade          REAL,
                unidade             TEXT,           -- MIL, KG, UND, etc.
                preco_unitario      REAL,
                valor_total         REAL,
                comissao            REAL,
                nf                  TEXT,
                saldo               REAL,
                observacao          TEXT,
                origem              TEXT,           -- "Principal" ou "Lateral Direita"
                created_at          DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// ====================== FUNÇÃO DE CARGA ======================
async function carregarPlanilha() {
    if (!fs.existsSync(EXCEL_PATH)) {
        console.error(`❌ Erro: Arquivo ${EXCEL_PATH} não encontrado!`);
        return;
    }

    console.log(`⏳ Lendo planilha: ${EXCEL_PATH}...`);
    const workbook = xlsx.readFile(EXCEL_PATH);
    const sheetName = '2014 - 2015';

    if (!workbook.SheetNames.includes(sheetName)) {
        console.error(`❌ Erro: Aba '${sheetName}' não encontrada no Excel!`);
        console.log('Abas disponíveis:', workbook.SheetNames);
        return;
    }

    const sheet = workbook.Sheets[sheetName];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    console.log(`📊 Total de linhas lidas: ${rows.length}`);

    const dados = [];
    let mesAtual = null;

    const clientesAlvo = ['DOCE MEL', 'CALIMAN', 'CASA SUIÇA', 'FRUT MEL', 'NORTEFRUT', 'AGC', 'BENASSI', 'KORIN', 'HORTA VITAE'];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const linha = row.join(' | ').trim();

        // Detecta mês/ano
        const matchMes = linha.match(/(JANEIRO|FEVEREIRO|MARÇO|ABRIL|MAIO|JUNHO|JULHO|AGOSTO|SETEMBRO|OUTUBRO|NOVEMBRO|DEZEMBRO)\s+\d{4}/i);
        if (matchMes) {
            mesAtual = matchMes[0].toUpperCase();
            continue;
        }

        // Detecta linha de cliente + produto
        if (clientesAlvo.some(x => linha.toUpperCase().includes(x))) {
            // No formato array (header: 1), temos as colunas diretamente
            // Vamos tentar mapear baseado na lógica do usuário
            // partes = [cliente, produto, pedido, oc, data, qtd, und, preco...]

            try {
                // Remove valores vazios iniciais se houver desalinhamento
                let colunas = row.filter(c => c !== null);

                // Se o cliente estiver na primeira coluna preenchida
                const registro = {
                    mes_ano: mesAtual,
                    cliente: String(colunas[0] || '').trim(),
                    produto: String(colunas[1] || '').trim(),
                    pedido: String(colunas[2] || '').trim(),
                    oc_cliente: String(colunas[3] || '').trim(),
                    data_pedido: null,
                    quantidade: null,
                    unidade: String(colunas[6] || '').trim(),
                    preco_unitario: null,
                    valor_total: null,
                    comissao: null,
                    nf: null,
                    saldo: null,
                    observacao: null,
                    origem: 'Principal'
                };

                // Parser de datas e números (imulando regex do Python)
                colunas.forEach(p => {
                    const pStr = String(p);
                    if (/\d{2}\/\d{2}\/\d{4}/.test(pStr)) {
                        if (!registro.data_pedido) registro.data_pedido = pStr;
                        else if (!registro.data_entrega) registro.data_entrega = pStr;
                    }
                    if (/NF/i.test(pStr) || /^\d{4,}$/.test(pStr)) {
                        registro.nf = pStr;
                    }
                });

                // Quantidade e Preço (limpeza de strings)
                const cleanNum = (val) => {
                    if (typeof val === 'number') return val;
                    const cleaned = String(val).replace(/[^0-9.,]/g, '').replace(',', '.');
                    return parseFloat(cleaned) || null;
                };

                registro.quantidade = cleanNum(colunas[5]);
                registro.preco_unitario = cleanNum(colunas[7]);

                if (registro.preco_unitario && registro.quantidade) {
                    registro.valor_total = registro.preco_unitario * registro.quantidade;
                }

                dados.push(registro);
            } catch (e) {
                // ignore errors
            }
        }
    }

    // Insere no banco
    const stmt = db.prepare(`
        INSERT INTO notas_fiscais 
        (mes_ano, data_pedido, data_entrega, data_fatura, cliente, produto, pedido, 
         oc_cliente, quantidade, unidade, preco_unitario, valor_total, comissao, 
         nf, saldo, observacao, origem)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");
        dados.forEach(reg => {
            stmt.run([
                reg.mes_ano, reg.data_pedido, reg.data_entrega, null,
                reg.cliente, reg.produto, reg.pedido, reg.oc_cliente,
                reg.quantidade, reg.unidade, reg.preco_unitario,
                reg.valor_total, reg.comissao, reg.nf,
                reg.saldo, reg.observacao, reg.origem
            ]);
        });
        db.run("COMMIT", (err) => {
            if (err) {
                console.error("Erro ao confirmar transação", err);
            } else {
                console.log(`✅ ${dados.length} registros carregados com sucesso!`);
            }
            stmt.finalize(() => {
                db.close((closeErr) => {
                    if (closeErr) console.error("Erro ao fechar o banco", closeErr.message);
                });
            });
        });
    });
}

// ====================== EXECUÇÃO ======================
async function run() {
    await createTable();
    await carregarPlanilha();
}

run();
