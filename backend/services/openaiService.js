const fetch = require('node-fetch');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set. Please add it to your environment.');
}

async function generateOpenAIResponse(userMessage) {
  const apiUrl = 'https://api.openai.com/v1/chat/completions';
  const body = {
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are Smart Spidy, a helpful assistant.' },
      { role: 'user', content: userMessage }
    ],
    max_tokens: 256,
    temperature: 0.7
  };

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

module.exports = { generateOpenAIResponse }; 