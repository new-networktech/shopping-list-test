import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (req.method === 'DELETE') {
    try {
      const response = await axios.delete(`http://shopping-list-backend:8000/api/remove/${id}`)
      res.status(200).json(response.data)
    } catch (error: any) {
      res.status(error.response?.status || 500).json({ error: error.message })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
} 