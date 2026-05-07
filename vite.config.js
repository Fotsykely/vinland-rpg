import fs   from 'fs'
import path from 'path'

const colliderPlugin = {
    name: 'collider',
    configureServer(server) {
        server.middlewares.use('/collider', (req, res) => {
            const url      = new URL(req.url, 'http://localhost')
            const filePath = url.searchParams.get('path')

            if (req.method === 'GET') {
                try {
                    const abs     = path.resolve(process.cwd(), filePath)
                    const content = fs.readFileSync(abs, 'utf8')
                    res.writeHead(200, { 'Content-Type': 'application/json' })
                    res.end(content)
                } catch (e) {
                    res.writeHead(404, { 'Content-Type': 'application/json' })
                    res.end(JSON.stringify({ error: e.message }))
                }
                return
            }

            if (req.method === 'POST') {
                let body = ''
                req.on('data', chunk => { body += chunk })
                req.on('end', () => {
                    try {
                        const { data } = JSON.parse(body)
                        const abs      = path.resolve(process.cwd(), filePath)
                        fs.writeFileSync(abs, JSON.stringify(data, null, 2) + '\n')
                        res.writeHead(200, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify({ ok: true }))
                    } catch (e) {
                        res.writeHead(500, { 'Content-Type': 'application/json' })
                        res.end(JSON.stringify({ error: e.message }))
                    }
                })
                return
            }

            res.statusCode = 405
            res.end()
        })
    },
}

export default {
    publicDir: 'assets',
    plugins:   [colliderPlugin],
}
