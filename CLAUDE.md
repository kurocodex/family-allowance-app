# Family Allowance Management App (家族向けお小遣い管理アプリ)

## 📋 Project Overview

A comprehensive family allowance management system designed to teach children financial literacy through gamified tasks and point-based rewards. The application provides separate interfaces for parents and children, with robust family management and Supabase integration for scalable data management.

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 4.3.0
- **Styling**: Tailwind CSS 3.2.7 with custom component classes
- **UI Components**: Custom components with Lucide React icons
- **Form Management**: React Hook Form 7.43.1
- **Routing**: React Router DOM 6.8.1

### Backend & Database
- **Database**: Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication**: Supabase Auth with email/password
- **Real-time**: Supabase real-time subscriptions
- **Storage**: Hybrid approach - Supabase for production data, localStorage for local development

### State Management
- **Global State**: React Context API with custom hooks
- **Authentication**: Custom `useAuth` hook with Supabase integration
- **Local State**: React Hooks (useState, useEffect)

## 🗄️ Database Schema

### Core Tables
1. **families** - Family units with invite codes
2. **users** - User profiles linked to Supabase Auth
3. **tasks** - Task/quest definitions
4. **task_completions** - Task completion submissions and approvals
5. **point_transactions** - All point movements (earned, exchanged, investment)
6. **events** - Special events with dynamic point configurations
7. **event_results** - Event participation and results
8. **rate_rules** - Dynamic point calculation rules

### Security Features
- Row Level Security (RLS) policies ensure family data isolation
- All tables filtered by family_id for data security
- Automatic cascade deletes for data integrity

## 👥 User Roles & Features

### Parent Dashboard Features
- **Family Management**: Create and manage family members, invite codes
- **Task Management**: Create, edit, delete tasks with category assignments
- **Approval System**: Review and approve/reject child task submissions
- **Event Management**: Create score-based, evaluation-based, and completion-based events
- **Rate Management**: Dynamic point calculation rules (age-based, period-based, performance-based)
- **Statistics & Reports**: Comprehensive analytics with charts and metrics
- **Point Exchange**: Convert points to real currency with configurable rates

### Child Dashboard Features
- **Quest Interface**: Gamified task interface with progress tracking
- **Task Submission**: Submit completed tasks with comments
- **Event Participation**: Submit results for special events
- **Personal Statistics**: View achievements, progress, and point history
- **Point Balance**: Real-time point balance with transaction history

## 🎮 Core Features Implementation

### Task System
- **Categories**: 家事 (Housework), 勉強 (Study), 運動 (Exercise), その他 (Others)
- **Difficulty Levels**: EASY, MEDIUM, HARD
- **Assignment**: Tasks can be assigned to specific children or all children
- **Recurring Tasks**: Support for repeatable tasks
- **Status Tracking**: PENDING → APPROVED/REJECTED workflow

### Event System
- **Score-Based Events**: Test scores with threshold-based point rewards
- **Evaluation-Based Events**: Qualitative assessments (とてもよくできました, etc.)
- **Completion-Based Events**: Simple completion with bonus points
- **Dynamic Configurations**: JSON-based point configuration system

### Point System
- **Earning**: Points awarded for completed tasks and events
- **Exchange**: Convert points to currency (configurable rate: 10pt = 1¥)
- **Rate Rules**: Dynamic multipliers based on age, time periods, or performance
- **Transaction History**: Complete audit trail of all point movements

### Family Management
- **Supabase Integration**: Real database with authentication
- **Child Account Creation**: Automated email+password generation for children
- **Family Isolation**: RLS ensures families only see their own data
- **Invite System**: Unique family codes for joining families

## 📁 Project Structure

