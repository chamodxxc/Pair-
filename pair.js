const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
const pino = require('pino');
const { upload } = require('./mega');
const router = express.Router();

const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  Browsers,
  makeCacheableSignalKeyStore
} = require('@whiskeysockets/baileys');

// Remove temp files
function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
  const id = makeid();
  let num = (req.query.number || '').replace(/[^0-9]/g, '');
  const tempPath = `./temp/${id}`;

  if (!fs.existsSync(tempPath)) fs.mkdirSync(tempPath, { recursive: true });

  async function startPairing() {
    const { state, saveCreds } = await useMultiFileAuthState(tempPath);

    try {
      const sock = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
        },
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        syncFullHistory: false,
        browser: Browsers.macOS('Safari'),
        generateHighQualityLinkPreview: true
      });

      if (!sock.authState.creds.registered) {
        await delay(1500);
        try {
          const code = await sock.requestPairingCode(num);
          if (!res.headersSent) {
            return res.json({ status: 'success', number: num, code });
          }
        } catch (err) {
          console.error('❌ Error generating pair code:', err);
          if (!res.headersSent) {
            return res.json({ status: 'error', message: err.message });
          }
        }
      }

      sock.ev.on('creds.update', saveCreds);

      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'open') {
          console.log(`✅ Connected: ${sock.user.id}`);

          const credsFile = `${tempPath}/creds.json`;
          try {
            const megaUrl = await upload(fs.createReadStream(credsFile), `${sock.user.id}.json`);
            const sessionId = 'White-MD~' + megaUrl.replace('https://mega.nz/file/', '');
            await sock.sendMessage(sock.user.id, { text: sessionId });

            const desc = `👋 Hey *WhiteShadow-MD User!*

Your pairing session has been created successfully ✅

🔐 Session ID: Sent above
⚠️ Keep it safe! Do NOT share.

📢 Channel: https://whatsapp.com/channel/0029Vak4dFAHQbSBzyxlGG13
💻 GitHub: https://github.com/cnw-db/WHITESHADOW-MD

> © Powered by WhiteShadow ✨`;

            await sock.sendMessage(sock.user.id, {
              text: desc,
              contextInfo: {
                externalAdReply: {
                  title: 'WHITESHADOW',
                  thumbnailUrl: 'https://files.catbox.moe/8g467d.jpg',
                  sourceUrl: 'https://whatsapp.com/channel/0029Vak4dFAHQbSBzyxlGG13',
                  mediaType: 1,
                  renderLargerThumbnail: true
                }
              }
            });

          } catch (err) {
            console.error('❌ Error uploading session:', err);
          }

          await delay(500);
          sock.ws.close();
          removeFile(tempPath);
          process.exit(0);

        } else if (connection === 'close' && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
          console.log('🔄 Reconnecting...');
          await delay(500);
          startPairing();
        }
      });

    } catch (err) {
      console.error('❌ Fatal error:', err);
      removeFile(tempPath);
      if (!res.headersSent) res.json({ status: 'error', message: 'Service unavailable' });
    }
  }

  startPairing();
});

module.exports = router;
