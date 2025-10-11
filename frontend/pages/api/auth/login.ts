import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8185'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const formData = new FormData()
      formData.append('username', req.body.username)
      formData.append('password', req.body.password)

      const response = await axios.post(`${backendUrl}/auth/login`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      res.status(200).json(response.data)
    } catch (error: any) {
      console.error('Error during login:', error.response?.data || error.message)
      res.status(error.response?.status || 500).json({ 
        error: error.response?.data?.detail || error.message 
      })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
