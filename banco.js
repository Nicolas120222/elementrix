import express from "express";
import cors from "cors";
import fs from "fs";

const app = express();
app.use(express.json());
app.use(cors());

const FILE = "./data.json";

if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, JSON.stringify([]));
}

function ler() {
    return JSON.parse(fs.readFileSync(FILE));
}

function salvar(data) {
    fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}
let online = {};


app.post("/usuario", (req, res) => {
    let { nome, pontos } = req.body;
    nome = nome.trim().toLowerCase();

    let usuarios = ler();

    let u = usuarios.find(x => x.nome === nome);

    if (u) {
        u.pontos = pontos;
        u.pontomax = Math.max(u.pontomax || 0, pontos);
    } else {
        usuarios.push({
            nome,
            pontos,
            pontomax: pontos
        });
    }

    salvar(usuarios);

    res.json({ ok: true });
});

app.get("/ranking", (req, res) => {
    let usuarios = ler();

    usuarios.sort((a, b) => b.pontomax - a.pontomax);

    res.json(usuarios.slice(0, 10));
});
app.post("/reset", (req, res) => {

    const { senha } = req.body;

    if (senha !== "admin_67") {
        return res.status(403).json({
            error: "sem permissão"
        });
    }

    fs.writeFileSync(FILE, JSON.stringify([]));

    res.json({
        ok: true,
        message: "ranking resetado"
    });
});
app.post("/online", (req, res) => {

    const { nome } = req.body;

    if(nome){
        online[nome] = Date.now();
    }

    res.json({ ok: true });
});

app.post("/online-admin", (req, res) => {

    const { senha } = req.body;

    if(senha !== "admin_67"){
        return res.status(403).json({
            error: "sem permissão"
        });
    }

    const agora = Date.now();

    for(let nome in online){

        if(agora - online[nome] > 30000){
            delete online[nome];
        }
    }

    res.json({
        online: Object.keys(online).length,
        usuarios: Object.keys(online)
    });
});
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});