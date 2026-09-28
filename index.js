const express = require('express');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();

// زيادة حد حجم البيانات لاستقبال الصور بصيغة Base64
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const apiKey = process.env.GEMINI_API_KEY;

app.post('/api/chat', async (req, res) => {
  const { message, image, plan } = req.body;

  if (!message && !image) {
    return res.status(400).json({ reply: 'يرجى إدخال نص أو إرفاق صورة.' });
  }

  if (!apiKey) {
    return res.status(500).json({ reply: 'خطأ: لم يتم ضبط مفتاح GEMINI_API_KEY في Vercel.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const contents = [];

    // إضافة نص الرسالة
    if (message) {
      contents.push({ text: message });
    }

    // إضافة الصورة إذا كانت مريفقاً بها Base64
    if (image) {
      const base64Data = image.split(',')[1] || image;
      const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

      contents.push({
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: `أنت مساعد OmniFix AI الذكي. الباقة الحالية للمستخدم هي: ${plan || 'الباقة العادية'}. أجب على كافة الأسئلة بدقة عالية واكتب الكود واشرحه وتحليل الصور عند إرفاقها. يُمنع منعاً باتاً توليد أو إنشاء الصور والفيديوهات، واعتذر بلباقة بأسلوب محترف إذا طلب المستخدم ذلك.`
      }
    });

    const aiReply = response.text || 'لم يتم استلام رد من الذكاء الاصطناعي.';
    res.json({ reply: aiReply });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ reply: 'خطأ بالسيرفر: ' + (error.message || 'خطأ غير معروف') });
  }
});

// توجيه باقي المسارات لصفحة index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(3000, () => console.log('OmniFix AI Running on http://localhost:3000'));
    }
          
