import OpenAI from 'openai';

export class AIService {
    private openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({ 
            apiKey: process.env.GROQ_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1' 
        });
    }

    async generateResponse(text: string): Promise<string> {
        try {
            const aiResponse = await this.openai.chat.completions.create({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: 'You are Botty, a helpful and friendly AI assistant on WhatsApp. Respond directly, keep answers relatively concise and nicely formatted for WhatsApp (using *bold* and _italics_ where helpful).' },
                    { role: 'user', content: text }
                ]
            });

            return aiResponse.choices[0].message.content || 'I could not generate a response.';
        } catch (error) {
            console.error('AI Error:', error);
            return 'Sorry, I am having trouble connecting to my brain right now.';
        }
    }
}
