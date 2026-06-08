import express from "express";
import Database from "better-sqlite3";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const db = new Database("usuario.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT UNIQUE,
    pontos INTEGER,
    pontomax INTEGER DEFAULT 0
)
`).run();

app.post("/usuario", (req, res) => {
    let { nome, pontos } = req.body;
    nome = nome.trim().toLowerCase();

    const existente = db.prepare(
        "SELECT * FROM usuarios WHERE nome = ?"
    ).get(nome);

    if (existente) {
        const novoMax = Math.max(pontos, existente.pontomax);

        db.prepare(`
            UPDATE usuarios
            SET pontos = ?, pontomax = ?
            WHERE nome = ?
        `).run(pontos, novoMax, nome);

    } else {
        db.prepare(`
            INSERT INTO usuarios (nome, pontos, pontomax)
            VALUES (?, ?, ?)
        `).run(nome, pontos, pontos);
    }

    res.json({ ok: true });
});

app.get("/ranking", (req, res) => {
    const usuarios = db.prepare(`
        SELECT nome, pontomax
        FROM usuarios
        ORDER BY pontomax DESC
        LIMIT 10
    `).all();

    res.json(usuarios);
});

app.listen(3000, () => {
    console.log("Servidor rodando");
});