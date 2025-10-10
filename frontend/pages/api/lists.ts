import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8185'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' })
    }

    // Handle GET request - fetch all lists
    if (req.method === 'GET') {
      const response = await axios.get(`${backendUrl}/api/lists`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      res.status(200).json(response.data)
    }
    // Handle POST request - create new list
    else if (req.method === 'POST') {
      const response = await axios.post(`${backendUrl}/api/lists`, req.body, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      res.status(200).json(response.data)
    }
    else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error: any) {
    console.error('Error with lists:', error.response?.data || error.message)
    res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || error.message })
  }
}
