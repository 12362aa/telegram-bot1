const express = require('express');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const yts = require('yt-search');

const app = express();

const token = '8079087672:AAG0t46XXr621i9iba58DMoJXjJ4xisheNA';
const rapidApiKey = '27ff9a9f1dmsh2b1e995dd198c4cp19d0e9jsnf0bdd9f2c247';

const bot = new TelegramBot(token, { polling: true });

let lastMusicUrl = null;

// /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, `👋 مرحبًا ${msg.from.first_name}،

🎶 يمكنك إرسال:
- رابط فيديو تيك توك لتحميله بدون علامة مائية.
- /song اسم الأغنية لتحميلها MP3.
- /audio لاستخراج الصوت من آخر فيديو تيك توك.`);
});

// /الاوامر
bot.onText(/\/الاوامر/, (msg) => {
  bot.sendMessage(msg.chat.id, `🛠️ الأوامر:
- إرسال رابط تيك توك = تحميل الفيديو بدون علامة مائية.
- /song اسم الأغنية = تحميل MP3.
- /audio = استخراج الصوت من آخر فيديو تيك توك.`);
});

// تحميل تيك توك
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text || !text.includes('tiktok.com')) return;

  bot.sendMessage(chatId, '⏳ جاري التحميل بدون علامة مائية...');

  try {
    const apiUrl = `https://tikwm.com/api/?url=${encodeURIComponent(text)}`;
    const response = await axios.get(apiUrl);

    const videoUrl = response.data.data.play;
    const musicUrl = response.data.data.music;
    const desc = response.data.data.title;

    lastMusicUrl = musicUrl;

    await bot.sendMessage(chatId, `✅ تم جلب الفيديو: ${desc}`);
    await bot.sendVideo(chatId, videoUrl, { caption: '📥 تم التحميل بواسطة Gojo TikTok Bot' });

  } catch (error) {
    console.error(error);
    bot.sendMessage(chatId, '❌ حدث خطأ أثناء التحميل، تأكد من الرابط.');
  }
});

// /audio
bot.onText(/\/audio/, async (msg) => {
  const chatId = msg.chat.id;
  if (lastMusicUrl) {
    await bot.sendAudio(chatId, lastMusicUrl, { caption: '🎵 الصوت المستخرج من فيديو تيك توك.' });
    lastMusicUrl = null;
  } else {
    bot.sendMessage(chatId, '❌ لم يتم تحميل فيديو تيك توك بعد.');
  }
});

// /song
bot.onText(/\/song (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const query = match[1];

  try {
    await bot.sendMessage(chatId, `🔍 جاري البحث عن: ${query}`);

    const results = await yts(query);
    if (!results.videos || results.videos.length === 0) {
      await bot.sendMessage(chatId, '❌ لم يتم العثور على نتائج للأغنية.');
      return;
    }

    const firstResult = results.videos[0];
    const videoId = firstResult.videoId;
    const title = firstResult.title;

    const downloadUrl = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;
    const dlResponse = await axios.get(downloadUrl, {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'youtube-mp36.p.rapidapi.com'
      }
    });

    if (dlResponse.data.link) {
      await bot.sendAudio(chatId, dlResponse.data.link, { caption: `🎶 ${title}` });
    } else {
      await bot.sendMessage(chatId, '❌ لم يتم العثور على رابط التحميل.');
    }
  } catch (error) {
    console.error(error.response?.data || error.message);
    bot.sendMessage(chatId, '❌ حدث خطأ أثناء البحث أو التحميل.');
  }
});

// ===== Keep Alive =====

app.get('/', (req, res) => res.send('Bot is alive!'));
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Keep Alive Server Running on port ${PORT}`));

// Ping self every 5 minutes to keep repl awake
setInterval(() => {
  axios.get(`http://localhost:${PORT}/`).then(() => {
    console.log('Pinged self to stay awake');
  }).catch((err) => {
    console.error('Error pinging self:', err.message);
  });
}, 5 * 60 * 1000);





