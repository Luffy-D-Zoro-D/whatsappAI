import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { AIService } from './AIService';

export class WhatsAppService {
    private sock: ReturnType<typeof makeWASocket> | null = null;
    private aiService: AIService;

    constructor(aiService: AIService) {
        this.aiService = aiService;
    }

    async initialize() {
        const { state, saveCreds } = await useMultiFileAuthState('./whatsapp-auth');
        
        this.sock = makeWASocket({
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: 'silent' }) as any
        });

        this.sock.ev.on('creds.update', saveCreds);

        this.sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('Scan this QR code with WhatsApp:');
                qrcode.generate(qr, { small: true });
            }
            
            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    console.log('Connection closed, reconnecting in 3s...');
                    setTimeout(() => this.initialize(), 3000);
                } else {
                    console.log('Logged out from WhatsApp. Please delete whatsapp-auth folder.');
                }
            } else if (connection === 'open') {
                console.log('WhatsApp Client is READY!');
            }
        });

        this.sock.ev.on('messages.upsert', async (m) => {
            if (m.type !== 'notify' || !m.messages || m.messages.length === 0) return;
            const msg = m.messages[0];
            
            if (!msg || !msg.message) return;

            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
            console.log(`[DEBUG] Received a message. fromMe: ${msg.key.fromMe}, JID: ${msg.key.remoteJid}, Text: "${text}"`);
            if (!text) return;

            // Ignore messages sent BY the bot to prevent infinite loops
            if (msg.key.fromMe && text.startsWith('🤖')) {
                console.log(`[DEBUG] Ignoring bot's own message to prevent loop.`);
                return;
            }

            const targetPhone = process.env.TARGET_PHONE_NUMBER;
            if (!targetPhone) {
                console.warn('TARGET_PHONE_NUMBER not set in .env');
                return;
            }

            // Check if sender matches target phone number
            const isGroup = msg.key.remoteJid?.endsWith('@g.us');
            const senderJid = isGroup ? msg.key.participant : msg.key.remoteJid;
            
            console.log(`[DEBUG] senderJid: ${senderJid}, targetPhone: ${targetPhone}`);

            // Allow testing if you message yourself (fromMe is true), OR if the sender matches targetPhone
            const isAuthorized = senderJid?.includes(targetPhone) || msg.key.fromMe;
            
            if (!isAuthorized) {
                console.log(`[DEBUG] Sender does not match target phone, ignoring.`);
                return;
            }

            const triggerKeyword = process.env.BOT_TRIGGER_KEYWORD?.toLowerCase();
            
            if (triggerKeyword && triggerKeyword.trim() !== '') {
                if (!text.toLowerCase().includes(triggerKeyword)) {
                    console.log(`[DEBUG] Message does not contain '${triggerKeyword}', ignoring.`);
                    return;
                }
            } else {
                console.log(`[DEBUG] No trigger keyword set. Replying to ALL messages.`);
            }

            console.log(`[DEBUG] All checks passed! Requesting AI response for: "${text}"`);

            try {
                const replyText = await this.aiService.generateResponse(text);
                console.log(`[DEBUG] AI returned: "${replyText}"`);

                const sendTo = msg.key.remoteJid!;
                await this.sock!.sendMessage(sendTo, { text: `🤖 *Botty*\n\n${replyText}` }, { quoted: msg });
                console.log(`[DEBUG] Message successfully sent back to WhatsApp!`);
            } catch (err) {
                console.error(`[DEBUG] ERROR while generating/sending reply:`, err);
            }
        });
    }
}
