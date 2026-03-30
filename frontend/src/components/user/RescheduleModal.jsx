import React, { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Calendar, Clock, X, AlertCircle, Loader2 } from 'lucide-react'
import { format, addDays, startOfToday } from 'date-fns'
import { tokenAPI } from '../../utils/api'
import toast from 'react-hot-toast'

const RescheduleModal = ({ isOpen, onClose, token, onRescheduleSuccess }) => {
  const [newDate, setNewDate] = useState(format(new Date(token?.scheduledTime || new Date()), 'yyyy-MM-dd'))
  const [newTime, setNewTime] = useState(format(new Date(token?.scheduledTime || new Date()), 'HH:mm'))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  if (!token) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const scheduledTime = new Date(`${newDate}T${newTime}`)
      
      // Basic validation: must be in future
      if (scheduledTime <= new Date()) {
        throw new Error('Please select a future date and time.')
      }

      await tokenAPI.rescheduleToken(token._id, scheduledTime.toISOString())
      
      toast.success('Token rescheduled successfully!')
      onRescheduleSuccess()
      onClose()
    } catch (err) {
      console.error('Reschedule error:', err)
      setError(err.response?.data?.message || err.message || 'Failed to reschedule token')
      toast.error('Rescheduling failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Generate date options for the next 7 days
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = addDays(startOfToday(), i)
    return {
      value: format(d, 'yyyy-MM-dd'),
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(d, 'EEEE, MMM d')
    }
  })

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="min-h-screen px-4 text-center">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>

          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-2xl rounded-2xl border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <Dialog.Title as="h3" className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Reschedule Token
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wider mb-1">Current Schedule</p>
                <p className="text-sm font-semibold text-gray-900">
                  {format(new Date(token.scheduledTime), 'EEEE, MMMM do')} at {format(new Date(token.scheduledTime), 'h:mm a')}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select New Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <select
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all text-sm font-medium"
                      required
                    >
                      {dateOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select New Time</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-sm font-medium"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 text-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Confirm'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}

export default RescheduleModal
