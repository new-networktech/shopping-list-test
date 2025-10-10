import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8185'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' })
    }

    const { list_id } = req.query
    const url = list_id ? `${backendUrl}/api/list?list_id=${list_id}` : `${backendUrl}/api/list`
    
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    res.status(200).json(response.data)
  } catch (error: any) {
    const errorData = error.response?.data || {}
    const errorMessage = errorData.detail || error.message
    
    // Log more details for debugging
    if (error.response?.status === 404) {
      console.error('Error fetching list:', errorData)
    } else {
      console.error('Error fetching list:', errorMessage)
    }
    
    res.status(error.response?.status || 500).json({ 
      error: errorMessage,
      detail: errorData.detail || 'An error occurred while fetching the list'
    })
  }
} 