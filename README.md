# Optical Shop Order Management System

A full-stack web application for managing orders in an optical shop with Kanban board view, user authentication, and comprehensive order tracking.

## Features

- ✅ **CRUD Operations** - Create, read, update, and delete orders
- ✅ **Kanban Board View** - Visual board with status columns
- ✅ **Order Statuses** - Open, Order Placed, In Progress, Ready for Pickup, Delivered
- ✅ **Patient Information** - Patient name and RX details
- ✅ **Due Date Tracking** - Visual warnings for orders due within 3 days
- ✅ **User Authentication** - Sign up and login functionality
- ✅ **Comments System** - Add comments to orders with user tracking
- ✅ **Change History** - Complete audit trail of all order changes
- ✅ **Responsive Design** - Works on mobile, tablet, and desktop

## Tech Stack

- **Backend**: Node.js, Express, TypeScript, SQLite
- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Authentication**: JWT tokens
- **Date Handling**: date-fns

## Setup Instructions

1. **Install dependencies**:
   ```bash
   npm run install-all
   ```

2. **Set up environment variables**:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env and set your JWT_SECRET
   ```

3. **Create data directory**:
   ```bash
   mkdir -p backend/data
   ```

4. **Start the development servers**:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend dev server on http://localhost:3000

## Usage

1. **Register a new account** or **login** with existing credentials
2. **Create orders** using the "New Order" button
3. **View orders** on the Kanban board organized by status
4. **Click on an order** to view details, add comments, and see history
5. **Change order status** by selecting from the dropdown on the card
6. **Edit orders** from the detail page
7. Orders due within 3 days will show a red border and "Due Soon" tag

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express server setup
│   │   ├── database.ts       # Database initialization
│   │   ├── middleware/
│   │   │   └── auth.ts       # JWT authentication
│   │   └── routes/
│   │       ├── auth.ts       # Authentication routes
│   │       └── orders.ts     # Order CRUD routes
│   └── data/                 # SQLite database location
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts (Auth)
│   │   └── pages/            # Page components
│   └── public/
└── package.json              # Root package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get single order with comments and history
- `POST /api/orders` - Create new order
- `PUT /api/orders/:id` - Update order
- `DELETE /api/orders/:id` - Delete order
- `POST /api/orders/:id/comments` - Add comment to order

## Database Schema

- **users** - User accounts
- **orders** - Order information
- **comments** - Order comments
- **order_history** - Change history tracking

# AMillie
