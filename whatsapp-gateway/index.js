const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const cors = require('cors');

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// Initialize WhatsApp Client
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' // MacOS Path
    }
});

let isReady = false;

client.on('qr', (qr) => {
    console.log('SCAN THIS QR CODE WITH YOUR WHATSAPP:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ WA Client is Ready!');
    isReady = true;
});

client.on('authenticated', () => {
    console.log('Authenticated successfully!');
});

client.initialize();

// API Endpoint to send message
app.post('/send', async (req, res) => {
    const { number, message } = req.body;

    if (!isReady) {
        return res.status(503).json({ success: false, error: "WhatsApp client not ready yet" });
    }

    if (!number || !message) {
        return res.status(400).json({ success: false, error: "Missing number or message" });
    }

    try {
        // Format number: '628xxx' -> '628xxx@c.us'
        // Remove '+' if exists
        let cleanNumber = number.toString().replace('+', '');
        // Ensure it ends with suffix
        const chatId = cleanNumber.includes('@c.us') ? cleanNumber : `${cleanNumber}@c.us`;

        await client.sendMessage(chatId, message);
        console.log(`Sent to ${cleanNumber}`);
        res.json({ success: true });
    } catch (e) {
        console.error("Error sending:", e);
        res.status(500).json({ success: false, error: e.message });
    }
});

app.listen(port, () => {
    console.log(`Gateway running at http://localhost:${port}`);
});
