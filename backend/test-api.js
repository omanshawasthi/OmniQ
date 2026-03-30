// Quick API test
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'admin@queueless.com',
    password: 'admin123'
  })
})
.then(response => response.json())
.then(data => {
  console.log('✅ API Response:', data);
})
.catch(error => {
  console.error('❌ API Error:', error);
});
