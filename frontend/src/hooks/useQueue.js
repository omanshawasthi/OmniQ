import { useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { tokenAPI, queueAPI } from '../utils/api'
import { useSocket } from './useSocket'
import toast from 'react-hot-toast'

export const useQueueStatus = (branchId, departmentId = null) => {
  const queryClient = useQueryClient()
  const { isConnected } = useSocket()

  const { data: queueStatus, isLoading, error, refetch } = useQuery({
    queryKey: ['queueStatus', branchId, departmentId],
    queryFn: () => tokenAPI.getQueueStatus(branchId, departmentId),
    enabled: !!branchId,
    refetchInterval: isConnected ? false : 30000, // Don't refetch if socket is connected
  })

  // Listen for real-time updates
  useEffect(() => {
    const handleQueueUpdate = (data) => {
      if (data.branchId === branchId && (!departmentId || data.departmentId === departmentId)) {
        queryClient.setQueryData(['queueStatus', branchId, departmentId], {
          data: { queueStatus: data.queueStatus }
        })
      }
    }

    window.addEventListener('queueUpdated', handleQueueUpdate)
    return () => window.removeEventListener('queueUpdated', handleQueueUpdate)
  }, [branchId, departmentId, queryClient])

  return {
    queueStatus: queueStatus?.data?.queueStatus,
    isLoading,
    error,
    refetch
  }
}

export const useMyTokens = (filters = {}) => {
  const queryClient = useQueryClient()

  const { data: tokensData, isLoading, error, refetch } = useQuery({
    queryKey: ['myTokens', filters],
    queryFn: () => tokenAPI.getMyTokens(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Listen for token status changes
  useEffect(() => {
    const handleTokenStatusChange = (data) => {
      // Update the specific token in the cache
      queryClient.setQueriesData(
        { queryKey: ['myTokens'] },
        (oldData) => {
          if (!oldData?.data?.tokens) return oldData
          
          const updatedTokens = oldData.data.tokens.map(token =>
            token._id === data.token._id ? data.token : token
          )
          
          return {
            ...oldData,
            data: {
              ...oldData.data,
              tokens: updatedTokens
            }
          }
        }
      )
    }

    window.addEventListener('tokenStatusChanged', handleTokenStatusChange)
    return () => window.removeEventListener('tokenStatusChanged', handleTokenStatusChange)
  }, [queryClient])

  return {
    tokens: tokensData?.data?.tokens || [],
    totalPages: tokensData?.data?.totalPages || 0,
    currentPage: tokensData?.data?.currentPage || 1,
    total: tokensData?.data?.total || 0,
    isLoading,
    error,
    refetch
  }
}

export const useTokenBooking = () => {
  const queryClient = useQueryClient()
  const [isBooking, setIsBooking] = useState(false)

  const bookToken = async (tokenData) => {
    setIsBooking(true)
    try {
      const response = await tokenAPI.createToken(tokenData)
      
      // Invalidate and refetch tokens
      queryClient.invalidateQueries({ queryKey: ['myTokens'] })
      
      toast.success('Token booked successfully!')
      return response.data
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to book token'
      toast.error(message)
      throw error
    } finally {
      setIsBooking(false)
    }
  }

  const cancelToken = async (tokenId) => {
    try {
      await tokenAPI.cancelToken(tokenId)
      
      // Invalidate and refetch tokens
      queryClient.invalidateQueries({ queryKey: ['myTokens'] })
      
      toast.success('Token cancelled successfully!')
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to cancel token'
      toast.error(message)
      throw error
    }
  }

  return {
    bookToken,
    cancelToken,
    isBooking
  }
}

export const useQueueActions = () => {
  const queryClient = useQueryClient()
  const { 
    callNextToken, 
    skipToken, 
    holdToken, 
    completeToken, 
    recallToken, 
    checkInToken 
  } = useSocket()

  const handleCallNext = async (counterId) => {
    try {
      callNextToken(counterId)
      // Success will be handled by socket event
    } catch (error) {
      toast.error('Failed to call next token')
    }
  }

  const handleSkip = async (tokenId, reason = '') => {
    try {
      skipToken(tokenId, reason)
      // Success will be handled by socket event
    } catch (error) {
      toast.error('Failed to skip token')
    }
  }

  const handleHold = async (tokenId, reason = '') => {
    try {
      holdToken(tokenId, reason)
      // Success will be handled by socket event
    } catch (error) {
      toast.error('Failed to hold token')
    }
  }

  const handleComplete = async (tokenId, serviceTime) => {
    try {
      completeToken(tokenId, serviceTime)
      // Success will be handled by socket event
    } catch (error) {
      toast.error('Failed to complete token')
    }
  }

  const handleRecall = async (tokenId) => {
    try {
      recallToken(tokenId)
      // Success will be handled by socket event
    } catch (error) {
      toast.error('Failed to recall token')
    }
  }

  const handleCheckIn = async (tokenId) => {
    try {
      checkInToken(tokenId)
      // Success will be handled by socket event
    } catch (error) {
      toast.error('Failed to check in token')
    }
  }

  return {
    callNext: handleCallNext,
    skip: handleSkip,
    hold: handleHold,
    complete: handleComplete,
    recall: handleRecall,
    checkIn: handleCheckIn
  }
}

export const useTokenSearch = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    branchId: null,
    departmentId: null,
    status: null,
    date: null
  })

  const { data: searchResults, isLoading, error, refetch } = useQuery({
    queryKey: ['tokenSearch', searchQuery, filters],
    queryFn: () => tokenAPI.getMyTokens({ search: searchQuery, ...filters }),
    enabled: searchQuery.length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })

  const search = useCallback((query, newFilters = {}) => {
    setSearchQuery(query)
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  const clearSearch = useCallback(() => {
    setSearchQuery('')
    setFilters({
      branchId: null,
      departmentId: null,
      status: null,
      date: null
    })
  }, [])

  return {
    searchResults: searchResults?.data?.tokens || [],
    totalPages: searchResults?.data?.totalPages || 0,
    currentPage: searchResults?.data?.currentPage || 1,
    total: searchResults?.data?.total || 0,
    searchQuery,
    filters,
    isLoading,
    error,
    search,
    clearSearch,
    refetch
  }
}

export const useQueueStats = (filters = {}) => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['queueStats', filters],
    queryFn: () => tokenAPI.getMyTokens(filters),
    refetchInterval: 60000, // Refetch every minute
  })

  return {
    stats: stats?.data || {},
    isLoading,
    error
  }
}
