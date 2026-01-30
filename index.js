import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import fs from "fs";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 1️⃣ vyzveme volajícího + nahrajeme hlas
app.post("/voice", (req, res) => {
  res.type("text/xml");
  res.send(`
<Response>
  <Say>
    Please say your request after the tone.
  </Say>
  <Record
    timeout="5"
    maxLength="15"
    action="/process"
    method="POST"
  />
</Response>
`);
});

// 2️⃣ po nahrání pošleme audio do OpenAI STT
app.post("/process", async (req, res) => {
  try {
    const recordingUrl = req.body.RecordingUrl + ".wav";

    // stáhneme audio z Twilia
    const audioRes = await fetch(recordingUrl, {
  headers: {
    Authorization:
      "Basic " +
      Buffer.from(
        process.env.TWILIO_ACCOUNT_SID + ":" + process.env.TWILIO_AUTH_TOKEN
      ).toString("base64")
  }
});

    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    // uložíme do dočasného souboru
    const filePath = "/tmp/recording.wav";
    fs.writeFileSync(filePath, audioBuffer);

    // OpenAI STT
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "whisper-1",
      language: "cs"
    });

    console.log("OPENAI STT TEXT:", transcription.text);

    res.type("text/xml");
    res.send(`
<Response>
  <Say>
    Thank you. Your request has been recorded.
  </Say>
</Response>
`);
  } catch (err) {
    console.error("STT ERROR FULL:", err);

    res.type("text/xml");
    res.send(`
<Response>
  <Say>
    Sorry, the request could not be processed.
  </Say>
</Response>
`);
  }
});

app.get("/", (req, res) => {
  res.send("AI recepční běží");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server běží na portu " + port);
});
