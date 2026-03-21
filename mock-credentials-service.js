#!/usr/bin/env node
import express from 'express'
import cors from 'cors'

const app = express()
const port = process.env.PORT || 3002

app.use(cors())
app.use(express.json())

// Minimal endpoints for health; extend later if needed
app.get('/health', (_req, res) =>
  res.json({ status: 'healthy', service: 'mock-credentials-service' })
)

app.listen(port, () => {
  console.log(`Mock Credentials Service on ${port}`)
})


