// server2.js  

require('dotenv').config(); // Loads .env contents into process.env  

const express = require('express');  
const multer = require('multer');  
const fs = require('fs');  
const cors = require('cors');  
const OpenAI = require('openai');  

const app = express();  
const upload = multer({ dest: 'uploads/' }); // Uploaded audio files go here, temporary  

const openai = new OpenAI({  
  apiKey: process.env.OPENAI_API_KEY, // Loads from your .env file  
});  

app.use(cors()); // Allows any frontend to access (dev only; restrict for production!)  

app.post('/transcribe', upload.single('file'), async (req, res) => {  
  try {  
    const filePath = req.file.path;  
    const fileName = req.file.originalname;
    const fileMime = req.file.mimetype;

    const audioBuffer = fs.readFileSync(filePath);

    fs.unlinkSync(filePath); // Delete temp file after processing

    console.log('File:', req.file);

    // Send the file to OpenAI Whisper API for transcription  
    const transcription = await openai.audio.transcriptions.create({  
      file: [audioBuffer, fileName, fileMime], 
      model: "gpt-4o-mini-transcribe",
      response_format: "text", // or "json"  
    });  

    // Return the transcript (with fallback, in case .text is missing)  
    res.json({ transcript: transcription.text || transcription });  

  } catch (err) {  
    res.status(500).json({ error: err.toString() });  
  }  
});  

app.listen(4000, () => {  
  console.log('Whisper backend running on port 4000');  
});  