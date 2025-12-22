import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8185'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Use URLSearchParams for proper application/x-www-form-urlencoded format
      const params = new URLSearchParams()
      params.append('username', req.body.username)
      params.append('password', req.body.password)

      const response = await axios.post(`${backendUrl}/auth/login`, params.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      res.status(200).json(response.data)
    } catch (error: any) {
      console.error('Error during login:', error.response?.data || error.message)
      
      // Handle FastAPI validation errors (422) - extract detail from array or object
      let errorMessage = error.message || 'Login failed'
      if (error.response?.data) {
        const errorData = error.response.data
        if (Array.isArray(errorData.detail)) {
          // FastAPI validation errors are arrays
          errorMessage = errorData.detail.map((err: any) => err.msg || err.message || JSON.stringify(err)).join(', ')
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.error) {
          errorMessage = errorData.error
        }
      }
      
      res.status(error.response?.status || 500).json({ 
        error: errorMessage 
      })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
