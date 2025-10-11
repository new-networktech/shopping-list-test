import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8185'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' })
    }

    // Handle PUT request - update user (password, admin status)
    if (req.method === 'PUT') {
      const response = await axios.put(`${backendUrl}/admin/users/${id}`, req.body, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      res.status(200).json(response.data)
    }
    // Handle DELETE request - delete user
    else if (req.method === 'DELETE') {
      const response = await axios.delete(`${backendUrl}/admin/users/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      res.status(200).json(response.data)
    }
    else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error: any) {
    console.error('Error with admin user operation:', error.response?.data || error.message)
    res.status(error.response?.status || 500).json({ error: error.response?.data?.detail || error.message })
  }
}
