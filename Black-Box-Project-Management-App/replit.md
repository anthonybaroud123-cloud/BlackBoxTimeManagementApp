# TimeTracker Pro - Project Time Management Application

## Overview

TimeTracker Pro is a comprehensive time tracking and project management application designed for teams and businesses. The application enables users to track time across projects and tasks, manage team members, analyze productivity metrics, and generate financial reports. It features a modern React frontend with a Node.js/Express backend, utilizing PostgreSQL for data persistence and following Material Design 3 principles for UI consistency.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and building
- **UI Framework**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management with custom query client
- **Routing**: Wouter for lightweight client-side routing
- **Design System**: Material Design 3 with productivity-focused customizations, featuring a comprehensive color palette and typography system using Inter font
- **Theme Support**: Light/dark mode toggle with CSS custom properties and Tailwind CSS dark mode support

### Backend Architecture
- **Runtime**: Node.js with TypeScript and ESM modules
- **Framework**: Express.js for REST API endpoints
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Database Provider**: Neon serverless PostgreSQL with connection pooling
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Management**: Connect-pg-simple for PostgreSQL-backed sessions

### Data Model Design
- **Users**: Authentication and role-based access (admin/regular users)
- **Projects**: Project lifecycle management with status tracking
- **Project Scopes**: Categorization of work within projects (e.g., Frontend, Backend, Testing)
- **Project Members**: User assignment to projects with cost and billing rates
- **Tasks**: Granular work items with priority levels, assignments, and time estimates
- **Time Entries**: Detailed time tracking with project, scope, and task associations

### Authentication & Authorization
- **Role-based Access**: Admin users have full system access while regular users have restricted permissions
- **Session-based Authentication**: PostgreSQL-backed sessions for secure user management
- **Route Protection**: Component-level access control based on user roles

### Development & Build Tools
- **Build System**: Vite for fast development and optimized production builds
- **Type Safety**: Comprehensive TypeScript configuration with strict mode enabled
- **Code Quality**: ESLint and Prettier integration through development tooling
- **Path Aliases**: Organized import structure with @ aliases for clean code organization

## External Dependencies

### Core Infrastructure
- **Database**: Neon serverless PostgreSQL for scalable data storage
- **Email Service**: SendGrid for transactional email capabilities
- **Development Platform**: Replit-optimized with custom plugins and error handling

### UI Component Libraries
- **Radix UI**: Complete suite of headless UI primitives for accessibility and functionality
- **Recharts**: Data visualization library for analytics charts and graphs
- **Lucide React**: Comprehensive icon library for consistent iconography
- **React Hook Form**: Form management with Zod validation schemas

### Development Tools
- **Drizzle ORM**: Type-safe database operations with PostgreSQL dialect
- **TanStack Query**: Server state management with caching and synchronization
- **Date-fns**: Date manipulation and formatting utilities
- **Class Variance Authority**: Type-safe CSS class composition for component variants

### Potential Integrations
- **Microsoft Graph**: OAuth integration for Microsoft 365 services
- **Calendar APIs**: Time tracking integration with external calendar systems
- **Project Management Tools**: Import/export capabilities with popular PM platforms