// Create test users
const createTestUsers = async () => {
  try {
    console.log('Creating test users...');
    
    // Create admin user
    const adminResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Admin User',
        email: 'admin@queueless.com',
        password: 'admin123',
        phone: '1234567890',
        role: 'ADMIN'
      })
    });
    
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      console.log('Admin user created:', adminData.data.user.email);
    } else {
      console.log('Admin user may already exist');
    }

    // Create staff user
    const staffResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Staff User',
        email: 'staff@queueless.com',
        password: 'staff123',
        phone: '1234567891',
        role: 'STAFF'
      })
    });
    
    if (staffResponse.ok) {
      const staffData = await staffResponse.json();
      console.log('Staff user created:', staffData.data.user.email);
    } else {
      console.log('Staff user may already exist');
    }

    // Create operator user
    const operatorResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Operator User',
        email: 'operator@queueless.com',
        password: 'operator123',
        phone: '1234567892',
        role: 'OPERATOR'
      })
    });
    
    if (operatorResponse.ok) {
      const operatorData = await operatorResponse.json();
      console.log('Operator user created:', operatorData.data.user.email);
    } else {
      console.log('Operator user may already exist');
    }

    // Create regular user
    const userResponse = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Regular User',
        email: 'user@queueless.com',
        password: 'user123',
        phone: '1234567893',
        role: 'USER'
      })
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('Regular user created:', userData.data.user.email);
    } else {
      console.log('Regular user may already exist');
    }

    console.log('✅ Test user setup completed!');
    console.log('\nLogin credentials:');
    console.log('Admin: admin@queueless.com / admin123');
    console.log('Staff: staff@queueless.com / staff123');
    console.log('Operator: operator@queueless.com / operator123');
    console.log('User: user@queueless.com / user123');
    
  } catch (error) {
    console.error('❌ Error creating test users:', error.message);
  }
};

createTestUsers();
