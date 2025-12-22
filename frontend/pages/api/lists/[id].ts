import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8185'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  
  if (req.method === 'DELETE') {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({ error: 'No authentication token provided' })
      }

      const response = await axios.delete(`${backendUrl}/api/lists/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      res.status(200).json(response.data)
    } catch (error: any) {
      console.error('Error deleting list:', error.response?.data || error.message)
      res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || error.message })
    }
  } else if (req.method === 'PUT') {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return res.status(401).json({ error: 'No authentication token provided' })
      }

      const response = await axios.put(`${backendUrl}/api/lists/${id}`, req.body, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      res.status(200).json(response.data)
    } catch (error: any) {
      console.error('Error updating list:', error.response?.data || error.message)
      res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || error.message })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}



