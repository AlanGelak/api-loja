const express = require("express")
const knex = require("knex")
const errors = require("http-errors")

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const PORT = 8001
const HOSTNAME = "localhost"

const conn = knex({
    client: "mysql",
    connection: {
        host: HOSTNAME,
        user: "root",
        password: "",
        database: "sistema_pedidos"
    }
})

//// ROTA INICIAL

app.get("/", (req, res) => {
    res.json({ resposta: "API da Loja Online funcionando!" })
})

//// PRODUTOS

app.get("/produtos", (req, res, next) => {
    conn("produtos")
        .leftJoin("categorias", "produtos.categoria_id", "categorias.id")
        .select("produtos.*", "categorias.nome AS categoria")
        .then(dados => res.json(dados))
        .catch(next)
})

app.get("/produtos/last", (req, res, next) => {
    conn("produtos")
        .leftJoin("categorias", "produtos.categoria_id", "categorias.id")
        .select("produtos.*", "categorias.nome AS categoria")
        .orderBy("produtos.id", "desc")
        .first()
        .then(dados => res.json(dados))
        .catch(next)
})

app.get("/produtos/:id", (req, res, next) => {
    conn("produtos")
        .leftJoin("categorias", "produtos.categoria_id", "categorias.id")
        .select("produtos.*", "categorias.nome AS categoria")
        .where("produtos.id", req.params.id)
        .first()
        .then(dados => res.json(dados))
        .catch(next)
})

app.post("/produtos", (req, res, next) => {
    conn("produtos")
        .insert(req.body)
        .then(id => res.status(201).json({ resposta: "Produto inserido", id: id[0] }))
        .catch(next)
})

app.put("/produtos/:id", (req, res, next) => {
    conn("produtos")
        .where("id", req.params.id)
        .update(req.body)
        .then(dados => {
            if (!dados) return next(errors(404, "Produto não encontrado"))
            res.json({ resposta: "Produto atualizado" })
        })
        .catch(next)
})

app.delete("/produtos/:id", (req, res, next) => {
    conn("produtos")
        .where("id", req.params.id)
        .delete()
        .then(dados => {
            if (!dados) return next(errors(404, "Produto não encontrado"))
            res.json({ resposta: "Produto excluído" })
        })
        .catch(next)
})

// CATEGORIAS

app.get("/categorias", (req, res, next) => {
    conn("categorias")
        .then(dados => res.json(dados))
        .catch(next)
})

app.get("/categorias/:id", (req, res, next) => {
    conn("categorias")
        .where("id", req.params.id)
        .first()
        .then(dados => res.json(dados))
        .catch(next)
})

app.post("/categorias", (req, res, next) => {
    conn("categorias")
        .insert(req.body)
        .then(id => res.status(201).json({ resposta: "Categoria inserida", id: id[0] }))
        .catch(next)
})

app.put("/categorias/:id", (req, res, next) => {
    conn("categorias")
        .where("id", req.params.id)
        .update(req.body)
        .then(dados => {
            if (!dados) return next(errors(404, "Categoria não encontrada"))
            res.json({ resposta: "Categoria atualizada" })
        })
        .catch(next)
})

app.delete("/categorias/:id", (req, res, next) => {
    conn("categorias")
        .where("id", req.params.id)
        .delete()
        .then(dados => {
            if (!dados) return next(errors(404, "Categoria não encontrada"))
            res.json({ resposta: "Categoria excluída" })
        })
        .catch(next)
})

//// CLIENTES

app.get("/clientes", (req, res, next) => {
    conn("clientes")
        .leftJoin("cidades", "clientes.cidade_id", "cidades.id")
        .select("clientes.*", "cidades.nome AS cidade")
        .then(dados => res.json(dados))
        .catch(next)
})

app.get("/clientes/:id", (req, res, next) => {
    conn("clientes")
        .leftJoin("cidades", "clientes.cidade_id", "cidades.id")
        .select("clientes.*", "cidades.nome AS cidade")
        .where("clientes.id", req.params.id)
        .first()
        .then(dados => res.json(dados))
        .catch(next)
})

app.post("/clientes", (req, res, next) => {
    conn("clientes")
        .insert(req.body)
        .then(id => res.status(201).json({ resposta: "Cliente cadastrado", id: id[0] }))
        .catch(next)
})

//// PEDIDOS

app.get("/pedidos", (req, res, next) => {
    conn("pedidos")
        .then(dados => res.json(dados))
        .catch(next)
})

app.get("/pedidos/:id", (req, res, next) => {
    conn("pedidos")
        .where("id", req.params.id)
        .first()
        .then(dados => res.json(dados))
        .catch(next)
})

//// Criar pedido completo

app.post("/pedidos", async (req, res, next) => {
    const { cliente_id, endereco, produtos } = req.body

    try {
        const ids = await conn("pedidos").insert({
            horario: new Date(),
            endereco,
            cliente_id
        })

        const pedidoId = ids[0]

        for (let item of produtos) {
            await conn("pedidos_produtos").insert({
                pedido_id: pedidoId,
                produto_id: item.produto_id,
                quantidade: item.quantidade,
                preco: conn("produtos").where("id", item.produto_id).select("preco")
            })
        }

        res.status(201).json({
            resposta: "Pedido criado",
            pedidoId
        })
    } catch (e) {
        next(e)
    }
})

//// UPDATE DE PEDIDOS

app.put("/pedidos/:id", (req, res, next) => {
    conn("pedidos")
        .where("id", req.params.id)
        .update(req.body)
        .then(dados => {
            if (!dados) return next(errors(404, "Pedido não encontrado"))
            res.json({ resposta: "Pedido atualizado" })
        })
        .catch(next)
})

//// DELETE DE PEDIDOS

app.delete("/pedidos/:id", async (req, res, next) => {
    try {
        await conn("pedidos_produtos")
            .where("pedido_id", req.params.id)
            .delete()

        const deletado = await conn("pedidos")
            .where("id", req.params.id)
            .delete()

        if (!deletado) return next(errors(404, "Pedido não encontrado"))

        res.json({ resposta: "Pedido excluído" })

    } catch (e) {
        next(e)
    }
})

//// SERVIDOR

app.listen(PORT, () => {
    console.log(`API executando em: http://${HOSTNAME}:${PORT}`)
})
