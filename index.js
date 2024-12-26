const express = require('express');
const QRCode = require('qrcode');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 8080;

const apiKeyFile = path.join(__dirname, 'apikeyall.json'); // مسیر فایل کلیدها
const userIpFile = path.join(__dirname, 'allusersip.json'); // مسیر ذخیره اطلاعات کاربران
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// مدت زمان یک روز (24 ساعت)
const timeLimit = 24 * 60 * 60 * 1000;

// بارگذاری داده‌ها از فایل‌ها
const loadApiKeys = () => {
    if (!fs.existsSync(apiKeyFile)) {
        const defaultKey = {
            "nothing-api": { limit: 100, used: 0, lastReset: Date.now() }
        };
        fs.writeFileSync(apiKeyFile, JSON.stringify(defaultKey, null, 2));
    }
    return JSON.parse(fs.readFileSync(apiKeyFile));
};

const loadUserIps = () => {
    if (!fs.existsSync(userIpFile)) {
        fs.writeFileSync(userIpFile, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(userIpFile));
};

const saveApiKeys = (apiKeys) => {
    fs.writeFileSync(apiKeyFile, JSON.stringify(apiKeys, null, 2));
};

const saveUserIps = (userIps) => {
    fs.writeFileSync(userIpFile, JSON.stringify(userIps, null, 2));
};

let apiKeys = loadApiKeys();
let userIps = loadUserIps();

// بررسی و ایجاد وضعیت برای هر کاربر
const checkUserLimit = (apikey, ip) => {
    const apiKeyData = apiKeys[apikey];
    const userIpData = userIps[ip] || { used: 0, lastUsed: Date.now() };

    // اگر زمان بازنشانی گذشته باشد، مقدار `used` صفر می‌شود
    if (Date.now() - apiKeyData.lastReset > timeLimit) {
        apiKeyData.used = 0;
        apiKeyData.lastReset = Date.now();
        saveApiKeys(apiKeys);
    }

    // اگر مدت زمان 24 ساعت گذشته باشد، ریست کنیم
    if (Date.now() - userIpData.lastUsed > timeLimit) {
        userIpData.used = 0;
        userIpData.lastUsed = Date.now();
        saveUserIps(userIps);
    }

    // افزایش استفاده
    userIpData.used += 1;
    userIps[ip] = userIpData;
    saveUserIps(userIps);

    return apiKeyData;
};


//TEMP MAIL
// DOC API
app.get('/docs', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/changelog', (req, res) => {
    res.sendFile(path.join(__dirname, 'Updates.html'));
});
app.get('/contact', (req, res) => {
    res.sendFile(path.join(__dirname, 'contact.html'));
});
app.get('/doc', (req, res) => {
    res.sendFile(path.join(__dirname, 'docs.html'));
});
app.get('/ai', (req, res) => {
    res.sendFile(path.join(__dirname, 'ai.html'));
});
app.get('/download', (req, res) => {
    res.sendFile(path.join(__dirname, 'download.html'));
});
app.get('/tools', (req, res) => {
    res.sendFile(path.join(__dirname, 'tools.html'));
});
// مسیر بررسی وضعیت API
app.get('/search', (req, res) => {
    res.sendFile(path.join(__dirname, 'search.html'));
});
app.get('/converter', (req, res) => {
    res.sendFile(path.join(__dirname, 'converter.html'));
});
app.get('/nsfw', (req, res) => {
    res.sendFile(path.join(__dirname, 'nsfw.html'));
});
app.get('/maker', (req, res) => {
    res.sendFile(path.join(__dirname, 'maker.html'));
});
app.get('/stalk', (req, res) => {
    res.sendFile(path.join(__dirname, 'stalk.html'));
});
app.get('/islam', (req, res) => {
    res.sendFile(path.join(__dirname, 'islam.html'));
});
// مسیر بررسی وضعیت API
app.get('/api/tools/qrcode', async (req, res) => {
    const apikey = req.query.apikey; // دریافت کلید API
    const text = req.query.text; // متن برای تولید QR Code
    const ip = req.ip; // دریافت آدرس IP کاربر

    if (!apikey || !apiKeys[apikey]) {
        return res.status(401).json({
            status: false,
            result: 'Invalid or missing API key.'
        });
    }

    const keyData = checkUserLimit(apikey, ip);
    if (keyData.used > keyData.limit) {
        return res.status(403).json({
            status: false,
            result: 'API key usage limit exceeded.'
        });
    }

    if (!text) {
        return res.status(400).json({
            status: false,
            result: 'No text provided.'
        });
    }

    try {
        const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
        
        // درخواست تصویر QR Code
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });

        // ارسال تصویر
        res.setHeader('Content-Type', 'image/png');
        res.send(response.data);
    } catch (err) {
        res.status(500).json({
            status: false,
            message: 'Error generating QR code.',
            error: err.message
        });
    }
});

// راه‌اندازی سرور
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
