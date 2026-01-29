import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

app.post("/voice", (req, res) => {
  const response = `
<Response>
  <Say language="cs-CZ">
    Dobrý den, tady je automatická recepce. Prosím, řekněte svůj požadavek.
  </Say>
</Response>
`;
  res.type("text/xml");
  res.send(response);
});

app.get("/", (req, res) => {
  res.send("AI recepční běží");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server běží na portu " + port);
});
