# 🤖 WhatsApp AI Bot (Full-Stack Edition)

This is a highly advanced, production-ready WhatsApp bot powered by **Groq AI** (LLaMA 3) and **Whiskeysockets/Baileys**. It features a premium web dashboard for real-time configuration and seamless deployment capabilities.

## ✨ Features

- **Blazing Fast AI**: Uses Groq's LLaMA 3 70B model for near-instant conversational replies.
- **Premium Web Dashboard**: A glassmorphic Express frontend to manage the bot in real-time.
- **Frontend QR Scanning**: No more broken terminal QR codes! The QR code is streamed directly to the web dashboard as a crisp image.
- **Dynamic Whitelisting**: Add/remove allowed phone numbers on the fly from the dashboard without restarting the bot.
- **Custom Triggers**: Change the trigger keyword (e.g., `@Botty`) dynamically, or leave it blank to reply to everything.
- **MongoDB Persistence**: Saves your configuration permanently to MongoDB.

---

## 💻 Local Development Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   MONGODB_URI=your_mongodb_connection_string (Optional for local testing)
   ```

3. **Start the Bot & Dashboard**
   ```bash
   npm run dev
   ```

4. **Connect WhatsApp**
   - Open your browser and go to **[http://localhost:3000](http://localhost:3000)**.
   - Scan the high-quality QR code displayed on the dashboard using your WhatsApp app.
   - The UI will instantly update to `✅ Connected`!

---

## 🚀 Production Deployment (Railway)

Deploying to Railway is incredibly easy, but you **MUST** configure a Volume to ensure your bot doesn't log you out every time you push an update!

### Step 1: Deploy to Railway
1. Push this repository to GitHub.
2. Go to [Railway.app](https://railway.app), click **New Project** -> **Deploy from GitHub repo**.
3. Select this repository. Railway will automatically detect the `npm run build` and `npm start` scripts in your `package.json`.

### Step 2: Set Environment Variables
In your Railway project, click on your service, go to the **Variables** tab, and add:
- `GROQ_API_KEY`
- `MONGODB_URI` (Use MongoDB Atlas to get a free database URI)

### Step 3: CRITICAL - Add Persistent Storage (Volume)
If you skip this step, Railway will delete your WhatsApp session every time you deploy, forcing you to scan the QR code daily.
1. In your Railway service, go to the **Settings** tab.
2. Scroll down to the **Volumes** section.
3. Click **New Volume** (or Add Volume).
4. Set the **Mount Path** exactly to: `/app/whatsapp-auth`
5. Click **Add**. Railway will automatically trigger a redeploy.

### Step 4: Expose the Frontend Dashboard
1. Still in the **Settings** tab, scroll down to **Public Networking**.
2. Click **Generate Domain**.
3. Railway will give you a public URL (e.g., `https://your-bot-production.up.railway.app`).

### Step 5: Final Login
1. Click your newly generated Railway URL.
2. You will see your beautiful web dashboard and a QR code.
3. Scan the QR code with your phone. 
4. Because you added the Volume in Step 3, **you will never have to scan this QR code again!** 

Enjoy your production-ready WhatsApp AI! 🚀
