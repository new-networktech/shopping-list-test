import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const backendUrl = process.env.BACKEND_URL || 'http://shopping-list-backend:8000'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await axios.get(`${backendUrl}/api/list`)
    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error.response?.status || 500).json({ error: error.message })
  }
} 