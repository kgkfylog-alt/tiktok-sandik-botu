const puppeteer = require('puppeteer');
const axios = require('axios');

const telegramToken = "8657579740:AAH_zx_rfHy-56giG7dAhPTSLUbg2frnCrQ";
const chatId = "-1003885963805";

async function tg(mesaj) {
    try {
        await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
            chat_id: chatId,
            text: mesaj,
            parse_mode: 'Markdown'
        }, { timeout: 10000 });
    } catch (e) {}
}

function bekle(sn) {
    return new Promise(r => setTimeout(r, sn * 1000));
}

async function calis() {
    console.log("🚀 [GİTHUB KEŞİF MODU] Casus ordu TikTok canlı yayın ana sayfasına sızıyor kanka!");

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new",
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled'
            ]
        });
    } catch (err) {
        console.log("❌ Tarayıcı başlatılamadı:", err.message);
        return;
    }

    let page;
    let hedefDizi = [];

    try {
        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
        await page.setViewport({ width: 1366, height: 768 });
        
        // TikTok canlı yayın keşif sayfasına gidiyoruz kanka!
        console.log("🌍 Keşif sayfası taranıyor...");
        await page.goto('https://www.tiktok.com/live', {
            waitUntil: 'domcontentloaded',
            timeout: 25000
        });

        await bekle(5);

        // Sayfayı biraz aşağı kaydırıp daha çok yayıncı yükleyelim
        await page.evaluate(async () => {
            window.scrollBy(0, 1000);
            await new Promise(resolve => setTimeout(resolve, 2000));
        });

        // Sayfadaki canlı yayın kullanıcı adlarını otomatik çekiyoruz kanka
        hedefDizi = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a[href*="/live/"]'));
            let usernames = new Set();
            
            links.forEach(a => {
                const href = a.getAttribute('href');
                // URL'den kullanıcı adını ayıkla örn: /@kullaniciadi/live
                const match = href.match(/\/@([^\/]+)\/live/);
                if (match && match[1]) {
                    usernames.add(match[1]);
                }
            });

            return Array.from(usernames).slice(0, 15); // İlk 15 yayını hedef alalım ki hızlı tarasın
        });

        await page.close();
    } catch (e) {
        console.log("❌ Keşif sayfası taranamadı:", e.message);
        if (page) try { await page.close(); } catch(err){}
    }

    console.log(`🎯 Keşfedilen hedef yayıncı sayısı: ${hedefDizi.length}`);

    if (hedefDizi.length === 0) {
        console.log("⚠️ Hedef bulunamadı, tur sonlandırılıyor.");
        if (browser) await browser.close();
        return;
    }

    let onlineYayinlar = [];
    let offlineYayinlar = [];
    let bildirimiGonderilenler = new Set();

    for (let i = 0; i < hedefDizi.length; i++) {
        let user = hedefDizi[i];
        let p;
        try {
            p = await browser.newPage();
            await p.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
            await p.setViewport({ width: 1366, height: 768 });
            
            await p.goto(`https://www.tiktok.com/@${user}/live`, {
                waitUntil: 'domcontentloaded',
                timeout: 15000
            });

            await bekle(3);

            const durum = await p.evaluate(() => {
                const bodyText = document.body.innerText.toLowerCase();
                const kapaliMi = bodyText.includes('yayın sona erdi') || bodyText.includes('offline') || bodyText.includes('bu kullanıcı canlı yayın yapmıyor');
                const videoVar = document.querySelector('video') !== null || bodyText.includes('izleyici') || bodyText.includes('viewer');
                
                let isOnline = !kapaliMi && videoVar;
                let sandikVar = bodyText.includes('sandık') || bodyText.includes('treasure') || bodyText.includes('kutu') || bodyText.includes('chest');
                
                let izleyici = 50;
                try {
                    const m = bodyText.match(/([0-9]+)\s*(?:izleyici|viewer)/i);
                    if (m) izleyici = parseInt(m[1]);
                } catch(e){}

                return { isOnline, sandikVar, izleyici };
            });

            if (durum.isOnline) {
                onlineYayinlar.push(user);
                if (durum.sandikVar) {
                    const bildirimKey = `${user}_sandik`;
                    if (!bildirimiGonderilenler.has(bildirimKey)) {
                        bildirimiGonderilenler.add(bildirimKey);
                        const oran = durum.izleyici > 0 ? (100 / durum.izleyici).toFixed(2) : '0.00';
                        await tg(`💎 **KEŞİFTEN KRAL SANDIK YAKALANDI!** 💎\n\n` +
                                  `🌍 Yayıncı: \`${user}\`\n` +
                                  `👀 İzleyici: \`${durum.izleyici}\`\n` +
                                  `📊 Oran: \`${oran} Jeton/Kişi\`\n` +
                                  `🔗 Link: https://www.tiktok.com/@${user}/live`);
                    }
                }
            } else {
                offlineYayinlar.push(user);
            }

            await p.close();
        } catch (e) {
            offlineYayinlar.push(user);
            if (p) try { await p.close(); } catch(err){}
        }
        await bekle(1);
    }

    await browser.close();

    // İstediğin o net sistem raporu formatı kanka!
    const rapor = `⚙️Sistem Raporu:\n` +
                  `Toplam Yayıncı:${hedefDizi.length}\n` +
                  `🟢Online Yayıncı:${onlineYayinlar.length}\n` +
                  `🔴Offline Yayıncı:${offlineYayinlar.length}`;

    await tg(rapor);
    console.log("📋 Keşif sistem raporu başarıyla fırlatıldı kanka!");
}

calis();
