import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { AIService } from './services/AIService';
import { WhatsAppService } from './services/WhatsAppService';
import { startServer } from './server';
import { Config } from './models/Config';

// In-memory config if MongoDB is not set
export const memoryConfig = {
    allowedNumbers: process.env.TARGET_PHONE_NUMBER ? [process.env.TARGET_PHONE_NUMBER] : [],
    triggerKeyword: process.env.BOT_TRIGGER_KEYWORD || ''
};

async function bootstrap() {
    console.log('Starting WhatsApp Botty...');

    if (process.env.MONGODB_URI) {
        try {
            await mongoose.connect(process.env.MONGODB_URI);
            console.log('✅ Connected to MongoDB');
            
            // Sync memory config with DB on startup
            let config = await Config.findOne();
            if (config) {
                memoryConfig.allowedNumbers = config.allowedNumbers;
                memoryConfig.triggerKeyword = config.triggerKeyword;
            } else {
                await Config.create(memoryConfig);
            }
        } catch (err) {
            console.error('❌ MongoDB Connection Error:', err);
        }
    } else {
        console.warn('⚠️ No MONGODB_URI set. Running entirely in-memory for testing.');
    }

    // Start Express Dashboard
    startServer(memoryConfig);

    const aiService = new AIService();
    const whatsappService = new WhatsAppService(aiService, memoryConfig);

    await whatsappService.initialize();
}

bootstrap().catch(console.error);
