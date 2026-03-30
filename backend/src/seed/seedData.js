import Branch from '../models/Branch.js'
import Department from '../models/Department.js'
import Counter from '../models/Counter.js'
import User from '../models/User.js'
import mongoose from 'mongoose'

export const seedInitialData = async () => {
  try {
    console.log('Seeding initial data...')

    // Create branches
    const branches = await Branch.create([
      {
        name: 'Main Branch',
        address: '123 Main Street, Downtown',
        phone: '+1234567890',
        email: 'main@queueless.com',
        operatingHours: {
          monday: { open: '09:00', close: '18:00', isClosed: false },
          tuesday: { open: '09:00', close: '18:00', isClosed: false },
          wednesday: { open: '09:00', close: '18:00', isClosed: false },
          thursday: { open: '09:00', close: '18:00', isClosed: false },
          friday: { open: '09:00', close: '18:00', isClosed: false },
          saturday: { open: '10:00', close: '14:00', isClosed: false },
          sunday: { open: '00:00', close: '00:00', isClosed: true }
        },
        settings: {
          maxTokensPerDay: 500,
          tokenExpiryMinutes: 30,
          gracePeriodMinutes: 10,
          averageWaitTimeMinutes: 15
        }
      },
      {
        name: 'Downtown Branch',
        address: '456 Oak Avenue, Business District',
        phone: '+1234567891',
        email: 'downtown@queueless.com',
        operatingHours: {
          monday: { open: '08:00', close: '20:00', isClosed: false },
          tuesday: { open: '08:00', close: '20:00', isClosed: false },
          wednesday: { open: '08:00', close: '20:00', isClosed: false },
          thursday: { open: '08:00', close: '20:00', isClosed: false },
          friday: { open: '08:00', close: '20:00', isClosed: false },
          saturday: { open: '09:00', close: '17:00', isClosed: false },
          sunday: { open: '00:00', close: '00:00', isClosed: true }
        },
        settings: {
          maxTokensPerDay: 300,
          tokenExpiryMinutes: 25,
          gracePeriodMinutes: 8,
          averageWaitTimeMinutes: 12
        }
      },
      {
        name: 'Airport Branch',
        address: '789 Terminal Road, International Airport',
        phone: '+1234567892',
        email: 'airport@queueless.com',
        operatingHours: {
          monday: { open: '06:00', close: '23:00', isClosed: false },
          tuesday: { open: '06:00', close: '23:00', isClosed: false },
          wednesday: { open: '06:00', close: '23:00', isClosed: false },
          thursday: { open: '06:00', close: '23:00', isClosed: false },
          friday: { open: '06:00', close: '23:00', isClosed: false },
          saturday: { open: '06:00', close: '23:00', isClosed: false },
          sunday: { open: '06:00', close: '23:00', isClosed: false }
        },
        settings: {
          maxTokensPerDay: 1000,
          tokenExpiryMinutes: 20,
          gracePeriodMinutes: 5,
          averageWaitTimeMinutes: 10
        }
      }
    ])

    console.log(`Created ${branches.length} branches`)

    // Create departments for each branch
    const departments = []
    for (const branch of branches) {
      const branchDepartments = await Department.create([
        {
          name: 'General Services',
          description: 'General customer services and inquiries',
          branchId: branch._id,
          averageServiceTime: 15,
          prioritySupport: false,
          settings: {
            allowOnlineBooking: true,
            allowWalkIn: true,
            maxAdvanceBookingDays: 7,
            tokensPerSlot: 1,
            slotDurationMinutes: 15
          },
          operatingHours: branch.operatingHours,
          color: '#3b82f6',
          icon: '🏢',
          sortOrder: 1
        },
        {
          name: 'Priority Services',
          description: 'Fast-track services for premium customers',
          branchId: branch._id,
          averageServiceTime: 10,
          prioritySupport: true,
          settings: {
            allowOnlineBooking: true,
            allowWalkIn: true,
            maxAdvanceBookingDays: 7,
            tokensPerSlot: 1,
            slotDurationMinutes: 10
          },
          operatingHours: branch.operatingHours,
          color: '#ef4444',
          icon: '⚡',
          sortOrder: 2
        },
        {
          name: 'Consultation',
          description: 'Specialized consultation services',
          branchId: branch._id,
          averageServiceTime: 30,
          prioritySupport: false,
          settings: {
            allowOnlineBooking: true,
            allowWalkIn: false,
            maxAdvanceBookingDays: 14,
            tokensPerSlot: 1,
            slotDurationMinutes: 30
          },
          operatingHours: branch.operatingHours,
          color: '#10b981',
          icon: '💼',
          sortOrder: 3
        }
      ])
      departments.push(...branchDepartments)
    }

    console.log(`Created ${departments.length} departments`)

    // Create counters for each department
    const counters = []
    for (const department of departments) {
      const deptCounters = await Counter.create([
        {
          name: `${department.name} - Counter 1`,
          branchId: department.branchId,
          departmentId: department._id,
          status: 'active',
          settings: {
            maxTokensPerHour: 20,
            breakDuration: 15,
            autoCallNext: true
          },
          operatingHours: department.operatingHours
        },
        {
          name: `${department.name} - Counter 2`,
          branchId: department.branchId,
          departmentId: department._id,
          status: 'active',
          settings: {
            maxTokensPerHour: 20,
            breakDuration: 15,
            autoCallNext: true
          },
          operatingHours: department.operatingHours
        }
      ])
      counters.push(...deptCounters)
    }

    console.log(`Created ${counters.length} counters`)

    // Create sample staff users
    const staffUsers = await User.create([
      {
        name: 'John Smith',
        email: 'staff@queueless.com',
        role: 'STAFF'
      },
      {
        name: 'Admin User',
        email: 'admin@queueless.com',
        role: 'ADMIN'
      },
      {
        name: 'Jane Doe',
        email: 'operator@queueless.com',
        password: 'operator123',
        phone: '+1234567894',
        role: 'OPERATOR',
        isActive: true,
        assignedBranches: [branches[0]._id],
        assignedDepartments: [departments[0]._id],
        assignedCounters: [counters[0]._id]
      }
    ])

    console.log(`Created ${staffUsers.length} staff users`)

    // Assign operators to counters
    await Counter.findByIdAndUpdate(counters[0]._id, {
      assignedOperator: staffUsers[1]._id
    })
    console.log(`Created ${counters.length} counters`)
    console.log('Initial data seeding completed successfully!')
    
    return {
      branches,
      departments,
      counters,
      staffUsers
    }

  } catch (error) {
    console.error('Error seeding initial data:', error)
    throw error
  }
}

// Run seeding if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      seedInitialData()
        .then(() => {
          console.log('Seeding completed')
          process.exit(0)
        })
        .catch((error) => {
          console.error('Seeding failed:', error)
          process.exit(1)
        })
    })
    .catch((error) => {
      console.error('Database connection failed:', error)
      process.exit(1)
    })
}
