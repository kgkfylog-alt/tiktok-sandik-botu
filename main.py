import asyncio
import aiohttp
from TikTokLive import TikTokLiveClient
from TikTokLive.types.events import EnvelopeEvent, LiveEndEvent

TELEGRAM_BOT_TOKEN = "8657579740:AAH_zx_rfHy-56giG7dAhPTSLUbg2frnCrQ"
TELEGRAM_CHAT_ID = "-1003885963805"

async def telegrama_gonder(mesaj):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {"chat_id": TELEGRAM_CHAT_ID, "text": mesaj, "parse_mode": "HTML"}
    async with aiohttp.ClientSession() as session:
        try:
            async with session.post(url, json=payload) as response:
                pass
        except Exception as e:
            print(f"Hata: {e}")

async def kesif_yayinlarini_bul():
    yayinlar = set()
    url = "https://www.tiktok.com/api/live/room/recommend/?aid=1988"
    async with aiohttp.ClientSession() as session:
        try:
            async with session.get(url, timeout=5) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    room_list = data.get("data", {}).get("data", [])
                    for room in room_list:
                        owner = room.get("owner", {}).get("display_id")
                        if owner:
                            yayinlar.add(f"@{owner}")
        except Exception:
            pass
    return list(yayinlar)

async def yayini_izle(kullanici_adi):
    client: TikTokLiveClient = TikTokLiveClient(unique_id=kullanici_adi)

    @client.on("envelope")
    async def on_treasure_chest(event: EnvelopeEvent):
        toplam_jeton = getattr(event, 'coins', 0)
        kisi_sayisi = 16  
        ortalama_verim = toplam_jeton / kisi_sayisi if kisi_sayisi > 0 else 0

        if ortalama_verim >= 2.5:
            mesaj = (
                f"👀Gönderen;{getattr(event, 'uniqueId', 'XxXxXxXx')}\n"
                f"🪙Jeton;{toplam_jeton}\n"
                f"👀İzleyici;{getattr(event, 'viewer_count', '000')}\n"
                f"📊Oran;{ortalama_verim:.2f}\n"
                f"Kalan Süre;00:00:59\n"
                f"Link;https://www.tiktok.com/@{kullanici_adi}/live"
            )
            await telegrama_gonder(mesaj)

    @client.on("live_end")
    async def on_live_end(event: LiveEndEvent):
        client.stop()

    try:
        await client.start()
    except Exception:
        pass

async def main():
    while True:
        aktif_yayinlar = await kesif_yayinlarini_bul()
        if aktif_yayinlar:
            tasks = [yayini_izle(yayinci) for yayinci in aktif_yayinlar[:20]]
            await asyncio.gather(*tasks)
        await asyncio.sleep(2)

if __name__ == '__main__':
    asyncio.run(main())
          
