import dotenv from 'dotenv';
import { WhatsAppService } from './services/WhatsAppService';
import { AIService } from './services/AIService';

dotenv.config();

async function start() {
    const aiService = new AIService();
    const whatsappService = new WhatsAppService(aiService);
    
    await whatsappService.initialize();
}

start().catch(console.error);
