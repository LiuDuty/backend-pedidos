const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// Configurações do Back4App
const APP_ID = 'qMwcFKLqhylXNbQghvjtz5zxYO63xlyCzqxOo5lD';
const MASTER_KEY = 'NMSblnvGvVjZkXuph9ud9jp5ZvKL8zz9E73cn5Y4';

// Caminho do Excel (Usando NOTAS.xlsx que tem as abas específicas de cadastro)
const EXCEL_PATH = path.join(__dirname, '..', 'assets', 'NOTAS.xlsx');

async function importCadastros() {
    try {
        console.log('⏳ Iniciando importação de Fornecedores e Clientes...');

        if (!fs.existsSync(EXCEL_PATH)) {
            console.error(`❌ Erro: Arquivo ${EXCEL_PATH} não encontrado!`);
            return;
        }

        const workbook = xlsx.readFile(EXCEL_PATH);

        // 1. IMPORTAR FORNECEDORES
        if (workbook.SheetNames.includes('Fornecedores')) {
            console.log('--- Importando Fornecedores ---');
            const sheet = workbook.Sheets['Fornecedores'];
            const rows = xlsx.utils.sheet_to_json(sheet);
            console.log(`Encontrados ${rows.length} fornecedores.`);

            for (const row of rows) {
                // Mapeamento baseado na estrutura observada no import_data.py
                const supplier = {
                    name: row['Fornecedor'] || row['FORNECEDOR'] || '',
                    logo_filename: row['Logo'] || '',
                    address: row['ENDEREÇO'] || '',
                    number: String(row['Nº'] || ''),
                    zipcode: String(row['CEP'] || ''),
                    neighborhood: row['BAIRRO'] || '',
                    city: row['CIDADE'] || '',
                    state: row['ESTADO'] || '',
                    phone: String(row['FONE'] || ''),
                    cnpj: String(row['CNPJ'] || ''),
                    state_registration: String(row['IE'] || ''),
                    email: row['E-MAIL'] || ''
                };

                if (supplier.name) {
                    await sendToB4A('Supplier', supplier);
                }
            }
        }

        // 2. IMPORTAR CLIENTES
        if (workbook.SheetNames.includes('Clientes')) {
            console.log('\n--- Importando Clientes ---');
            const sheet = workbook.Sheets['Clientes'];
            const rows = xlsx.utils.sheet_to_json(sheet);
            console.log(`Encontrados ${rows.length} clientes.`);

            for (const row of rows) {
                const customer = {
                    name: row['CLIENTE'] || '',
                    address: row['ENDEREÇO'] || '',
                    number: String(row['Nº'] || ''),
                    zipcode: String(row['CEP'] || ''),
                    neighborhood: row['BAIRRO'] || '',
                    city: row['CIDADE'] || '',
                    state: row['ESTADO'] || '',
                    phone: String(row['FONE'] || ''),
                    contact: row['CONTATO'] || '',
                    email: row['E-MAIL'] || '',
                    cnpj: String(row['CNPJ'] || ''),
                    state_registration: String(row['IE'] || '')
                };

                if (customer.name) {
                    await sendToB4A('Customer', customer);
                }
            }
        }

        console.log('\n✅ Importação de cadastros concluída!');

    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

async function sendToB4A(className, data) {
    try {
        const response = await fetch(`https://parseapi.back4app.com/classes/${className}`, {
            method: 'POST',
            headers: {
                'X-Parse-Application-Id': APP_ID,
                'X-Parse-Master-Key': MASTER_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            console.log(`  [${className}] ${data.name} - OK`);
        } else {
            const err = await response.json();
            console.error(`  [${className}] Erro em ${data.name}:`, err.error);
        }
    } catch (e) {
        console.error(`  [${className}] Erro de conexão:`, e.message);
    }
}

importCadastros();
