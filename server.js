const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const sessionContexts = {};

// Função para o chatbot de ingressos
async function queryChatModel(sessionId, message) {
  if (!sessionContexts[sessionId]) {
    sessionContexts[sessionId] = [];
  }

  const systemPrompt = {
    role: "system",
    content: "Você é um assistente brasileiro de um site de venda de ingressos. Responda APENAS em português do Brasil, com linguagem natural e informal. Responda exclusivamente sobre: eventos, ingressos, preços, datas e locais. Se a pergunta não for sobre isso, responda: 'Desculpe, só posso ajudar com informações sobre ingressos e eventos."
  };

  const messages = [systemPrompt, ...sessionContexts[sessionId], { role: "user", content: message }];

  try {
    const response = await axios.post(
      "https://router.huggingface.co/hf-inference/models/sarvamai/sarvam-m/v1",
      {
        model: "sarvamai/sarvam-m",
        messages: messages
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const botReply = response.data.choices?.[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";
    sessionContexts[sessionId].push({ role: "user", content: message });
    sessionContexts[sessionId].push({ role: "assistant", content: botReply });

    return botReply;
  } catch (err) {
    console.error("Erro na requisição:", err.response?.data || err.message);
    throw new Error("Erro ao gerar resposta do modelo.");
  }
}

// 🆕 Nova função para question_answering
async function questionAnswering(question, context) {
  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2",
      {
        inputs: {
          question: question,
          context: context
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.answer;
  } catch (err) {
    console.error("Erro no question_answering:", err.response?.data || err.message);
    throw new Error("Erro ao processar a pergunta.");
  }
}

// Rota principal do chatbot
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

// 🆕 Nova rota para question_answering
app.post('/qa', async (req, res) => {
  const { question, context } = req.body;

  if (!question || !context) {
    return res.status(400).json({ error: "question e context são obrigatórios." });
  }

  try {
    const answer = await questionAnswering(question, context);
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: "Erro ao processar a pergunta." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
