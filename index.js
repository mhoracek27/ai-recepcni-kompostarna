import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/voice", async (req, res) => {
  const text =
    "Dobrý den, tady je automatická recepce. Prosím, řekněte svůj požadavek.";

  // Zavoláme OpenAI – text → hlas
  const audioResponse = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "alloy",
      input: text
    })
  });

  const audioBuffer = Buffer.from(await audioResponse.arrayBuffer());

  // Twilio odpověď: přehraj audio
  const twiml = `
<Response>
  <Play>data:audio/mp3;base64,${audioBuffer.toString("base64")}</Play>
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
