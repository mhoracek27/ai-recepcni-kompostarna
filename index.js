import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

let lastAudio = null;

// endpoint pro přehrání audia
app.get("/audio", (req, res) => {
  if (!lastAudio) {
    return res.status(404).send("No audio");
  }
  res.set("Content-Type", "audio/mpeg");
  res.send(lastAudio);
});

// hovor
app.post("/voice", async (req, res) => {
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

  const buffer = Buffer.from(await openaiRes.arrayBuffer());
  lastAudio = buffer;

  const twiml = `
<Response>
  <Play>https://${req.headers.host}/audio</Play>
</Response>
`;

  res.type("text/xml");
  res.send(twiml);
});

app.get("/", (req, res) => {
  res.send("AI recepční běží");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server běží na portu " + port);
});
