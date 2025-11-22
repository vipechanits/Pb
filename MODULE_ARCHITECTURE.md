# PAYBACK247 - Modular SaaS Architecture

## Module Structure

### Frontend (client/src/modules)

#### 1. **Registration Module** (`registration/`)
- **Purpose**: User signup, verification, onboarding
- **Components**: Signup form, Email verification, Welcome flow
- **Pages**: signup.tsx, verify-email.tsx, forgot-password.tsx, reset-password.tsx
- **Services**: Authentication, Email verification
- **Types**: RegistrationState, UserRegistration

#### 2. **Activation Module** (`activation/`)
- **Purpose**: User activation, 8-payment system, profile completion
- **Components**: Activation form, Payment cards, Profile setup
- **Pages**: user-activation.tsx, user-confirmation.tsx, profile.tsx
- **Services**: Activation workflow, Payment tracking
- **Types**: ActivationState, PaymentStatus

#### 3. **Binary Module** (`binary/`)
- **Purpose**: Binary tree management, pair matching, leg assignment
- **Components**: BinaryTreeView, MiniBinaryTree, Binary match queue
- **Pages**: user-binary-tree.tsx, binary-pair-matching-history.tsx
- **Services**: Binary placement, Pair matching
- **Types**: BinaryNode, PlacementLeg

#### 4. **Matrix Module** (`matrix/`)
- **Purpose**: Global matrix, 5-level income, matrix positioning
- **Components**: MatrixGrid, MatrixTreeView, MiniMatrixTree
- **Pages**: user-global-matrix.tsx, matrix-income-history.tsx
- **Services**: Matrix placement, Income calculation
- **Types**: MatrixPosition, MatrixLevel

#### 5. **Re-entry Module** (`reentry/`)
- **Purpose**: Multi-cycle re-entry, matrix completion tracking
- **Components**: Re-entry form, Eligibility check, Cycle status
- **Pages**: reentry.tsx, additional-reentry.tsx, admin-reentry.tsx
- **Services**: Re-entry workflow, Cycle management
- **Types**: ReentryState, CycleStatus

#### 6. **Admin Module** (`admin/`)
- **Purpose**: Admin dashboard, user management, configuration
- **Components**: AdminDashboard, UserManagement, SystemConfig
- **Pages**: admin-dashboard.tsx, admin-users.tsx, admin-config.tsx, admin-payments.tsx, admin-analytics.tsx, admin-settings.tsx
- **Services**: Admin operations, Configuration management
- **Types**: AdminPermissions, SystemConfig

#### 7. **Backup Module** (`backup/`)
- **Purpose**: Database backup, restore, data export
- **Components**: Backup controls, Restore interface
- **Pages**: admin-backups.tsx
- **Services**: Backup scheduling, Google Drive integration
- **Types**: BackupMetadata, RestoreStatus

#### 8. **Common Module** (`common/`)
- **Purpose**: Shared utilities, types, components
- **Components**: UI components (Button, Card, etc.), Theme toggle, Notification bell
- **Hooks**: useWebSocket, useSystemConfig, useToast
- **Services**: API client, Auth context
- **Types**: Common types used across modules

### Backend (server/modules)

#### 1. **Registration Module** (`registration/`)
- `routes/auth.ts` - Login, signup, password reset endpoints
- `services/registration.ts` - Registration logic
- `middleware/auth.ts` - Auth middleware

#### 2. **Activation Module** (`activation/`)
- `routes/activation.ts` - Activation endpoints
- `services/activation.ts` - 8-payment workflow
- `services/payment.ts` - Payment processing

#### 3. **Binary Module** (`binary/`)
- `routes/binary.ts` - Binary tree endpoints
- `services/binary-placement.ts` - Placement logic
- `services/binary-matching.ts` - Pair matching

#### 4. **Matrix Module** (`matrix/`)
- `routes/matrix.ts` - Matrix endpoints
- `services/matrix-placement.ts` - Matrix positioning
- `services/income-calculation.ts` - Income calculations

#### 5. **Re-entry Module** (`reentry/`)
- `routes/reentry.ts` - Re-entry endpoints
- `services/reentry.ts` - Cycle management

#### 6. **Admin Module** (`admin/`)
- `routes/admin.ts` - Admin endpoints
- `services/admin.ts` - Admin operations
- `middleware/admin-auth.ts` - Admin verification

#### 7. **Backup Module** (`backup/`)
- `routes/backup.ts` - Backup endpoints
- `services/backup.ts` - Backup operations
- `services/google-drive.ts` - Drive integration

#### 8. **Common Module** (`common/`)
- `services/notification.ts` - Notification system
- `services/email.ts` - Email service
- `middleware/security.ts` - Security middleware
- `types/index.ts` - Shared types

## Key Features by Module

### Registration Module
- ✅ User signup
- ✅ Email verification
- ✅ Password reset
- ✅ Login/Logout

### Activation Module
- ✅ Profile completion
- ✅ 8-payment system
- ✅ Payment submission
- ✅ Payment confirmation/rejection
- ✅ UPI/Bank transfer tracking

### Binary Module
- ✅ Binary tree visualization
- ✅ 3:3 pair matching
- ✅ Leg assignment (left/right)
- ✅ Spillover logic (sponsor → global)
- ✅ Pair matching queue

### Matrix Module
- ✅ Global matrix visualization
- ✅ 5-level downline tracking
- ✅ Matrix income (auto-calculation)
- ✅ Matrix positioning per cycle
- ✅ Income distribution

### Re-entry Module
- ✅ Multi-cycle re-entry
- ✅ Automatic eligibility detection (62-member matrix)
- ✅ Cycle tracking
- ✅ New position assignment in new matrix

### Admin Module
- ✅ User management
- ✅ Payment approval/rejection
- ✅ System configuration
- ✅ Analytics/reporting
- ✅ IP blocking
- ✅ Maintenance mode

### Backup Module
- ✅ Daily/12hr/1hr auto-backup scheduling
- ✅ Google Drive integration
- ✅ Full database export
- ✅ Complete restoration capability
- ✅ Backup versioning

### Common Module
- ✅ Real-time notifications (WebSocket)
- ✅ Bell notification system
- ✅ Email notifications
- ✅ Theme management
- ✅ Authentication context

## Migration Checklist

- [ ] Move frontend pages to modules
- [ ] Move frontend components to modules
- [ ] Create barrel exports (index.ts files)
- [ ] Update App.tsx router
- [ ] Update client/lib imports
- [ ] Move backend routes to modules
- [ ] Move backend services to modules
- [ ] Create barrel exports for backend
- [ ] Update server/routes.ts to aggregate module routes
- [ ] Update server/index.ts imports
- [ ] Test all module integrations
- [ ] Update replit.md documentation
- [ ] Deploy and verify production

## File Organization Benefits

1. **Scalability**: Easy to add new modules (e.g., Referral bonus module, Support module)
2. **Maintainability**: Related code grouped together
3. **Team Development**: Multiple developers can work on different modules
4. **Code Splitting**: Frontend can lazy-load modules
5. **Testing**: Each module can be tested independently
6. **Documentation**: Self-documenting module structure

## Active/Inactive Module Management

Each module can be enabled/disabled via system configuration:
- **Active Module**: Fully functional, routes registered, features available
- **Inactive Module**: Routes hidden, features disabled, reduced resource usage
- **Configuration**: Stored in system_config table: `enabledModules: ['registration', 'activation', 'binary', 'matrix', 'reentry', 'admin', 'backup']`

