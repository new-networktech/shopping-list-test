'use client'

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Check, ShoppingCart, Trash2, LogOut, UserCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { getAuthHeaders } from '../lib/auth'

interface ShoppingItem {
  id: number
  name: string
  quantity: number
  category: string
  emoji: string
  added_at: string
  completed: boolean
}

interface AddItemRequest {
  name: string
  quantity: number
  category: string
  emoji: string
}

export default function Home() {
  const { user, logout, loading: authLoading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [currentListId] = useState<string>('default')
  const [newItem, setNewItem] = useState<AddItemRequest>({
    name: '',
    quantity: 1,
    category: 'general',
    emoji: '🛒'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Load shopping list on component mount
  useEffect(() => {
    loadShoppingList()
  }, [])

  const loadShoppingList = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/list?list_id=${currentListId}`, {
        headers: getAuthHeaders()
      })
      setItems(response.data)
    } catch (err: any) {
      if (err.response?.status === 401) {
        logout()
      } else {
        setError('Fehler beim Laden der Einkaufsliste')
        console.error('Error loading shopping list:', err)
      }
    } finally {
      setLoading(false)
    }
  }

  const addItem = async () => {
    if (!newItem.name.trim()) return

    try {
      setLoading(true)
      const response = await axios.post(`/api/add?list_id=${currentListId}`, newItem, {
        headers: getAuthHeaders()
      })
      setItems([...items, response.data])
      setNewItem({ name: '', quantity: 1, category: 'general', emoji: '🛒' })
      setError('')
    } catch (err) {
      setError('Fehler beim Hinzufügen des Artikels')
      console.error('Error adding item:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleItem = async (id: number) => {
    try {
      setLoading(true)
      await axios.put(`/api/toggle/${id}?list_id=${currentListId}`, {}, {
        headers: getAuthHeaders()
      })
      setItems(items.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      ))
      setError('')
    } catch (err) {
      setError('Fehler beim Umschalten des Artikels')
      console.error('Error toggling item:', err)
    } finally {
      setLoading(false)
    }
  }

  const removeItem = async (id: number) => {
    try {
      setLoading(true)
      await axios.delete(`/api/remove/${id}?list_id=${currentListId}`, {
        headers: getAuthHeaders()
      })
      setItems(items.filter(item => item.id !== id))
      setError('')
    } catch (err) {
      setError('Fehler beim Entfernen des Artikels')
      console.error('Error removing item:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearAllItems = async () => {
    try {
      setLoading(true)
      for (const item of items) {
        await axios.delete(`/api/remove/${item.id}?list_id=${currentListId}`, {
        headers: getAuthHeaders()
      })
      }
      setItems([])
      setError('')
    } catch (err) {
      setError('Fehler beim Löschen aller Artikel')
      console.error('Error clearing all items:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadDefaults = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/defaults`, {
        headers: getAuthHeaders()
      })
      const defaultItems = response.data
      
      // Add each default item
      for (const item of defaultItems) {
        await axios.post(`/api/add?list_id=${currentListId}`, item, {
          headers: getAuthHeaders()
        })
      }
      
      // Reload the list
      await loadShoppingList()
      setError('')
    } catch (err) {
      setError('Fehler beim Laden der Standardartikel')
      console.error('Error loading defaults:', err)
    } finally {
      setLoading(false)
    }
  }

  const emojiOptions = [
    '🛒', '🥛', '🍞', '🥚', '🍌', '🍗', '🍚', '🍅', '🧀', '🥕', '🥩', '🐟', '🍎', '🍊', '🥬', '🧂', '🫖', '☕'
  ]

  // Helper functions to separate items
  const openItems = items.filter(item => !item.completed)
  const purchasedItems = items.filter(item => item.completed)

  // Show loading while checking auth
  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-lg font-semibold text-slate-700">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* User Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Eingeloggt als</p>
                <p className="font-bold text-slate-800 text-sm sm:text-base">{user.username}</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              {user.is_admin && (
                <button
                  onClick={() => router.push('/admin')}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                >
                  <span className="text-lg">👑</span>
                  <span className="hidden sm:inline">Admin Dashboard</span>
                  <span className="sm:hidden">Admin</span>
                </button>
              )}
              <button
                onClick={logout}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl shadow-lg mb-4">
            <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-3">
            Einkaufslisten-App
          </h1>
          <p className="text-slate-600 text-sm sm:text-base font-medium">DevOps Testaufgabe - FastAPI + Next.js</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-400 text-red-800 px-4 py-3 rounded-xl mb-6 shadow-sm">
            <div className="flex items-center">
              <div className="w-5 h-5 bg-red-500 rounded-full mr-3 flex-shrink-0"></div>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}


        {/* Excel-like Shopping List Table */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 overflow-hidden">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Offene Einkäufe */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-500 rounded-full shadow-sm"></div>
                  <h3 className="text-lg sm:text-xl font-bold text-green-700">
                    Offene Einkäufe
                    <span className="ml-2 bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full">
                      {openItems.length}
                    </span>
                  </h3>
                </div>
                
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-gradient-to-br from-green-50/30 to-white">
                  {/* Table Header */}
                  <div className="bg-gradient-to-r from-green-50 to-slate-50 border-b border-slate-200 px-3 sm:px-4 py-3 text-sm font-bold text-slate-700 grid grid-cols-12 gap-2">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-7">Artikel</div>
                    <div className="col-span-2 text-center">Menge</div>
                    <div className="col-span-2 text-center">Aktion</div>
                  </div>
                  
                  {/* Table Body */}
                  <div className="divide-y divide-slate-100">
                    {/* Add new item row */}
                    <div className="px-3 sm:px-4 py-3 hover:bg-green-50/50 transition-colors duration-200 grid grid-cols-12 gap-2 items-center bg-gradient-to-r from-green-50/30 to-transparent">
                      <div className="col-span-1 text-green-500 text-sm font-bold flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </div>
                      <div className="col-span-7">
                        <input
                          type="text"
                          value={newItem.name}
                          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && addItem()}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                          placeholder="Artikel eingeben..."
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          value={newItem.quantity}
                          onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                          onKeyPress={(e) => e.key === 'Enter' && addItem()}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                          min="1"
                        />
                      </div>
                      <div className="col-span-2">
                        <button
                          onClick={addItem}
                          disabled={loading || !newItem.name.trim()}
                          className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-2 rounded-xl text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                          <Plus className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>

                    {/* Existing items */}
                    {loading && (
                      <div className="px-3 sm:px-4 py-6 text-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                      </div>
                    )}

                    {!loading && openItems.map((item, index) => (
                      <div key={item.id} className="px-3 sm:px-4 py-3 hover:bg-green-50/50 transition-all duration-200 grid grid-cols-12 gap-2 items-center group">
                        <div className="col-span-1 text-slate-500 text-sm font-medium text-center">{index + 1}</div>
                        <div className="col-span-7 font-semibold text-slate-800 group-hover:text-green-700 transition-colors duration-200">{item.name}</div>
                        <div className="col-span-2 text-slate-600 text-sm text-center font-medium">{item.quantity}x</div>
                        <div className="col-span-2 flex gap-1 justify-center">
                          <button
                            onClick={() => toggleItem(item.id)}
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-1.5 rounded-lg text-xs transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            title="Als gekauft markieren"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-1.5 rounded-lg text-xs transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            title="Artikel entfernen"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gekauft */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-sm"></div>
                  <h3 className="text-lg sm:text-xl font-bold text-red-700">
                    Gekauft
                    <span className="ml-2 bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded-full">
                      {purchasedItems.length}
                    </span>
                  </h3>
                </div>
                
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-gradient-to-br from-red-50/30 to-white">
                  {/* Table Header */}
                  <div className="bg-gradient-to-r from-red-50 to-slate-50 border-b border-slate-200 px-3 sm:px-4 py-3 text-sm font-bold text-slate-700 grid grid-cols-12 gap-2">
                    <div className="col-span-1 text-center">#</div>
                    <div className="col-span-7">Artikel</div>
                    <div className="col-span-2 text-center">Menge</div>
                    <div className="col-span-2 text-center">Aktion</div>
                  </div>
                  
                  {/* Table Body */}
                  <div className="divide-y divide-slate-100">
                    {purchasedItems.length === 0 && (
                      <div className="px-3 sm:px-4 py-12 text-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-3">
                          <ShoppingCart className="w-6 h-6 text-red-400" />
                        </div>
                        <p className="text-slate-400 text-sm font-medium">Noch nichts gekauft</p>
                      </div>
                    )}

                    {purchasedItems.map((item, index) => (
                      <div key={item.id} className="px-3 sm:px-4 py-3 hover:bg-red-50/50 transition-all duration-200 grid grid-cols-12 gap-2 items-center group">
                        <div className="col-span-1 text-slate-500 text-sm font-medium text-center">{index + 1}</div>
                        <div className="col-span-7 font-semibold text-slate-600 line-through group-hover:text-red-700 transition-colors duration-200">{item.name}</div>
                        <div className="col-span-2 text-slate-400 text-sm text-center font-medium">{item.quantity}x</div>
                        <div className="col-span-2 flex gap-1 justify-center">
                          <button
                            onClick={() => toggleItem(item.id)}
                            className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white p-1.5 rounded-lg text-xs transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            title="Als nicht gekauft markieren"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-1.5 rounded-lg text-xs transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            title="Artikel entfernen"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 sm:mt-12">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 sm:p-8">
            <p className="text-slate-600 text-sm sm:text-base font-medium mb-1">DevOps Testaufgabe - Einkaufslisten-App</p>
            <p className="text-slate-500 text-xs sm:text-sm">FastAPI Backend + Next.js Frontend</p>
          </div>
        </div>
      </div>
    </div>
  )
} 