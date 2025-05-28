const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const OpenAI = require('openai');
const dotenv = require('dotenv')
dotenv.config()

const app = express();
app.use(bodyParser.json());
app.use(cors());

const openai = new OpenAI({
  baseURL: "https://router.huggingface.co/hf-inference/models/sarvamai/sarvam-m/v1",
  apiKey: process.env.HUGGINGFACE_API_TOKEN,
});

const sessionContexts = {};

async function queryChatModel(sessionId, message) {
  if (!sessionContexts[sessionId]) {
    sessionContexts[sessionId] = [];
  }

  const systemPrompt = {
  role: "system",
  content: "Você é um assistente de um site de venda de ingressos. Responda apenas perguntas relacionadas a eventos, ingressos, preços, datas e locais. Se a pergunta não for sobre isso, diga que só responde sobre ingressos."
};

  const messages = [systemPrompt, ...sessionContexts[sessionId], { role: "user", content: message }];


  try {
    const completion = await openai.chat.completions.create({
      model: "sarvamai/sarvam-m",
      messages: messages,
    });

    const botReply = completion.choices[0].message.content;
    sessionContexts[sessionId].push({ role: "user", content: message });
    sessionContexts[sessionId].push({ role: "assistant", content: botReply });

    return botReply;
  } catch (err) {
    console.error("Erro na requisição:", err.response?.data || err.message);
    throw new Error("Erro ao gerar resposta do modelo.");
  }
}

app.post('/chatbot', async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: "sessionId e message são obrigatórios." });
  }

  try {
    const botResponse = await queryChatModel(sessionId, message);
    res.json({ response: botResponse });
  } catch (err) {
    res.status(500).json({ error: "Erro ao processar a mensagem." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
