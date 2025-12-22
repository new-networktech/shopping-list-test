import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8185'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Validate request body
      const { username, password } = req.body
      
      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Username and password are required' 
        })
      }

      // Use URLSearchParams for proper application/x-www-form-urlencoded format
      const params = new URLSearchParams()
      params.append('username', String(username))
      params.append('password', String(password))

      console.log('Sending login request to:', `${backendUrl}/auth/login`)
      console.log('Username:', username)

      const response = await axios.post(`${backendUrl}/auth/login`, params.toString(), {
        headers: { 
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000
      })
      
      res.status(200).json(response.data)
    } catch (error: any) {
      console.error('Error during login:', error.response?.data || error.message)
      console.error('Full error:', error)
      
      // Handle FastAPI validation errors (422) - extract detail from array or object
      let errorMessage = error.message || 'Login failed'
      if (error.response?.data) {
        const errorData = error.response.data
        if (Array.isArray(errorData.detail)) {
          // FastAPI validation errors are arrays
          errorMessage = errorData.detail.map((err: any) => {
            if (typeof err === 'string') return err
            return err.msg || err.message || `${err.loc?.join('.')}: ${err.msg || err.type || 'Validation error'}`
          }).join(', ')
        } else if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail)
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
