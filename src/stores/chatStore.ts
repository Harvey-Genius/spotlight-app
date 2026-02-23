import { create } from 'zustand'
import { api } from '@/api/client'
import type { ChatMessage, ConversationSummary } from '@/types'

interface ChatState {
  conversations: ConversationSummary[]
  activeConversationId: string | null
  messages: ChatMessage[]
  isStreaming: boolean
  streamingContent: string

  loadConversations: () => Promise<void>
  selectConversation: (id: string) => Promise<void>
  newConversation: () => void
  deleteConversation: (id: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  clearMessages: () => void
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  conversation_id: '',
  role: 'assistant',
  content: 'How can I help?',
  metadata: {},
  created_at: new Date().toISOString(),
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [WELCOME_MESSAGE],
  isStreaming: false,
  streamingContent: '',

  loadConversations: async () => {
    try {
      const conversations = await api.listConversations()
      set({ conversations })
    } catch (err) {
      console.error('Failed to load conversations:', err)
    }
  },

  selectConversation: async (id) => {
    set({ activeConversationId: id, messages: [WELCOME_MESSAGE] })
    try {
      const msgs = await api.getConversationMessages(id)
      if (msgs.length > 0) {
        set({ messages: msgs })
      }
    } catch (err) {
      console.error('Failed to load conversation messages:', err)
    }
  },

  newConversation: () => {
    set({
      activeConversationId: null,
      messages: [WELCOME_MESSAGE],
      streamingContent: '',
    })
  },

  deleteConversation: async (id) => {
    try {
      await api.deleteConversation(id)
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        ...(state.activeConversationId === id
          ? {
              activeConversationId: null,
              messages: [WELCOME_MESSAGE],
            }
          : {}),
      }))
    } catch (err) {
      console.error('Failed to delete conversation:', err)
    }
  },

  sendMessage: async (content) => {
    const { activeConversationId, isStreaming } = get()
    if (isStreaming) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      conversation_id: activeConversationId || '',
      role: 'user',
      content,
      metadata: {},
      created_at: new Date().toISOString(),
    }

    set((state) => ({
      messages: [...state.messages, userMessage],
      isStreaming: true,
      streamingContent: '',
    }))

    try {
      let fullContent = ''
      let newConversationId = activeConversationId

      for await (const event of api.sendMessage(
        activeConversationId,
        content
      )) {
        if (event.type === 'error') {
          console.error('Server error:', event.content)
          throw new Error(event.content || 'Server error')
        } else if (event.type === 'chunk') {
          fullContent += event.content
          set({ streamingContent: fullContent })
        } else if (event.type === 'done') {
          newConversationId = event.conversation_id

          const assistantMessage: ChatMessage = {
            id: event.message_id,
            conversation_id: event.conversation_id,
            role: 'assistant',
            content: fullContent,
            metadata: {},
            created_at: new Date().toISOString(),
          }

          set((state) => ({
            messages: [...state.messages, assistantMessage],
            isStreaming: false,
            streamingContent: '',
            activeConversationId: event.conversation_id,
          }))
        }
      }

      // If streaming ended without a done event
      if (get().isStreaming) {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          conversation_id: newConversationId || '',
          role: 'assistant',
          content: fullContent || 'Sorry, something went wrong. Please try again.',
          metadata: {},
          created_at: new Date().toISOString(),
        }

        set((state) => ({
          messages: [...state.messages, assistantMessage],
          isStreaming: false,
          streamingContent: '',
        }))
      }
    } catch (err) {
      console.error('Chat error:', err)
      const errMsg = err instanceof Error ? err.message : 'Unknown error'
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        conversation_id: activeConversationId || '',
        role: 'assistant',
        content: `Sorry, something went wrong: ${errMsg}`,
        metadata: {},
        created_at: new Date().toISOString(),
      }

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isStreaming: false,
        streamingContent: '',
      }))
    }
  },

  clearMessages: () => {
    set({
      messages: [WELCOME_MESSAGE],
      activeConversationId: null,
      streamingContent: '',
    })
  },
}))
