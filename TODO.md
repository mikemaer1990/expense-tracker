# Expense Tracker - Todo List

## 🔧 **Immediate Fixes** ✅
- ✅ Fix Settings page toast error (moved to useEffect)
- ✅ Fix Settings page navbar (replaced with UserDropdown)

## 🚀 **New Features - Top Priority**

### 1. Split Cost Feature
**Priority**: High
**Description**: Allow splitting expenses between people/categories
**Features**:
- Split by percentage or fixed amounts
- Multiple people/categories per expense
- Automatic calculation and tracking
- Integration with existing expense system

### 2. OAuth Splitwise Integration
**Priority**: High  
**Description**: Explore connection with Splitwise API
**Research Areas**:
- Splitwise API capabilities and limitations
- OAuth authentication flow
- Data sync possibilities (import/export)
- User experience integration

## 📊 **UX & Core Improvements**

### 3. Filter UI Improvements
**Priority**: Medium-High
**Status**: Designed, ready to implement
**Description**: Modern pill-style filters for mobile, enhanced desktop filtering
**Features**:
- Mobile: Horizontal scroll pills ("All", "Expenses", "Income", "Date ↓", "Amount ↓")
- Desktop: Inline button tabs + right-aligned sort controls
- Touch-friendly, Instagram/Twitter style interface

### 4. Dashboard Analytics
**Priority**: Medium-High
**Description**: Enhanced dashboard with charts and insights
**Features**:
- Monthly spending trends
- Category breakdown charts
- Month-over-month comparisons
- Surplus/deficit tracking
- Visual spending pattern analysis

### 5. Category Loading Race Condition
**Priority**: Medium
**Description**: Fix brief "no categories found" flash for new users
**Solutions**:
- Retry logic with 1.5s delay
- Loading state instead of "no categories" message
- Optimistic UI with default categories

## 🗂️ **Major Features**

### 6. Spreadsheet Data Table Component
**Priority**: Medium
**Status**: Fully designed in todo_sept_10.md
**Description**: Comprehensive spreadsheet-style financial data view
**Features**:
- Dynamic category management
- Editable cells with inline editing
- Time period views (monthly/quarterly/yearly)
- Export capabilities (Excel, CSV, PDF)
- Mobile-responsive accordion view

### 7. Income Tracking Improvements  
**Priority**: Medium
**Description**: Enhanced income management system
**Features**:
- Income categories (Salary, Freelance, Investments, etc.)
- Better recurring income support
- Income vs expenses dashboard analytics

### 8. Budget Tracking System
**Priority**: Medium-Low
**Description**: Monthly budget limits and warnings
**Features**:
- Set monthly budget limits per category
- Visual progress indicators
- Warning system (80% yellow, 100% red)
- Budget vs actual spending reports

## 🔧 **Technical Improvements**

### 9. Export Functionality
**Priority**: Medium
**Description**: Data export capabilities
**Features**:
- CSV/Excel export
- Date range selection
- Category filtering
- Formatted reports

### 10. Recurring Transactions
**Priority**: Medium-Low
**Description**: Automated recurring expenses and income
**Features**:
- Weekly/monthly/yearly frequencies
- Auto-generation system
- Management interface
- Integration with budget tracking

### 11. Search & Advanced Filtering
**Priority**: Low
**Description**: Enhanced search capabilities
**Features**:
- Text search across transactions
- Date range pickers
- Multiple filter combinations
- Search result highlighting

### 12. PWA Features
**Priority**: Low
**Description**: Progressive Web App capabilities
**Features**:
- Offline support with local storage
- Install as mobile app
- Background sync
- Push notifications for budget alerts

## 📋 **Implementation Notes**

### Recently Completed ✅
- User preferences migration to Supabase with localStorage fallback
- Mobile-responsive design across all components
- Core authentication and database setup
- Basic expense/income tracking functionality
- Toast notification system

### Current Project Status
- **Health Score**: 9/10
- **Core Functionality**: Complete and stable
- **Database**: Fully set up with proper triggers and RLS
- **Mobile Experience**: Optimized and tested
- **Ready for**: Feature expansion and UX polish

### Development Environment
- ✅ All dependencies up to date
- ✅ Database triggers working correctly  
- ✅ Development server running smoothly
- ✅ TypeScript configuration optimal
- ✅ Mobile testing environment ready

---

**Last Updated**: September 10, 2025  
**Next Session Priority**: Split cost feature + Splitwise OAuth research