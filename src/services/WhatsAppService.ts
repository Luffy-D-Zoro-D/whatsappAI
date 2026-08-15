import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import pino from 'pino';
import { AIService } from './AIService';

export class WhatsAppService {
    private sock: ReturnType<typeof makeWASocket> | null = null;
    private aiService: AIService;
    private config: { allowedNumbers: string[], triggerKeyword: string };

    public currentQrCode: string | null = null;
    public isConnected: boolean = false;

    constructor(aiService: AIService, config: { allowedNumbers: string[], triggerKeyword: string }) {
        this.aiService = aiService;
        this.config = config;
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
                console.log('QR Code generated. Available on the web dashboard!');
                try {
                    this.currentQrCode = await QRCode.toDataURL(qr);
                } catch (err) {
                    console.error('Failed to generate QR data URL', err);
                }
            }
            
            if (connection === 'close') {
                this.isConnected = false;
                const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
                if (shouldReconnect) {
                    console.log('Connection closed, reconnecting in 3s...');
                    setTimeout(() => this.initialize(), 3000);
                } else {
                    console.log('Logged out from WhatsApp. Please delete whatsapp-auth folder.');
                }
            } else if (connection === 'open') {
                this.isConnected = true;
                this.currentQrCode = null;
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

            // Determine the true sender's JID
            const isGroup = msg.key.remoteJid?.endsWith('@g.us');
            const senderJid = isGroup ? msg.key.participant : msg.key.remoteJid;

            // Check if sender is in the dashboard whitelist
            // You (the bot owner) are always authorized to use the bot
            let isAuthorized = msg.key.fromMe || false;
            
            // For other people messaging you, they MUST be in the whitelist
            if (!isAuthorized && senderJid) {
                const numericSenderJid = senderJid.replace(/\D/g, '');
                isAuthorized = this.config.allowedNumbers.some(num => {
                    let cleanNum = num.replace(/\D/g, '');
                    cleanNum = cleanNum.replace(/^0+/, '');
                    return cleanNum.length > 5 && numericSenderJid.includes(cleanNum);
                });
            }
            
            if (!isAuthorized) {
                const debugStr = `[DEBUG] Sender ${senderJid} rejected. Config: ${JSON.stringify(this.config.allowedNumbers)}, Keyword: ${this.config.triggerKeyword}`;
                require('fs').appendFileSync('debug.log', debugStr + '\n');
                console.log(debugStr);
                return;
            }

            const triggerKeyword = this.config.triggerKeyword?.toLowerCase();
            
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