```
src/
├── components/           # React Components
│   ├── AuthPage.tsx         # Login/Registration UI
│   ├── Dashboard.tsx        # Main dashboard router
│   ├── ParentDashboard.tsx  # Parent interface with tabs
│   ├── ChildDashboard.tsx   # Child interface with gamification
│   ├── FamilyManagement.tsx # Family member management
│   ├── EventManagement.tsx  # Event creation and management
│   ├── Statistics.tsx       # Analytics and reporting
│   ├── RateManagement.tsx   # Dynamic rate rule configuration
│   └── PointExchange.tsx    # Point-to-currency exchange
├── hooks/                # Custom React Hooks
│   └── useAuth.tsx          # Authentication state management
├── types/                # TypeScript Type Definitions
│   └── index.ts             # All interface definitions
├── utils/                # Utility Functions
│   ├── supabase.ts          # Supabase client configuration
│   ├── storage.ts           # LocalStorage operations (fallback)
│   └── dateUtils.ts         # Date calculation utilities
├── App.tsx               # Main application component
├── main.tsx              # Application entry point
└── index.css             # Tailwind CSS with custom components
```

## 🎨 UI/UX Design

### Design System
- **Color Palette**: Purple/Pink gradient theme with accent colors
- **Typography**: System fonts with clear hierarchy
- **Layout**: Responsive grid system with card-based components
- **Animations**: Subtle hover effects and transitions
- **Icons**: Lucide React with emoji accents for child-friendly UI

### Component Library
- **Cards**: `.card`, `.card-cute` for different contexts
- **Buttons**: `.btn-primary`, `.btn-secondary` with gradients
- **Forms**: `.input-field` with consistent styling
- **Quest Cards**: Specialized styling for gamification

### Responsive Design
- Mobile-first approach with responsive breakpoints
- Grid layouts adapt from 1 column (mobile) to 4 columns (desktop)
- Touch-friendly button sizes and spacing

## 🔐 Authentication & Security

### Authentication Flow
1. **Registration**: Email/password with role selection (PARENT/CHILD)
2. **Family Creation**: Parents automatically create new families
3. **Child Accounts**: Parents can create child accounts with auto-generated credentials
4. **Session Management**: Supabase handles token refresh and persistence

### Security Measures
- **Row Level Security**: Database-level access control
- **Family Isolation**: Users can only access their family data
- **Input Validation**: Form validation and TypeScript type safety
- **Error Handling**: Graceful error handling with user feedback

## 📊 Data Flow

### State Management Pattern
```
Supabase DB ↔ useAuth Hook ↔ Components ↔ LocalStorage (fallback)
```

### Key Data Operations
1. **Task Creation**: Parent creates → Database → Real-time update to children
2. **Task Completion**: Child submits → Database → Parent approval interface
3. **Point Calculation**: Dynamic rules applied → Transaction recorded → Balance updated
4. **Family Management**: Supabase Auth integration → Profile creation → Family association

## 🚀 Development & Deployment

### Development Setup
```bash
npm install          # Install dependencies
npm run dev         # Start development server (port 5173)
npm run build       # Production build
npm run preview     # Preview production build
```

### Environment Variables
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Build Configuration
- **Vite**: Fast HMR and optimized builds
- **TypeScript**: Strict type checking enabled
- **Tailwind CSS**: PostCSS integration with purging
- **Code Splitting**: Automatic route-based splitting

## 📈 Current Implementation Status

### ✅ Completed Features
- **Authentication System**: Full Supabase integration with role-based access
- **Family Management**: Create families, add children, manage members with real-time sync
- **Task Management**: Complete CRUD operations with approval workflow
- **Event System**: Three event types with dynamic point calculations
- **Point Exchange**: Currency conversion with transaction history
- **Rate Management**: Dynamic point calculation rules
- **Statistics**: Comprehensive analytics and reporting
- **Responsive UI**: Mobile-friendly interface with gamification
- **Database Integration**: Production-ready Supabase setup with RLS
- **Performance Optimization**: Code splitting, lazy loading, and optimized bundle sizes
- **Data Synchronization**: Centralized family data management across all dashboard tabs
- **GitHub Integration**: Automated deployment pipeline with Vercel

### 🔄 Recent Improvements (Latest Release)
- **Family Data Synchronization**: Fixed issue where newly added family members weren't appearing in other tabs
- **Component Architecture**: Migrated to centralized data passing via props instead of local data fetching
- **Build Optimization**: Reduced bundle sizes with optimized chunk splitting (max 142KB per chunk)
- **Error Handling**: Enhanced database connection error handling with user-friendly messages

