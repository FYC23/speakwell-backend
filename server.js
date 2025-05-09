// server.js  

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
app.use('/uploads', express.static('uploads'));  // Serve static files from the uploads directory

const ffmpeg = require('fluent-ffmpeg');  

app.post('/transcribe', upload.single('file'), async (req, res) => {  
  try {  
    const filePath = req.file.path;  
    // const fileName = req.file.originalname;

    const outPath = filePath + '.wav'

    // use ffmpeg to convert the audio file to wav format (PCM 16kHz mono)
    await new Promise((resolve, reject) => {
      ffmpeg(filePath)
      .outputOptions([
        '-ar 16000',
        '-ac 1',
        '-f wav'
      ])
      .on('end', resolve)
      .on('error', reject)
      .save(outPath);
    });

    const wavStream = fs.createReadStream(outPath); 
    wavStream.name = req.file.originalname.replace(/\.[^/.]+$/, ".wav");

    // const fileStream = fs.createReadStream(filePath);
    // fileStream.name = fileName;

    console.log('File:', req.file);
    console.log('Uploaded file info:', req.file); 

    // Send the file to OpenAI Whisper API for transcription  
    const transcription = await openai.audio.transcriptions.create({  
      // file: fileStream, 
      file: wavStream,
      model: "whisper-1",  
      // model: "gpt-4o-mini-transcribe",
      // model: "gpt-4o-transcribe",
      // prompt: "The following voice recording comes from a benchmarking text for a stuttering person, and will likely contain stuttering. Make sure to transcribe as close to verbatim as possible (e.g., if the user says \'ch ch child\', then you should transcribe it as such).",
      response_format: "text", // or "json"  
    });  

    fs.unlinkSync(filePath); // Delete temp file after processing  
    fs.unlinkSync(outPath); // Delete temp file after processing

    // Return the transcript (with fallback, in case .text is missing)  
    res.json({ transcript: transcription.text || transcription });  

  } catch (err) {  
    res.status(500).json({ error: err.toString() });  
  }  
});  

app.listen(4000, () => {  
  console.log('Whisper backend running on port 4000');  
});  