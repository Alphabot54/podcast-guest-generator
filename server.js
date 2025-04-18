import express from "express";
import { config } from "dotenv";
import { OpenAI } from "openai";
import path from "path";
import { fileURLToPath } from "url";

config();

const app = express();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render('index', { guests: null });
});

app.post("/", async (req, res) => {
  const description = req.body.description;

  const prompt = `
  Based on this podcast description: "${description}", suggest 5 potential guests.
  Format the response as an array of JSON objects like:
  [
    { "name": "Guest Name", "description": "Why they're a good fit" },
    ...
  ]
  `;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that returns structured JSON." },
        { role: "user", content: prompt }
      ],
    });

    const output = response.choices[0].message.content;

    let guests;
    try {
      guests = JSON.parse(output);
    } catch (err) {
      guests = [{ name: "Error", description: "Could not parse guest list. Try rewording your input." }];
    }

    res.render("index", { guests });
  } catch (err) {
    console.error(err);
    res.render("index", {
      guests: [{ name: "Error", description: "Something went wrong with the OpenAI API." }]
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});