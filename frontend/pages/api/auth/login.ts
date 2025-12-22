import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8185'

export const config = {
  api: {
    bodyParser: true, // Enable body parsing for JSON
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Validate request body
      const { username, password } = req.body
      
      console.log('Received login request:', { username: username ? 'present' : 'missing', password: password ? 'present' : 'missing' })
      
      if (!username || !password) {
        return res.status(400).json({ 
          error: 'Username and password are required' 
        })
      }

      // Create form-urlencoded data for OAuth2PasswordRequestForm
      // FastAPI OAuth2PasswordRequestForm expects: username and password as form fields
      const formData = new URLSearchParams()
      formData.append('username', String(username).trim())
      formData.append('password', String(password))

      const formDataString = formData.toString()
      console.log('Sending to backend:', `${backendUrl}/auth/login`)
      console.log('Form data length:', formDataString.length)

      const response = await axios.post(
        `${backendUrl}/auth/login`, 
        formDataString,
        {
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          maxRedirects: 0,
          timeout: 10000,
          validateStatus: (status) => status < 500, // Don't throw on 4xx
        }
      )
      
      if (response.status >= 400) {
        // Handle error response
        const errorData = response.data
        let errorMessage = 'Login failed'
        
        if (Array.isArray(errorData?.detail)) {
          errorMessage = errorData.detail.map((err: any) => {
            if (typeof err === 'string') return err
            const loc = err.loc ? err.loc.join('.') : ''
            const msg = err.msg || err.type || 'Validation error'
            return loc ? `${loc}: ${msg}` : msg
          }).join(', ')
        } else if (errorData?.detail) {
          errorMessage = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail)
        }
        
        return res.status(response.status).json({ error: errorMessage })
      }
      
      res.status(200).json(response.data)
    } catch (error: any) {
      console.error('Error during login:', error.response?.data || error.message)
      
      // Handle FastAPI validation errors (422) - extract detail from array or object
      let errorMessage = error.message || 'Login failed'
      if (error.response?.data) {
        const errorData = error.response.data
        if (Array.isArray(errorData.detail)) {
          // FastAPI validation errors are arrays
          errorMessage = errorData.detail.map((err: any) => {
            if (typeof err === 'string') return err
            const loc = err.loc ? err.loc.join('.') : ''
            const msg = err.msg || err.type || 'Validation error'
            return loc ? `${loc}: ${msg}` : msg
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
