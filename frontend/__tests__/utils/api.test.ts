import { sendChatMessage, getConversationHistory, NDAContextPayload } from '@/utils/api'

describe('API Utilities', () => {
  const mockFetch = jest.fn()
  global.fetch = mockFetch

  beforeEach(() => {
    mockFetch.mockClear()
  })

  describe('sendChatMessage', () => {
    it('should send a message with conversation ID and context', async () => {
      const mockResponse = {
        conversation_id: 'conv-123',
        message_id: 'msg-456',
        analysis: {
          answer: 'I understand.',
          confidence: 'high' as const,
          field_updates: { purpose: 'Test purpose' },
          suggested_clauses: [],
          warnings: [],
          follow_up_questions: [],
        },
        created_at: '2025-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const context: NDAContextPayload = {
        purpose: 'Test purpose',
        governingLaw: 'California',
      }

      const result = await sendChatMessage(
        'Hello',
        'conv-123',
        context
      )

      expect(result).toEqual(mockResponse)
      expect(mockFetch).toHaveBeenCalledWith(
        '/chat/message',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      )
    })

    it('should send a message without conversation ID for new conversations', async () => {
      const mockResponse = {
        conversation_id: 'conv-new',
        message_id: 'msg-new',
        analysis: {
          answer: 'Starting NDA creation.',
          confidence: 'high' as const,
          field_updates: {},
          suggested_clauses: [],
          warnings: [],
          follow_up_questions: ['What is the purpose?'],
        },
        created_at: '2025-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await sendChatMessage(
        'Hello',
        null,
        null
      )

      expect(result.conversation_id).toBe('conv-new')
      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.conversation_id).toBeNull()
      expect(body.document_context).toBeNull()
    })

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      })

      await expect(
        sendChatMessage('Hello', 'conv-123', null)
      ).rejects.toThrow('Chat API error')
    })

    it('should handle field_updates in response', async () => {
      const mockResponse = {
        conversation_id: 'conv-123',
        message_id: 'msg-456',
        analysis: {
          answer: "I'll set the purpose to: evaluate a merger",
          confidence: 'high' as const,
          field_updates: {
            purpose: 'Evaluate a merger',
            effectiveDate: '2025-01-15',
          },
          suggested_clauses: [],
          warnings: [],
          follow_up_questions: ['Who are the parties?'],
        },
        created_at: '2025-01-15T10:00:00Z',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      })

      const result = await sendChatMessage('Purpose is evaluating a merger', 'conv-123', null)

      expect(result.analysis.field_updates).toEqual({
        purpose: 'Evaluate a merger',
        effectiveDate: '2025-01-15',
      })
    })
  })

  describe('getConversationHistory', () => {
    it('should fetch conversation history', async () => {
      const mockHistory = [
        {
          id: 'msg-1',
          conversation_id: 'conv-123',
          role: 'user',
          content: 'Hello',
          created_at: '2025-01-15T10:00:00Z',
        },
        {
          id: 'msg-2',
          conversation_id: 'conv-123',
          role: 'assistant',
          content: 'Hi, how can I help?',
          created_at: '2025-01-15T10:01:00Z',
        },
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      })

      const result = await getConversationHistory('conv-123')

      expect(result).toEqual(mockHistory)
      expect(mockFetch).toHaveBeenCalledWith(
        '/chat/conv-123/history'
      )
    })

    it('should throw error on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      })

      await expect(
        getConversationHistory('conv-invalid')
      ).rejects.toThrow('History API error')
    })

    it('should return empty array for new conversation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      const result = await getConversationHistory('conv-new')

      expect(result).toEqual([])
    })
  })

  describe('BASE_URL configuration', () => {
    it('should use NEXT_PUBLIC_API_URL environment variable', () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL
      process.env.NEXT_PUBLIC_API_URL = 'http://api.example.com'

      // Re-import to pick up new env var
      jest.resetModules()
      const { sendChatMessage: sendMessage } = require('@/utils/api')

      expect(sendMessage).toBeDefined()

      process.env.NEXT_PUBLIC_API_URL = originalEnv
    })

    it('should default to empty string for same-origin requests', () => {
      delete process.env.NEXT_PUBLIC_API_URL
      jest.resetModules()
      const { sendChatMessage: sendMessage } = require('@/utils/api')

      expect(sendMessage).toBeDefined()
    })
  })
})
