const { GoogleGenAI } = require('@google/genai');

module.exports = async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/chat') {
    const { message, image, plan } = req.body || {};
    const apiKey = process.env.GEMINI_API_KEY;

    if (!message && !image) {
      return res.status(400).json({ reply: 'يرجى إدخال نص أو إرفاق صورة.' });
    }

    if (!apiKey) {
      return res.status(500).json({ reply: 'خطأ: لم يتم ضبط مفتاح GEMINI_API_KEY في Vercel.' });
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const contents = [];

      if (message) contents.push({ text: message });

      if (image) {
        const base64Data = image.split(',')[1] || image;
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';
        contents.push({
          inlineData: { data: base64Data, mimeType: mimeType }
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: `أنت مساعد OmniFix AI الذكي. الباقة الحالية للمستخدم هي: ${plan || 'الباقة العادية'}. أجب على كافة الأسئلة بدقة عالية واكتب الكود واشرحه وتحليل الصور عند إرفاقها.`
        }
      });

      return res.status(200).json({ reply: response.text || 'لم يتم استلام رد.' });
    } catch (error) {
      return res.status(500).json({ reply: 'خطأ بالسيرفر: ' + (error.message || 'خطأ غير معروف') });
    }
  }

  return res.status(404).json({ error: 'Not Found' });
};
