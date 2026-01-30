import express from "express";
import bodyParser from "body-parser";
import OpenAI from "openai";
import fs from "fs";
import path from "path";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 1️⃣ vyzveme k mluvení + nahrajeme hlas
app.post("/voice", (req, res) => {
  res.type("text/xml");
  res.send(`
<Response>
  <Say>
    Prosím, řekněte svůj požadavek po zaznění tónu.
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

// 2️⃣ zpracujeme nahrávku přes OpenAI STT
app.post("/process", async (req, res) => {
  try {
    const recordingUrl = req.body.RecordingUrl + ".wav";

    // stáhneme audio z Twilia
    const audioRes = await fetch(recordingUrl);
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    // uložíme do dočasného souboru
    const filePath = "/tmp/recording.wav";
    fs.writeFileSync(filePath, audioBuffer);

    // pošleme do OpenAI STT
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: "gpt-4o-transcribe",
      language: "cs"
    });

    console.log("OPENAI STT TEXT:", transcription.text);

    res.type("text/xml");
    res.send(`
<Response>
  <Say>
    Děkuji, zaznamenala jsem váš požadavek.
  </Say>
</Response>
`);
  } catch (err) {
    console.error("OPENAI STT ERROR:", err);

    res.type("text/xml");
    res.send(`
<Response>
  <Say>
    Omlouváme se, požadavek se nepodařilo zpracovat.
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
