const { makeid } = require('./gen-id');
const express = require('express');
const fs = require('fs');
let router = express.Router();
const pino = require("pino");
const { default: makeWASocket, useMultiFileAuthState, delay, Browsers, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const { upload } = require('./mega');

function removeFile(FilePath) {
    if (!fs.existsSync(FilePath)) return false;
    fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get('/', async (req, res) => {
    const id = makeid();
    let num = req.query.number;

    async function WHITESHADOW_PAIR_CODE() {
        const { state, saveCreds } = await useMultiFileAuthState('./temp/' + id);
        try {
            const items = ["Safari"];
            function selectRandomItem(array) {
                const randomIndex = Math.floor(Math.random() * array.length);
                return array[randomIndex];
            }
            const randomItem = selectRandomItem(items);

            let sock = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                printQRInTerminal: false,
                generateHighQualityLinkPreview: true,
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                syncFullHistory: false,
                browser: Browsers.macOS(randomItem)
            });

            // --- CUSTOM PAIRING CODE ---
            if (!sock.authState.creds.registered) {
                await delay(1500);
                num = num.replace(/[^0-9]/g, '');
                const customCode = "MRCHAMOD"; // Fixed 8-character pairing code
                const code = await sock.requestPairingCode(num, customCode);
                if (!res.headersSent) {
                    await res.send({ code });
                }
            }

            sock.ev.on('creds.update', saveCreds);

            sock.ev.on("connection.update", async (s) => {
                const { connection, lastDisconnect } = s;

                if (connection === "open") {
                    await delay(5000);
                    const rf = __dirname + `/temp/${id}/creds.json`;

                    try {
                        const mega_url = await upload(fs.createReadStream(rf), `${sock.user.id}.json`);
                        const string_session = mega_url.replace('https://mega.nz/file/', '');
                        const md = "White-MD~" + string_session;

                        const codeMsg = await sock.sendMessage(sock.user.id, { text: md });

                        const desc = `*Hey there, WHITESHADOW-M User!* 👋🏻

Thanks for using WHITESHADOW-MD — your session has been successfully created!

🔐 Session ID: Sent above
⚠️ Keep it safe! Do NOT share this ID with anyone.

——————

✅ Stay Updated:
Join our official WhatsApp Channel:
https://whatsapp.com/channel/0029Vak4dFAHQbSBzyxlGG13

💻 Source Code:
Fork & explore the project on GitHub:
https://github.com/cnw-db/WHITESHADOW-MD

——————

> © Powered by WHITESHADOW
Stay WITH US. ✌🏻`;

                        await sock.sendMessage(sock.user.id, {
                            text: desc,
                            contextInfo: {
                                externalAdReply: {
                                    title: "WHITESHADOW",
                                    thumbnailUrl: "https://files.catbox.moe/8g467d.jpg",
                                    sourceUrl: "https://whatsapp.com/channel/0029Vak4dFAHQbSBzyxlGG13",
                                    mediaType: 1,
                                    renderLargerThumbnail: true
                                }
                            }
                        }, { quoted: codeMsg });

                    } catch (e) {
                        console.log("Error sending session:", e);
                        if (!res.headersSent) {
                            await res.send({ code: "❗ Service Unavailable" });
                        }
                    }

                    await delay(10);
                    await sock.ws.close();
                    await removeFile('./temp/' + id);

                    console.log(`👤 ${sock.user.id} 𝗖𝗼𝗻𝗻𝗲𝗰𝘁𝗲𝗱 ✅ 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗶𝗻𝗴 𝗽𝗿𝗼𝗰𝗲𝘀𝘀...`);
                    await delay(10);
                    process.exit();
                } else if (connection === "close" && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode != 401) {
                    await delay(10);
                    WHITESHADOW_PAIR_CODE();
                }
            });
        } catch (err) {
            console.log("Service restarted due to error:", err);
            await removeFile('./temp/' + id);
            if (!res.headersSent) {
                await res.send({ code: "❗ Service Unavailable" });
            }
        }
    }

    return await WHITESHADOW_PAIR_CODE();
});

module.exports = router;
