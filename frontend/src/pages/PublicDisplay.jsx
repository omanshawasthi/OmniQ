import React from 'react'
import { useParams } from 'react-router-dom'
import { Clock, Users, Building, Monitor } from 'lucide-react'

const PublicDisplay = () => {
  const { branchId } = useParams()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 to-primary-700 text-white">
      {/* Header */}
      <header className="bg-black bg-opacity-30 backdrop-blur-sm border-b border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Building className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-2xl font-bold">Queueless</h1>
                <p className="text-sm opacity-90">Main Branch - Public Display</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Current Time</p>
              <p className="text-2xl font-bold">{new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Currently Serving */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-2">Now Serving</h2>
            <div className="w-24 h-1 bg-white mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white border-opacity-20">
              <div className="mb-4">
                <Monitor className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg opacity-90 mb-2">Counter A</p>
              </div>
              <div className="text-6xl font-bold mb-2">A001</div>
              <p className="text-lg opacity-90">John Doe</p>
            </div>

            <div className="bg-success-500 bg-opacity-20 backdrop-blur-sm rounded-2xl p-8 text-center border border-success-400 border-opacity-30">
              <div className="mb-4">
                <Monitor className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg opacity-90 mb-2">Counter B</p>
              </div>
              <div className="text-6xl font-bold mb-2">B023</div>
              <p className="text-lg opacity-90">Jane Smith</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-8 text-center border border-white border-opacity-20">
              <div className="mb-4">
                <Monitor className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg opacity-90 mb-2">Counter C</p>
              </div>
              <div className="text-6xl font-bold mb-2">C015</div>
              <p className="text-lg opacity-90">Bob Johnson</p>
            </div>
          </div>
        </div>

        {/* Next in Queue */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Next in Queue</h2>
            <div className="w-24 h-1 bg-white mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6">
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center border border-white border-opacity-20">
              <div className="text-3xl font-bold mb-2">A002</div>
              <p className="text-sm opacity-90">Sarah Wilson</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center border border-white border-opacity-20">
              <div className="text-3xl font-bold mb-2">A003</div>
              <p className="text-sm opacity-90">Mike Davis</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center border border-white border-opacity-20">
              <div className="text-3xl font-bold mb-2">B024</div>
              <p className="text-sm opacity-90">Emily Brown</p>
            </div>

            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center border border-white border-opacity-20">
              <div className="text-3xl font-bold mb-2">B025</div>
              <p className="text-sm opacity-90">David Lee</p>
            </div>
          </div>
        </div>

        {/* Queue Statistics */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 mr-3" />
              <h3 className="text-lg font-semibold">Waiting</h3>
            </div>
            <div className="text-3xl font-bold mb-2">24</div>
            <p className="text-sm opacity-90">Currently waiting</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
            <div className="flex items-center mb-4">
              <Clock className="h-8 w-8 mr-3" />
              <h3 className="text-lg font-semibold">Avg Wait Time</h3>
            </div>
            <div className="text-3xl font-bold mb-2">18</div>
            <p className="text-sm opacity-90">Minutes</p>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 border border-white border-opacity-20">
            <div className="flex items-center mb-4">
              <Monitor className="h-8 w-8 mr-3" />
              <h3 className="text-lg font-semibold">Active Counters</h3>
            </div>
            <div className="text-3xl font-bold mb-2">8</div>
            <p className="text-sm opacity-90">Out of 10</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-black bg-opacity-30 backdrop-blur-sm border-t border-white border-opacity-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm opacity-90">Queueless Public Display System</p>
              <p className="text-xs opacity-75">Real-time queue management</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">For assistance, please approach the reception</p>
              <p className="text-xs opacity-75">Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default PublicDisplay
