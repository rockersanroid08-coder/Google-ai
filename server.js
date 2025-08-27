const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Gemini API Backend is running!',
    available_models: ['gemini-pro', 'gemini-1.0-pro', 'gemini-1.5-flash']
  });
});

// List available models endpoint
app.get('/api/models', async (req, res) => {
  try {
    const models = await genAI.listModels();
    const modelNames = models.models.map(model => model.name);
    res.json({ models: modelNames });
  } catch (error) {
    console.error('Error listing models:', error);
    res.status(500).json({ error: 'Failed to list models: ' + error.message });
  }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, modelName = 'gemini-pro' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Try different model names if the default fails
    let model;
    try {
      model = genAI.getGenerativeModel({ model: modelName });
    } catch (modelError) {
      console.log(`Model ${modelName} not found, trying gemini-1.0-pro`);
      model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
    }
    
    // Generate content
    const result = await model.generateContent(message);
    const response = await result.response;
    const text = response.text();
    
    res.json({ response: text });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
