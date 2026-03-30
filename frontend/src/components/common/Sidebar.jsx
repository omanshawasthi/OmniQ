import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { 
  Home,
  Calendar,
  History,
  Users,
  Settings,
  BarChart3,
  Building,
  Search,
  Clock,
  QrCode,
  Monitor
} from 'lucide-react'

const Sidebar = () => {
  const { hasRole } = useAuth()
  const location = useLocation()

  const navigation = [
    // User navigation
    ...(hasRole('user') ? [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        current: location.pathname === '/dashboard'
      },
      {
        name: 'Book Token',
        href: '/book-token',
        icon: Calendar,
        current: location.pathname === '/book-token'
      },
      {
        name: 'Queue Status',
        href: '/queue-status',
        icon: Clock,
        current: location.pathname === '/queue-status'
      },
      {
        name: 'History',
        href: '/history',
        icon: History,
        current: location.pathname === '/history'
      },
    ] : []),
    
    // Staff navigation
    ...(hasRole('staff') ? [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        current: location.pathname === '/dashboard'
      },
      {
        name: 'Walk-in Token',
        href: '/walk-in',
        icon: Users,
        current: location.pathname === '/walk-in'
      },
      {
        name: 'Queue Control',
        href: '/queue-control',
        icon: Settings,
        current: location.pathname === '/queue-control'
      },
      {
        name: 'Search Tokens',
        href: '/search',
        icon: Search,
        current: location.pathname === '/search'
      },
    ] : []),
    
    // Operator navigation
    ...(hasRole('operator') ? [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        current: location.pathname === '/dashboard'
      },
      {
        name: 'Assigned Queue',
        href: '/assigned-queue',
        icon: Users,
        current: location.pathname === '/assigned-queue'
      },
      {
        name: 'Serve Token',
        href: '/serve-token',
        icon: Calendar,
        current: location.pathname === '/serve-token'
      },
    ] : []),
    
    // Admin navigation
    ...(hasRole('admin') ? [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        current: location.pathname === '/dashboard'
      },
      {
        name: 'Manage Users',
        href: '/users',
        icon: Users,
        current: location.pathname === '/users'
      },
      {
        name: 'Manage Branches',
        href: '/branches',
        icon: Building,
        current: location.pathname === '/branches'
      },
      {
        name: 'Analytics',
        href: '/analytics',
        icon: BarChart3,
        current: location.pathname === '/analytics'
      },
      {
        name: 'Settings',
        href: '/settings',
        icon: Settings,
        current: location.pathname === '/settings'
      },
    ] : []),
  ]

  const quickActions = [
    // User quick actions
    ...(hasRole('user') ? [
      {
        name: 'QR Check-in',
        href: '/qr-checkin',
        icon: QrCode,
        description: 'Check in with QR code'
      },
    ] : []),
    
    // Staff quick actions
    ...(hasRole('staff') ? [
      {
        name: 'Public Display',
        href: '/display',
        icon: Monitor,
        description: 'View public display'
      },
    ] : []),
    
    // Admin quick actions
    ...(hasRole('admin') ? [
      {
        name: 'Public Display',
        href: '/display',
        icon: Monitor,
        description: 'View public display'
      },
    ] : []),
  ]

  if (navigation.length === 0) {
    return null
  }

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      {/* Sidebar */}
      <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h2 className="text-lg font-semibold text-gray-900">Queueless</h2>
        </div>
        
        {/* Navigation */}
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 pb-4 space-y-1">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Main Menu
            </div>
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  item.current
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 h-5 w-5 ${
                    item.current ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div className="px-2 pb-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Quick Actions
              </div>
              <div className="space-y-1">
                {quickActions.map((action) => (
                  <Link
                    key={action.name}
                    to={action.href}
                    className="group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  >
                    <action.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
                    <div className="flex-1">
                      <div>{action.name}</div>
                      {action.description && (
                        <div className="text-xs text-gray-500">{action.description}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Sidebar
