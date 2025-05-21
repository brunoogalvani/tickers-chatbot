const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const HUGGINGFACE_API_TOKEN = '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';
const HUGGINGFACE_API_URL = 'https://api-inference.huggingface.co/models/mistralai/mistral-7b-instruct-v0.1';

const sessionContexts = {};

async function queryHuggingFace(prompt) {
    try {
        const response = await axios.post(
            HUGGINGFACE_API_URL,
            { inputs: prompt },
            {
                headers: {
                    Authorization: `Bearer ${HUGGINGFACE_API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                timeout: 60000
            }
        );

        const result = response.data;

        if (Array.isArray(result)) {
            return result[0].generated_text;
        } else if (typeof result.generated_text === 'string') {
            return result.generated_text;
        } else if (typeof result === 'string') {
            return result;
        } else {
            console.error('Resposta inesperada:', result);
            return "Desculpe, não consegui entender.";
        }

    } catch (err) {
        console.error('Erro ao consultar Hugging Face:', err.response ? err.response.data : err.message);
        throw new Error('Erro na API Hugging Face');
    }
}

app.post('/chatbot', async (req, res) => {
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
        return res.status(400).json({ error: "sessionId e message são obrigatórios." });
    }

    if (!sessionContexts[sessionId]) {
        sessionContexts[sessionId] = [];
    }

    const history = sessionContexts[sessionId];

    const promptParts = history.join('\n');
    const prompt = `${promptParts}\nUsuário: ${message}\nBot:`;

    try {
        const botResponse = await queryHuggingFace(prompt);

        history.push(`Usuário: ${message}`);
        history.push(`Bot: ${botResponse}`);

        res.json({ response: botResponse });
    } catch (err) {
        res.status(500).json({ error: "Erro ao processar a mensagem." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));