// In-memory database for testing when MongoDB is not available
class MemoryDB {
  constructor() {
    this.collections = {
      users: [],
      tokens: [],
      branches: [],
      departments: [],
      counters: [],
      queuelogs: [],
      notifications: []
    };
    this.counters = {
      users: 1,
      tokens: 1,
      branches: 1,
      departments: 1,
      counters: 1,
      queuelogs: 1,
      notifications: 1
    };
  }

  // Generate unique ID
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  // Find documents
  find(collection, query = {}) {
    let docs = this.collections[collection] || [];
    
    // Simple query matching
    if (Object.keys(query).length > 0) {
      docs = docs.filter(doc => {
        return Object.keys(query).every(key => {
          if (query[key] instanceof RegExp) {
            return query[key].test(doc[key]);
          }
          return doc[key] === query[key];
        });
      });
    }
    
    return Promise.resolve(docs);
  }

  // Find one document
  findOne(collection, query = {}) {
    const docs = this.collections[collection] || [];
    
    const doc = docs.find(doc => {
      return Object.keys(query).every(key => {
        if (query[key] instanceof RegExp) {
          return query[key].test(doc[key]);
        }
        return doc[key] === query[key];
      });
    });
    
    return Promise.resolve(doc || null);
  }

  // Create document
  create(collection, data) {
    const doc = {
      ...data,
      _id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.collections[collection].push(doc);
    return Promise.resolve(doc);
  }

  // Update document
  updateOne(collection, query, update) {
    const docs = this.collections[collection] || [];
    const index = docs.findIndex(doc => {
      return Object.keys(query).every(key => doc[key] === query[key]);
    });
    
    if (index !== -1) {
      docs[index] = { ...docs[index], ...update, updatedAt: new Date() };
      return Promise.resolve({ modifiedCount: 1 });
    }
    
    return Promise.resolve({ modifiedCount: 0 });
  }

  // Delete document
  deleteOne(collection, query) {
    const docs = this.collections[collection] || [];
    const index = docs.findIndex(doc => {
      return Object.keys(query).every(key => doc[key] === query[key]);
    });
    
    if (index !== -1) {
      docs.splice(index, 1);
      return Promise.resolve({ deletedCount: 1 });
    }
    
    return Promise.resolve({ deletedCount: 0 });
  }

  // Count documents
  countDocuments(collection, query = {}) {
    const docs = this.collections[collection] || [];
    
    const count = docs.filter(doc => {
      return Object.keys(query).every(key => doc[key] === query[key]);
    }).length;
    
    return Promise.resolve(count);
  }

  // Aggregate (simplified)
  aggregate(collection, pipeline) {
    const docs = this.collections[collection] || [];
    
    // Simple group by implementation
    if (pipeline.length > 0 && pipeline[0].$group) {
      const groupStage = pipeline[0].$group;
      const result = {};
      
      docs.forEach(doc => {
        const key = typeof groupStage._id === 'object' 
          ? JSON.stringify(groupStage._id)
          : doc[groupStage._id] || 'null';
        
        if (!result[key]) {
          result[key] = { _id: groupStage._id };
          
          // Initialize other fields
          Object.keys(groupStage).forEach(field => {
            if (field !== '_id') {
              result[key][field] = 0;
            }
          });
        }
        
        // Apply group operations
        Object.keys(groupStage).forEach(field => {
          if (field !== '_id') {
            const operation = groupStage[field];
            if (operation.$sum) {
              if (operation.$sum === 1) {
                result[key][field]++;
              } else if (typeof operation.$sum === 'string') {
                result[key][field] += doc[operation.$sum] || 0;
              }
            }
            if (operation.$avg) {
              result[key][field] = (result[key][field] || 0) + (doc[operation.$avg] || 0);
            }
          }
        });
      });
      
      // Calculate averages
      Object.values(result).forEach(item => {
        Object.keys(groupStage).forEach(field => {
          if (field !== '_id' && groupStage[field].$avg) {
            item[field] = item[field] / docs.length;
          }
        });
      });
      
      return Promise.resolve(Object.values(result));
    }
    
    return Promise.resolve(docs);
  }
}

// Create global instance
const memoryDB = new MemoryDB();

// Initialize with test data
const initializeTestData = async () => {
  // Check if users already exist
  const existingUsers = await memoryDB.find('users');
  if (existingUsers.length === 0) {
    // Create test users
    const testUsers = [
      {
        name: 'Admin User',
        email: 'admin@queueless.com',
        password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ',
        phone: '1234567890',
        role: 'ADMIN',
        isActive: true
      },
      {
        name: 'Staff User',
        email: 'staff@queueless.com',
        password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ',
        phone: '1234567891',
        role: 'STAFF',
        isActive: true
      },
      {
        name: 'Operator User',
        email: 'operator@queueless.com',
        password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ',
        phone: '1234567892',
        role: 'OPERATOR',
        isActive: true
      },
      {
        name: 'Regular User',
        email: 'user@queueless.com',
        password: '$2a$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ',
        phone: '1234567893',
        role: 'USER',
        isActive: true
      }
    ];

    for (const user of testUsers) {
      await memoryDB.create('users', user);
    }

    console.log('✅ Test users initialized in memory database');
  }
};

// Initialize test data
initializeTestData();

export default memoryDB;
