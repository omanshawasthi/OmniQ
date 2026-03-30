# QUEUELESS - Smart Queue & Wait-Time Optimization Platform

A production-ready MERN stack web application that solves the problem of long physical waiting lines in hospitals, government offices, campus offices, banks, and other high-footfall service centers.

## 🚀 Features

### Core Features
- **Digital Token Generation** - Online booking and walk-in token creation
- **Real-Time Queue Tracking** - Live queue status with Socket.IO
- **Wait-Time Prediction** - Intelligent ETA calculations
- **Role-Based Access Control** - User, Staff, Operator, and Admin roles
- **Multi-Branch Support** - Manage multiple service locations
- **Analytics Dashboard** - Comprehensive performance metrics
- **Email Notifications** - Automated booking and queue alerts
- **QR Code Check-in** - Digital token verification
- **Public Display Mode** - TV display for waiting areas

### Advanced Features
- **Priority Queue System** - Handle urgent cases efficiently
- **Counter Management** - Assign operators to specific counters
- **No-Show Handling** - Automated missed token processing
- **Queue State Machine** - Robust token lifecycle management
- **Race Condition Safety** - Concurrent operation handling
- **Event-Driven Architecture** - Scalable real-time updates

## 🛠 Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** for styling
- **React Router DOM** for navigation
- **Axios** for API calls
- **TanStack Query** for server state
- **React Hook Form** + Zod for forms
- **Socket.IO Client** for real-time updates
- **Zustand** for state management
- **Recharts** for analytics
- **Lucide React** for icons

### Backend
- **Node.js** with Express.js
- **MongoDB Atlas** with Mongoose
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Socket.IO** for real-time features
- **Nodemailer** for email notifications
- **QR Code** generation

### Development Tools
- **ESLint** and **Prettier** for code quality
- **Environment variables** for configuration
- **Modular architecture** with separation of concerns

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB Atlas account
- Gmail account (for email notifications)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd queueless
```

### 2. Backend Setup
```bash
cd backend
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Update the following variables:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/queueless

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# CORS
FRONTEND_URL=http://localhost:3000
```

### 4. Frontend Setup
```bash
cd frontend
npm install
```

### 5. Run the Application

#### Backend
```bash
cd backend
npm run dev
```

#### Frontend
```bash
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🏗 Project Structure

```
queueless/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, JWT, Email config
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── sockets/         # Socket.IO handlers
│   │   ├── utils/           # Helpers and constants
│   │   └── validators/      # Input validation
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Zustand stores
│   │   ├── services/        # API services
│   │   ├── utils/           # Helper functions
│   │   └── styles/          # Global styles
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🔐 Authentication & Roles

### User Roles
1. **User/Visitor** - Book tokens, view queue status
2. **Staff/Reception** - Create walk-in tokens, manage queues
3. **Operator/Service Agent** - Serve tokens at counters
4. **Admin** - Full system management and analytics

### Permission Matrix
| Feature | User | Staff | Operator | Admin |
|---------|------|-------|----------|-------|
| Book Token | ✅ | ✅ | ❌ | ✅ |
| Create Walk-in | ❌ | ✅ | ❌ | ✅ |
| Control Queue | ❌ | ✅ | ✅ | ✅ |
| Manage Branches | ❌ | ❌ | ❌ | ✅ |
| View Analytics | ❌ | ❌ | ❌ | ✅ |

## 📊 Database Schema

### Core Models
- **User** - User accounts and roles
- **Branch** - Service locations
- **Department** - Service types within branches
- **Counter** - Service desks/stations
- **Token** - Queue tickets with lifecycle states
- **QueueLog** - Audit trail for queue actions
- **Notification** - User notifications

### Token States
```
waiting → serving → completed
waiting → skipped → recalled → waiting
waiting → held → waiting
waiting → missed
waiting → cancelled
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile

### Tokens
- `POST /api/tokens/book` - Book online token
- `POST /api/tokens/walk-in` - Create walk-in token
- `GET /api/tokens/my-tokens` - Get user's tokens
- `PUT /api/tokens/:id/cancel` - Cancel token

### Queue Management
- `POST /api/queue/call-next` - Call next token
- `POST /api/queue/skip/:id` - Skip token
- `POST /api/queue/hold/:id` - Hold token
- `POST /api/queue/complete/:id` - Complete service
- `GET /api/queue/status/:branchId/:departmentId` - Get queue status

### Management
- `GET/POST/PUT/DELETE /api/branches` - Branch management
- `GET/POST/PUT/DELETE /api/departments` - Department management
- `GET/POST/PUT/DELETE /api/counters` - Counter management
- `GET/POST/PUT/DELETE /api/users` - User management

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/tokens/stats` - Token statistics
- `GET /api/analytics/reports/daily` - Daily reports

## 🔄 Real-Time Events

### Socket.IO Events
- `join_room` - Join specific rooms
- `token_status_changed` - Token state updates
- `queue_updated` - Queue status changes
- `token_called` - Token being served
- `notification` - User notifications
- `public_display_update` - Public screen updates

### Room Structure
- `branch_{branchId}` - Branch-specific updates
- `department_{departmentId}` - Department-specific updates
- `counter_{counterId}` - Counter-specific updates
- `user_{userId}` - User-specific notifications

## 📧 Email Notifications

### Supported Events
- Booking confirmation
- Token approaching notification
- Missed token alerts
- Queue delay updates
- Token completion

### Email Templates
- Responsive HTML templates
- Professional branding
- Clear call-to-action buttons

## 🖥 Public Display

### Features
- Real-time queue updates
- Currently serving tokens
- Next in queue display
- Queue statistics
- Professional TV-friendly interface

### Access
Navigate to `/display/:branchId` for branch-specific public display.

## 🔧 Development

### Code Quality
- ESLint configuration for code standards
- Prettier for consistent formatting
- Modular architecture for maintainability
- Comprehensive error handling
- Input validation on both frontend and backend

### Best Practices
- Environment-based configuration
- Secure authentication with JWT
- Rate limiting for API protection
- Proper error handling and logging
- Responsive design for all screen sizes

## 🚀 Deployment

### Environment Variables
Ensure all environment variables are properly configured in production:
- Database connection strings
- JWT secrets
- Email credentials
- CORS origins

### Build Process
```bash
# Frontend build
cd frontend
npm run build

# Backend production
cd backend
npm start
```

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests (when implemented)
cd frontend
npm test
```

## 📈 Performance

### Optimization
- Database indexing for faster queries
- React Query caching for API calls
- Socket.IO room-based broadcasting
- Lazy loading for large datasets
- Image optimization for QR codes

### Monitoring
- Real-time queue performance metrics
- API response time tracking
- Database query optimization
- Socket.IO connection monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints

## 🎯 Future Enhancements

- Mobile applications (iOS/Android)
- SMS notifications
- Advanced analytics with ML predictions
- Multi-language support
- Integration with calendar systems
- Voice announcements for public displays
- Kiosk mode for self-service
- Advanced reporting and exports
- Integration with third-party systems
