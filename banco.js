import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

async function getDB() {
    return open({
        filename: "./usuario.db",
        driver: sqlite3.Database
    });
}

async function initDB() {
    const db = await getDB();

    await db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            pontos INTEGER,
            pontomax INTEGER DEFAULT 0
        )
    `);

    console.log("Banco pronto");
}
initDB();

app.post("/usuario", async (req, res) => {
    let { nome, pontos } = req.body;

    nome = nome.trim().toLowerCase();

    const db = await getDB();

    let existente = await db.get(
        "SELECT * FROM usuarios WHERE nome = ?",
        [nome]
    );

    if (existente) {
        let novoMax = Math.max(pontos, existente.pontomax);

        await db.run(
            `UPDATE usuarios SET pontos = ?, pontomax = ? WHERE nome = ?`,
            [pontos, novoMax, nome]
        );
    } else {
        await db.run(
            `INSERT INTO usuarios (nome, pontos, pontomax) VALUES (?, ?, ?)`,
            [nome, pontos, pontos]
        );
    }

    res.json({ ok: true });
});

app.get("/ranking", async (req, res) => {
    const db = await getDB();

    const usuarios = await db.all(`
        SELECT nome, pontomax
        FROM usuarios
        ORDER BY pontomax DESC
        LIMIT 10
    `);

    res.json(usuarios);
});

app.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});