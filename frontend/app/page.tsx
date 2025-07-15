'use client'

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react'
import axios from 'axios'
import { Plus, Trash2, Check, ShoppingCart } from 'lucide-react'

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

export default function Home() {
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [newItem, setNewItem] = useState<AddItemRequest>({
    name: '',
    quantity: 1,
    category: 'general',
    emoji: '🛒'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const lastActionRef = useRef<HTMLDivElement | null>(null);
  const [scrollToRef, setScrollToRef] = useState<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (scrollToRef) {
      scrollToRef.scrollIntoView({ behavior: 'auto', block: 'center' });
      setScrollToRef(null);
    }
  }, [items]);

  // Load shopping list on component mount
  useEffect(() => {
    loadShoppingList()
  }, [])

  const loadShoppingList = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/list`)
      setItems(response.data)
    } catch (err) {
      setError('Fehler beim Laden der Einkaufsliste')
      console.error('Error loading shopping list:', err)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async () => {
    if (!newItem.name.trim()) return

    try {
      setLoading(true)
      const response = await axios.post(`/api/add`, newItem)
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

  const removeItem = async (id: number) => {
    const el = document.getElementById(`item-${id}`);
    if (el) lastActionRef.current = el as HTMLDivElement;
    try {
      setLoading(true)
      await axios.delete(`/api/remove/${id}`)
      setItems(items.filter(item => item.id !== id))
      setError('')
    } catch (err) {
      setError('Fehler beim Entfernen des Artikels')
      console.error('Error removing item:', err)
    } finally {
      setLoading(false)
      if (lastActionRef.current) setScrollToRef(lastActionRef.current);
    }
  }

  const toggleItem = async (id: number) => {
    const el = document.getElementById(`item-${id}`);
    if (el) lastActionRef.current = el as HTMLDivElement;
    try {
      setLoading(true)
      await axios.put(`/api/toggle/${id}`)
      setItems(items.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      ))
      setError('')
    } catch (err) {
      setError('Fehler beim Umschalten des Artikels')
      console.error('Error toggling item:', err)
    } finally {
      setLoading(false)
      if (lastActionRef.current) setScrollToRef(lastActionRef.current);
    }
  }

  const loadDefaults = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`/api/defaults`)
      const defaultItems = response.data
      
      // Add each default item
      for (const item of defaultItems) {
        await axios.post(`/api/add`, item)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-6">
          <a href="/readme" className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded shadow hover:from-blue-600 hover:to-indigo-700 transition font-semibold">
            📖 Projekt Readme
          </a>
        </div>
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🛒 Einkaufslisten-App
          </h1>
          <p className="text-gray-600">DevOps Testaufgabe - FastAPI + Next.js</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Add Item Form */}
        <form onSubmit={e => e.preventDefault()} className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Neuen Artikel hinzufügen</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Artikelname
              </label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Artikelname eingeben"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Menge
              </label>
              <input
                type="number"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kategorie
              </label>
              <select
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="general">Allgemein</option>
                <option value="dairy">Milchprodukte</option>
                <option value="bakery">Backwaren</option>
                <option value="fruits">Obst</option>
                <option value="vegetables">Gemüse</option>
                <option value="meat">Fleisch</option>
                <option value="grains">Getreide</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emoji
              </label>
              <select
                value={newItem.emoji}
                onChange={(e) => setNewItem({ ...newItem, emoji: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {emojiOptions.map(emoji => (
                  <option key={emoji} value={emoji}>{emoji}</option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={addItem}
            disabled={loading || !newItem.name.trim()}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Plus size={20} />
            Artikel hinzufügen
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={loadDefaults}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ShoppingCart size={20} />
            Standard laden
          </button>
        </div>

        {/* Shopping List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Einkaufsliste</h2>
          {loading && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart size={48} className="mx-auto mb-4 opacity-50" />
              <p>Ihre Einkaufsliste ist leer. Fügen Sie einige Artikel hinzu, um zu beginnen!</p>
            </div>
          )}
          {!loading && items.length > 0 && (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  id={`item-${item.id}`}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    item.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className={`p-2 rounded-full ${
                        item.completed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-600'
                      } hover:bg-opacity-80`}
                    >
                      <Check size={16} />
                    </button>
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <p className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {item.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        Menge: {item.quantity} • {item.category}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>DevOps Testaufgabe - Einkaufslisten-App</p>
          <p>FastAPI Backend + Next.js Frontend</p>
        </div>
      </div>
    </div>
  )
} 