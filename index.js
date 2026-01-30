import express from "express";

const app = express();

app.post("/voice", (req, res) => {
  res.type("text/xml");
  res.send(`
<Response>
  <Say>
    Server běží. Test úspěšný.
  </Say>
</Response>
`);
});

app.get("/", (req, res) => {
  res.send("OK");
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Server běží na portu " + port);
});
