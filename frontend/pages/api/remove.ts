import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8185'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'DELETE') {
    const { id } = req.query
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({ error: 'No authentication token provided' })
      }

      const response = await axios.delete(`${backendUrl}/api/remove/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      res.status(200).json(response.data)
    } catch (error: any) {
      console.error('Error removing item:', error.response?.data || error.message)
      res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || error.message })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
} 