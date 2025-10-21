
const express = require('express');
const bodyParser = require('body-parser');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

const client = new Client({ authStrategy: new LocalAuth() });

let isReady = false;
let history = [];

client.on('qr', (qr) => {
    console.log('QR RECEIVED');
    app.locals.qr = qr;
});

client.on('ready', () => {
    console.log('WhatsApp conectado!');
    isReady = true;
    app.locals.qr = null;
});

client.initialize();

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.get('/qr', async (req, res) => {
    if (app.locals.qr) {
        const url = await qrcode.toDataURL(app.locals.qr);
        res.json({ qr: url });
    } else {
        res.json({ qr: null });
    }
});

app.get('/grupos', async (req, res) => {
    if (!isReady) return res.json([]);
    const chats = await client.getChats();
    const grupos = chats.filter(c => c.isGroup).map(c => ({ id: c.id._serialized, name: c.name }));
    res.json(grupos);
});

app.post('/enviar', async (req, res) => {
    const { grupoIds, mensagem } = req.body;
    if (!grupoIds || grupoIds.length === 0) return res.json({ success: false, error: 'Nenhum grupo selecionado!' });

    let enviados = [];
    let erros = [];

    for (const grupoId of grupoIds) {
        try {
            await client.sendMessage(grupoId, mensagem);
            await sleep(3000);
            enviados.push(grupoId);
            history.unshift({ grupoId, mensagem, timestamp: new Date().toLocaleString() });
            if (history.length > 20) history.pop();
        } catch (err) {
            erros.push({ grupoId, error: err.message });
        }
    }

    res.json({ success: true, enviados, erros, history });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Bot rodando em http://localhost:${PORT}`));
