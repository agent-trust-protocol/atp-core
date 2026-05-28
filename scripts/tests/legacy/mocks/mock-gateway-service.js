#!/usr/bin/env node
import express from 'express'
import cors from 'cors'

const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => res.json({ status: 'healthy', service: 'mock-gateway-service' }))

app.listen(port, () => {
  console.log(`Mock Gateway Service on ${port}`)
})


