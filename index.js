import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

let lastAudio = null;

app.get("/audio", (req, res) => {
  if (!lastAudio) {
    return res.status(404).send("No audio");
  }
  res.set("Content-Type", "audio/mpeg");
  res.send(lastAudio);
});

app.post("/voice", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY missing");
    }

    const text =
      "Dobrý den, tady je automatická recepce. Prosím, řekněte svůj požadavek.";

    const openaiRes = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: "alloy",
        input: text
      })
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      throw new Error("OpenAI error: " + errText);
    }

    lastAudio = Buffer.from(await openaiRes.arrayBuffer());

    res.type("text/xml");
    res.send(`
<Response>
  <Play>https://${req.headers.host}/audio</Play>
</Response>
`);
  } catch (err) {
    console.error("VOICE ERROR:", err.message);

    // ⛑️ ZÁCHRANNÁ ODPOVĚĎ – TWILIO NIKDY NESPADNE
    res.type("text/xml");
    res.send(`
<Response>
  <Say language="cs-CZ">
    Omlouváme se, systém je dočasně nedostupný. Zkuste to prosím později.
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