### 🧪 Technical Debt & Areas for Improvement
- **Error Boundaries**: Add React error boundaries for better error handling
- **Loading States**: Implement skeleton loading for better UX
- **Caching**: Add data caching strategies for performance
- **Testing**: Unit and integration tests needed
- **Internationalization**: Multi-language support preparation
- **Database Migration**: Add database schema versioning and migration system
- **Real-time Updates**: Implement Supabase real-time subscriptions for live data updates

### 🎯 Next Development Opportunities

#### 🚀 High-Priority Features
1. **Achievement & Badge System**
   - Create achievement definitions (e.g., "Complete 10 tasks", "100% completion rate")
   - Design badge visual system with unlock animations
   - Track progress towards achievements
   - Display achievement showcase in child profiles

2. **Real-time Notifications**
   - Implement Supabase real-time subscriptions
   - Browser push notifications for task approvals
   - In-app notification center
   - Email notifications for parents

3. **Photo Evidence System**
   - Task completion photo uploads using Supabase Storage
   - Image preview and approval workflow
   - Photo gallery for completed tasks
   - Basic image compression and validation

4. **Investment & Savings System**
   - Savings accounts for children with interest rates
   - Goal-based saving challenges
   - Investment simulation with virtual portfolios
   - Compound interest education tools

#### 🔧 Technical Enhancements
5. **Testing Infrastructure**
   - Unit tests with Vitest/Jest
   - Component testing with React Testing Library
   - E2E testing with Playwright
   - CI/CD pipeline with automated testing

6. **Advanced Analytics**
   - Detailed performance metrics dashboard
   - Trend analysis and predictions
   - Export functionality (PDF/CSV reports)
   - Parent insights and recommendations

7. **Mobile App**
   - React Native or Progressive Web App (PWA)
   - Native mobile notifications
   - Offline functionality with sync
   - Camera integration for photo uploads

8. **Advanced Task Features**
   - Recurring task scheduling with cron-like syntax
   - Task dependencies and workflows
   - Collaborative family tasks
   - Task templates and categories customization

#### 🎨 UX/UI Improvements
9. **Enhanced Gamification**
   - Progress bars and level systems
   - Virtual pet/avatar that grows with points
   - Family leaderboards and competitions
   - Seasonal events and challenges

10. **Accessibility & Internationalization**
    - Full WCAG 2.1 AA compliance
    - Multi-language support (English, Japanese, etc.)
    - Right-to-left language support
    - Voice command integration

#### 🔗 Integration & API Features
11. **External Integrations**
    - Calendar integration (Google Calendar, Apple Calendar)
    - Bank account integration for real money management
    - School grade import systems
    - Smart home integration (chore completion verification)

12. **Advanced Security**
    - Two-factor authentication
    - Audit logging system
    - GDPR compliance tools
    - Data export/deletion tools

## 🛠️ Key Technical Decisions

### Why Supabase?
- **Real-time capabilities**: Instant updates across family members
- **Built-in authentication**: Reduces development complexity
- **PostgreSQL**: Robust relational database with advanced features
- **Row Level Security**: Perfect for multi-tenant family data

### Why React + TypeScript?
- **Type Safety**: Reduces runtime errors and improves maintainability
- **Component Reusability**: Modular architecture for easy extension
- **Rich Ecosystem**: Extensive library support and community

### Why Tailwind CSS?
- **Rapid Development**: Utility-first approach speeds up UI development
- **Consistency**: Design system enforcement through configuration
- **Performance**: Optimized CSS output with purging

## 📚 Development Guidelines

### Code Organization
- **Feature-based structure**: Components grouped by functionality
- **Type definitions**: Centralized in `/types` directory
- **Utility functions**: Shared logic in `/utils` directory
- **Custom hooks**: Reusable stateful logic

### Naming Conventions
- **Components**: PascalCase with descriptive names
- **Files**: Match component names exactly
- **Functions**: camelCase with verb-noun pattern
- **Types**: PascalCase with descriptive interfaces

### Best Practices
- **Prop drilling**: Minimize through context and custom hooks
- **State management**: Keep state close to where it's used
- **Error handling**: Graceful degradation with user feedback
- **Performance**: Lazy loading and code splitting where appropriate

This application represents a production-ready family allowance management system with comprehensive features for both parents and children, built with modern web technologies and best practices.