# Loggy

A modern, mobile-first personal expense tracking application built with React, TypeScript, and Supabase. Loggy helps you manage your finances with comprehensive expense and income tracking, analytics, and a responsive design optimized for mobile devices.

## ✨ Features

### 📱 Core Functionality
- **User Authentication**: Secure signup/login with Supabase Auth
- **Expense Management**: Add, edit, delete expenses with categories and types
- **Income Tracking**: Record and manage income sources
- **Real-time Dashboard**: Live overview with totals and recent transactions
- **Transaction History**: Comprehensive view of all financial transactions
- **Analytics Suite**: Interactive charts (Pie, Bar, Line) with monthly/yearly views
- **Expense Splitting**: 50/50 automatic splitting with "split with" tracking
- **Custom Expense Types**: Create and manage expense types with icon picker
- **User Settings**: Multi-currency support, preferences, cross-device sync

### 🎨 User Experience
- **Mobile-First Design**: Optimized for mobile devices with responsive layout
- **Smooth Animations**: 300ms transitions and modal animations
- **Toast Notifications**: Success/error feedback with undo functionality
- **Hamburger Navigation**: Mobile-optimized navigation menu
- **Card-based Mobile View**: Transaction cards for mobile, table view for desktop

### ⚙️ Technical Features
- **Real-time Updates**: Live dashboard updates with Supabase real-time subscriptions
- **Form Validation**: Comprehensive validation with React Hook Form
- **Error Handling**: Graceful error handling throughout the application
- **TypeScript**: Full type safety across the codebase
- **Responsive Breakpoints**: Uses Tailwind's `md:` breakpoint (768px) strategy

## 🛠️ Tech Stack

- **Frontend**: Vite + React 19.1.1 + TypeScript 5.8.3
- **Styling**: Tailwind CSS 4.1.13
- **Forms**: React Hook Form 7.62.0
- **Icons**: Heroicons 2.2.0
- **UI Components**: Headless UI 2.2.7
- **Backend**: Supabase (authentication + database + real-time)
- **Routing**: React Router DOM 7.8.2
- **Charts**: Chart.js 4.5.0 + React Chart.js 2 5.3.0
- **Currency**: Multi-currency support (USD, EUR, GBP, CAD, AUD)
- **Date Handling**: date-fns 4.1.0

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- A Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd loggy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**
   
   Set up your Supabase database with the required tables and triggers:
   - Import the SQL migrations from `database/migrations/`
   - Ensure Row Level Security (RLS) is enabled
   - Configure the authentication triggers

5. **Start the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📁 Project Structure

```
loggy/
├── src/
│   ├── components/
│   │   ├── Auth/             # Authentication components
│   │   ├── Dashboard/        # Main dashboard
│   │   ├── Expenses/         # Expense management
│   │   ├── Income/           # Income tracking
│   │   ├── History/          # Transaction history
│   │   ├── Analytics/        # Charts and analytics
│   │   ├── Settings/         # User preferences
│   │   ├── ExpenseTypes/     # Expense type management
│   │   └── UI/              # Reusable UI components
│   ├── context/
│   │   └── AuthContext.tsx   # Authentication state management
│   ├── hooks/
│   │   └── useUserPreferences.ts # User preferences hook
│   ├── lib/
│   │   └── supabase.ts       # Supabase client configuration
│   ├── utils/
│   │   ├── currency.ts       # Currency formatting utilities
│   │   └── splitwise.ts      # Expense splitting logic
│   ├── App.tsx               # Main app component
│   └── main.tsx             # App entry point
├── database/
│   └── migrations/           # Supabase database migrations
├── public/                   # Static assets
└── ...config files
```

## 🗄️ Database Schema

### Core Tables
- **categories**: User expense categories (Fixed/Variable/Optional)
- **expense_types**: Specific expense types within categories
- **expenses**: Individual expense transactions with splitting support
- **income**: Income tracking records
- **user_preferences**: Cross-device settings and preferences sync

### Key Features
- **Automatic Data Creation**: Default categories and expense types created on user signup
- **CASCADE Deletes**: Automatic cleanup when users are deleted
- **Row Level Security**: User data isolation
- **Real-time Subscriptions**: Live updates across the application

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Lint code with ESLint
- `npm run preview` - Preview production build locally

## 📚 Documentation

Additional documentation is available in the `/docs` folder:
- **[Splitwise Integration](docs/SPLITWISE_INTEGRATION.md)** - Guide for setting up Splitwise API integration
- **[Edge Function Deployment](docs/EDGE_FUNCTION_DEPLOYMENT.md)** - Instructions for deploying the Splitwise proxy Edge Function

## 📊 Key Features Deep Dive

### Expense Splitting
Loggy includes Splitwise-style expense splitting functionality:
- Split expenses equally among participants
- Track who owes whom
- Settle debts between friends
- Integration with existing expense categories

### Mobile Responsiveness
- **Mobile-First**: Designed primarily for mobile devices
- **Responsive Navigation**: Hamburger menu for mobile, horizontal nav for desktop
- **Adaptive Layouts**: Card view for mobile transactions, table view for desktop
- **Touch-Friendly**: Optimized touch targets and interactions

### Real-time Updates
- Dashboard updates automatically when new transactions are added
- Live expense totals and statistics
- Instant synchronization across devices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙋‍♂️ Support

If you encounter any issues or have questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include steps to reproduce any bugs

## 🚧 Roadmap

### Upcoming Features
- [ ] Budget tracking and alerts
- [ ] Recurring expense automation
- [ ] Export data to CSV/PDF
- [ ] Dark mode support
- [ ] Receipt photo uploads
- [x] Splitwise API integration ✅ COMPLETED
- [x] Multi-currency support ✅ COMPLETED
- [x] Custom expense type management ✅ COMPLETED
- [x] Advanced analytics suite ✅ COMPLETED

### Recently Fixed
- ✅ **Timezone Bug in Year/Month Extraction**: Fixed year tabs and Analytics showing incorrect periods due to timezone parsing. Changed from Date object parsing to direct string parsing for consistent results across timezones.
- ✅ **Internet/Phone Separation**: Successfully separated combined expense types
- ✅ **Database Integrity**: Cleaned up all duplicate entries and corruption
- ✅ **User Signup**: Fixed 500 errors with proper RLS policies
- ✅ **Preferences System**: Complete user preferences with cross-device sync

---

Built with ❤️ using React, TypeScript, and Supabase.