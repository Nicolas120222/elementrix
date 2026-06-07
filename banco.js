import express from 'express';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import cors from 'cors';

const app = express();
app.use(express.json());
app.use(cors());

async function getDB(){
    return open({
        filename: './usuario.db',
        driver: sqlite3.Database
    });
}

async function initDB(){
    const db = await getDB();

    await db.run(`
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT UNIQUE,
            pontos INTEGER,
            pontomax INTEGER DEFAULT 0
        )
    `);

    // tenta adicionar coluna se não existir (evita erro)
    try{
        await db.run(`ALTER TABLE usuarios ADD COLUMN pontomax INTEGER DEFAULT 0`);
    } catch(e){}

    console.log("Banco pronto");
}
initDB();


// 🔥 SALVAR / ATUALIZAR USUÁRIO
app.post('/usuario', async (req, res) => {

    let { nome, pontos } = req.body;

    nome = nome.trim().toLowerCase();

    const db = await getDB();

    let existente = await db.get(
        `SELECT * FROM usuarios WHERE nome = ?`,
        [nome]
    );

    if(existente){
        let novoMax = Math.max(pontos, existente.pontomax);

        await db.run(`
            UPDATE usuarios
            SET pontos = ?, pontomax = ?
            WHERE nome = ?
        `, [pontos, novoMax, nome]);

    } else {
        await db.run(`
            INSERT INTO usuarios (nome, pontos, pontomax)
            VALUES (?, ?, ?)
        `, [nome, pontos, pontos]);
    }

    res.json({ ok: true });
});


app.get('/ranking', async (req, res) => {

    const db = await getDB();

    const usuarios = await db.all(`
        SELECT nome, pontomax
        FROM usuarios
        ORDER BY pontomax DESC
        LIMIT 10
    `);

    res.json(usuarios);
});


app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000");
});