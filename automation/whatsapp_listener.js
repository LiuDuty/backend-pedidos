const { Client, LocalAuth } = require('whatsapp-web.js');
const QRCode = require('qrcode');
const fs = require('fs-extra');
const path = require('path');

const TARGET_NUMBER = '5511975040117';
const TARGET_JID = `${TARGET_NUMBER}@c.us`;
const MESSAGES_DIR = path.join(__dirname, 'messages');
const QR_IMAGE_PATH = path.join(__dirname, 'qrcode.png');

fs.ensureDirSync(MESSAGES_DIR);

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: path.join(__dirname, '.wwebjs_auth')
    }),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', async (qr) => {
    console.log('\n--- NOVO QR CODE GERADO! ---');
    try {
        await QRCode.toFile(QR_IMAGE_PATH, qr);
        console.log('✅ O QR Code foi salvo como imagem!');
        console.log('👉 CLIQUE NO ARQUIVO "qrcode.png" NA COLUNA DA ESQUERDA PARA ESCANEAR.');
    } catch (err) {
        console.error('Erro ao gerar arquivo de imagem do QR:', err);
    }
});

client.on('ready', () => {
    console.log('\n✅ CONECTADO! Você já pode apagar o arquivo qrcode.png.');
    // Deleta o arquivo após conectar para não ficar lixo
    if (fs.existsSync(QR_IMAGE_PATH)) fs.unlinkSync(QR_IMAGE_PATH);
});

async function handleMessage(msg) {
    const isFromTarget = msg.from === TARGET_JID || (msg.fromMe && msg.to === TARGET_JID);
    if (isFromTarget) {
        const timestamp = Date.now();
        const filename = `msg_PENDING_${timestamp}.txt`;
        await fs.writeFile(path.join(MESSAGES_DIR, filename), msg.body, 'utf8');
        console.log(`\n📨 Comando salvo: "${msg.body}"`);
        await client.sendMessage(msg.from, `🚀 Antigravity: Comando agendado!`);
    }
}

client.on('message', handleMessage);
client.on('message_create', handleMessage);

client.initialize();
