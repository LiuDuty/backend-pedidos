require('dotenv').config();

const appId = process.env.BACK4APP_APP_ID;
const masterKey = process.env.BACK4APP_MASTER_KEY;
const apiUrl = process.env.BACK4APP_API_URL;

async function checkRemoteData() {
    console.log('--- Verificando dados no Back4App (Parse API) ---');

    const classes = ['NotaFiscal', 'Order', 'Customer', 'Supplier'];

    for (const className of classes) {
        try {
            const response = await fetch(`${apiUrl}classes/${className}?limit=0&count=1`, {
                headers: {
                    'X-Parse-Application-Id': appId,
                    'X-Parse-Master-Key': masterKey
                }
            });
            const data = await response.json();
            if (response.ok) {
                console.log(`Classe ${className}: ${data.count || 0} registros encontrados.`);
            } else {
                console.log(`Classe ${className}: Erro (${data.error || 'Unknown error'})`);
            }
        } catch (error) {
            console.log(`Classe ${className}: Erro de conexão (${error.message})`);
        }
    }
}

checkRemoteData();
