import express from 'express';
import cors from 'cors';
import { Config } from './models/Config';
import path from 'path';
import { WhatsAppService } from './services/WhatsAppService';

export const startServer = (memoryConfig: { allowedNumbers: string[], triggerKeyword: string }, whatsappService: WhatsAppService) => {
    const app = express();
    app.use(cors());
    app.use(express.json());

    // Serve premium frontend
    app.use(express.static(path.join(__dirname, '../public')));

    // Status endpoint for frontend QR
    app.get('/api/status', (req, res) => {
        res.json({
            connected: whatsappService.isConnected,
            qr: whatsappService.currentQrCode
        });
    });

    app.get('/api/config', async (req, res) => {
        try {
            if (process.env.MONGODB_URI) {
                let config = await Config.findOne();
                if (!config) {
                    config = await Config.create(memoryConfig);
                }
                return res.json(config);
            }
            res.json(memoryConfig);
        } catch (err) {
            res.status(500).json({ error: 'Failed to load config' });
        }
    });

    app.post('/api/config', async (req, res) => {
        try {
            const { allowedNumbers, triggerKeyword } = req.body;
            
            // Update in memory for instant reflection
            memoryConfig.allowedNumbers = allowedNumbers;
            memoryConfig.triggerKeyword = triggerKeyword;

            if (process.env.MONGODB_URI) {
                let config = await Config.findOne();
                if (!config) {
                    config = new Config();
                }
                config.allowedNumbers = allowedNumbers;
                config.triggerKeyword = triggerKeyword;
                await config.save();
                return res.json(config);
            }
            res.json(memoryConfig);
        } catch (err) {
            res.status(500).json({ error: 'Failed to update config' });
        }
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Premium Dashboard running on http://localhost:${PORT}`);
    });
};
