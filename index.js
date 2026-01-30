import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

let lastAudio = null;

app.get("/audio", (req, res) => {
  if (!lastAudio) return res.status(404).send("No audio");
  res.set("Content-Type", "audio/mpeg");
  res.send(lastAudio);
});

// 1️⃣ první krok – vyzveme k mluvení a nahrajeme hlas
app.post("/voice", (req, res) => {
  res.type("text/xml");
  res.send(`
<Response>
  <Say language="cs-CZ">
    Prosím, řekněte svůj požadavek po zaznění tónu.
  </Say>
  <Record
    timeout="5"
    maxLength="10"
    action="/process"
    method="POST"
  />
</Response>
`);
});

// 2️⃣ Twilio pošle nahrávku sem
app.post("/process", async (req, res) => {
  try {
    const recordingUrl = req.body.RecordingUrl + ".wav";

    // stáhneme audio
    const audioRes = await fetch(recordingUrl);
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    // pošleme do OpenAI (STT)
    const sttRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: (() => {
        const form = new FormData();
        form.append("file", audioBuffer, "speech.wav");
        form.append("model", "gpt-4o-transcribe");
        form.append("language", "cs");
        return form;
      })()
    });

    const result = await sttRes.json();
    console.log("STT TEXT:", result.text);

    res.type("text/xml");
    res.send(`
<Response>
  <Say language="cs-CZ">
    Děkuji, zaznamenala jsem váš požadavek.
  </Say>
</Response>
`);
  } catch (err) {
    console.error("STT ERROR:", err.message);
    res.type("text/xml");
    res.send(`
<Response>
  <Say language="cs-CZ">
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
app.listen(port, () => console.log("Server běží"));
