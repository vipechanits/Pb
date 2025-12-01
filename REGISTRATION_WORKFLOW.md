# PAYBACK247 Registration Workflow

## Complete Registration Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REGISTRATION PROCESS                              │
└─────────────────────────────────────────────────────────────────────────────┘

STEP 1: USER SIGNUP PAGE (Frontend)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User visits: /auth/signup [Optional: ?ref=SPONSOR_ID&leg=left|right]

Form Fields Collected:
  ├─ Name (required, min 1 char)
  ├─ Email (required, valid email format)
  ├─ Mobile (required, exactly 10 digits)
  ├─ Password (required, min 6 characters)
  ├─ Confirm Password (must match password)
  ├─ Sponsor ID (optional, from URL parameter)
  ├─ Binary Leg (optional, from URL parameter: left or right)
  ├─ Terms & Conditions (must accept)
  └─ reCAPTCHA (if enabled by admin)

Frontend Validations:
  ✓ Email format validation
  ✓ Mobile format validation (10 digits only)
  ✓ Password length >= 6 characters
  ✓ Passwords match confirmation
  ✓ Terms & Conditions must be accepted

↓ Form Valid?


STEP 2: FRONTEND SECURITY CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If reCAPTCHA Enabled:
  └─ Execute reCAPTCHA verification → Get token

Submit to Backend:
  POST /api/auth/signup
  {
    name: string,
    email: string,
    mobile: string (10 digits),
    password: string,
    sponsorId?: string (PB#####),
    binaryLeg?: 'left' | 'right',
    recaptchaToken?: string
  }

↓


STEP 3: BACKEND VALIDATION & PROCESSING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend Validations:
  ✓ Email format valid
  ✓ Mobile format valid (10 digits)
  ✓ Password meets requirements
  ✓ reCAPTCHA verification (if enabled)
  ✓ Sponsor ID exists (if provided)
  ✓ Binary leg valid (if provided)

↓ All Valid?


STEP 4: GENERATE RANDOM USER ID
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generate Random PB ID:
  Range: PB10000 - PB999999
  Format: PB + 5-6 random digits

Process:
  1. Generate random ID (e.g., PB47821)
  2. Check if ID already exists in database
  3. If exists → Generate new ID (retry up to 20 times)
  4. If collision after 20 attempts → Reject signup

↓ Unique ID Generated?


STEP 5: CREATE USER ACCOUNT (TRANSACTION)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Inside SERIALIZABLE Transaction:
  
  1. Hash Password
     └─ Use bcrypt to hash password before storing
  
  2. Create User Record
     ├─ ID: UUID (internal database ID)
     ├─ userId: Generated PB##### (human-readable ID)
     ├─ email: Provided email
     ├─ mobile: Provided mobile
     ├─ name: Provided name
     ├─ password: Hashed password
     ├─ role: 'user' (default)
     ├─ isActivated: false
     ├─ isProfileComplete: false
     ├─ emailVerified: false ⚠️ (NOT yet verified)
     └─ createdAt: Current timestamp

  3. Set Referral Information (if sponsor provided)
     ├─ sponsorId: Provided sponsor PB ID
     └─ sponsorRequestedLeg: 'left' | 'right' (user preference)
  
  4. Generate Email Verification Token
     ├─ Create unique token (crypto.randomBytes)
     ├─ Set expiry: 24 hours from now
     └─ Store in database

↓ User Created Successfully?


STEP 6: SEND VERIFICATION EMAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Email Template:
  To: user's email address
  Subject: "Verify Your PAYBACK247 Account"
  
  Body Contains:
    ├─ Welcome message
    ├─ Verification link: /auth/verify-email/[TOKEN]
    └─ Token expiry warning (24 hours)

Verification Link:
  https://payback247.com/auth/verify-email/[VERIFICATION_TOKEN]

↓ Email Sent


STEP 7: RETURN SUCCESS TO FRONTEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Response: 200 OK
{
  success: true,
  message: "Account created successfully. Please verify your email."
}

Frontend Display:
  ✓ Success message
  ✓ Instruction to check email
  ✓ Email address confirmation
  ✓ Resend verification option
  └─ Redirect suggestion to login

⏱️ Awaiting Email Verification


STEP 8: USER VERIFIES EMAIL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User Action:
  1. Opens email
  2. Clicks verification link
  3. URL: /auth/verify-email/[TOKEN]

Backend Processing:
  1. Extract token from URL
  2. Find user with matching token
  3. Verify token hasn't expired (24 hour limit)
  4. Mark emailVerified: true
  5. Clear verification token from database
  6. ⚠️ NOTE: User ID NOT revealed until here!

Frontend Response:
  ✓ Email verified successfully
  └─ Redirect to login page

⏱️ Ready for Login


STEP 9: USER LOGS IN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User Credentials:
  Email: [registered email]
  Password: [registered password]

Backend Authentication:
  1. Find user by email
  2. Hash provided password with bcrypt
  3. Compare with stored hash
  4. Verify email is confirmed (emailVerified: true)
  5. Create session
  6. Return user data (including revealed PB#####)

Frontend:
  ✓ Login successful
  ├─ Show User ID (PB#####) for first time
  ├─ Store session
  └─ Redirect to dashboard


STEP 10: USER DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
New User Status:
  ├─ User ID: PB##### (revealed)
  ├─ Email Verified: ✓ Yes
  ├─ Account Activated: ✗ No (awaiting activation)
  ├─ Profile Complete: ✗ No (awaiting profile update)
  └─ Next Step: Complete profile OR Start activation

⏱️ Registration Complete


═════════════════════════════════════════════════════════════════════════════════
```

---

## Registration Workflow Summary

| Step | Phase | Action | Status |
|------|-------|--------|--------|
| 1-2 | Frontend | User fills form & validates | ✓ Client-side |
| 3 | Backend | Validate inputs & security | ✓ Server-side |
| 4 | Backend | Generate unique PB##### ID | ✓ Retry-safe |
| 5 | Backend | Create user in database | ✓ Transaction |
| 6 | Backend | Send verification email | ✓ SMTP |
| 7 | Backend | Return success to frontend | ✓ JSON |
| 8 | User | Verify email via link | ⏱️ Manual |
| 9 | User | Login with email/password | ✓ Auth |
| 10 | User | Access dashboard | ✓ Live |

---

## Key Features

### ✅ Email/Mobile Reuse
- **1 email**: Can be used for up to **50 registrations**
- **1 mobile**: Can be used for up to **50 registrations**
- **No unique constraints** enforced on email/mobile

### ✅ Referral System (Binary Tree)
- User can sign up with sponsor link: `/auth/signup?ref=PB10000&leg=left`
- Sponsor ID gets stored in `sponsorId` field
- Binary leg preference stored in `sponsorRequestedLeg`
- System tries to place user in sponsor's tree (with spillover)

### ✅ User ID Security
- User ID **NOT** revealed during signup
- User ID **NOT** revealed during email verification
- User ID **ONLY** revealed after successful login
- User ID format: `PB10000` to `PB999999`
- Each ID is **globally unique** with collision detection

### ✅ Email Verification
- Verification token expires in **24 hours**
- User must verify email before account is active
- Token is cryptographically random
- Frontend shows success page after signup

### ✅ Transaction Safety
- User creation uses **SERIALIZABLE transaction**
- Prevents race conditions during concurrent signups
- Retries on unique constraint violations
- Atomic operation - all or nothing

### ✅ Security
- Password hashed with bcrypt (never stored plaintext)
- reCAPTCHA support (optional, admin configurable)
- CSRF protection on all forms
- Rate limiting on signup endpoint

### ✅ Sponsor Binary Placement
After signup, system performs:
1. **Exact Placement**: Try to place in sponsor's requested leg
2. **Spillover**: If taken, search sponsor's entire downline
3. **Global Search**: If sponsor full, search entire binary tree

---

## Status Tracking

### During Registration
```
Signup Start
  ↓
emailVerified: false   ← Not yet verified
userId: PB#####       ← Hidden, not given to user
isActivated: false    ← Not activated
isProfileComplete: false ← No profile yet
  ↓
Email Verification Click
  ↓
emailVerified: true   ← ✓ Now verified
userId: PB#####       ← ✓ Revealed on login
isActivated: false    ← Still pending activation
isProfileComplete: false ← Still pending profile
  ↓
Login
  ↓
✓ User can access dashboard
✓ Must complete profile OR start activation next
```

---

## Error Scenarios

### Duplicate Email/Mobile
✅ Allowed - Can register up to 50 times with same email/mobile

### Duplicate User ID
❌ Not allowed - System retries up to 20 times, then rejects

### Token Expiry
❌ Verification token expires in 24 hours - User must resend

### Invalid Sponsor ID
❌ Error - Sponsor must be valid, activated user with correct format

### Missing Terms Accept
❌ Error - User must accept Terms & Conditions

### reCAPTCHA Failure
❌ Error - Must complete reCAPTCHA verification

---

## Frontend Routes

| Route | Purpose | Status |
|-------|---------|--------|
| `/auth/signup` | Registration form | Public |
| `/auth/signup?ref=PB#####&leg=left` | Affiliate link signup | Public |
| `/auth/verify-email/:token` | Email verification | Public |
| `/auth/login` | Login after signup | Public |
| `/user/dashboard` | Main dashboard | Protected |

---

## Backend API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/signup` | POST | Register new user |
| `/api/auth/verify-email/:token` | POST | Verify email address |
| `/api/auth/login` | POST | Authenticate user |
| `/api/auth/resend-verification` | POST | Resend verification email |

---

## Database Impact

### New User Record Created
```typescript
{
  id: "uuid-...",                    // Internal ID
  userId: "PB47821",                 // Human-readable ID
  email: "user@example.com",
  mobile: "9876543210",
  name: "John Doe",
  password: "$2b$...(hashed)",
  sponsorId: "PB10000",              // If provided
  sponsorRequestedLeg: "left",       // If provided
  emailVerified: false,              // Until verified
  emailVerificationToken: "...",     // Cleared after verify
  emailVerificationExpiry: "...",
  isActivated: false,
  isProfileComplete: false,
  role: "user",
  createdAt: "2025-12-01T...",
  updatedAt: "2025-12-01T...",
  // ... other fields default to null/false
}
```

---

## Complete Example Flow

```
USER ACTION: Clicks affiliate link
URL: https://payback247.com/auth/signup?ref=PB10000&leg=left

↓

BROWSER: Displays signup form
- Name field prefilled? No
- Email field: empty
- Mobile field: empty
- Sponsor field: Pre-filled with "PB10000" (from URL)
- Leg field: Pre-selected "Left" (from URL)

↓

USER ACTION: Fills form
- Name: "Jane Smith"
- Email: "jane@example.com"
- Mobile: "9876543210"
- Password: "SecurePass123"
- Confirm Password: "SecurePass123"
- ✓ Accept Terms
- Completes reCAPTCHA

↓

FRONTEND: Validates all fields

↓

FRONTEND: Sends POST request
POST /api/auth/signup
{
  name: "Jane Smith",
  email: "jane@example.com",
  mobile: "9876543210",
  password: "SecurePass123",
  sponsorId: "PB10000",
  binaryLeg: "left",
  recaptchaToken: "..."
}

↓

BACKEND: Validates everything

↓

BACKEND: Generates User ID
- Generates: PB47821
- Checks: Already exists in DB
- Retries: PB63904
- Checks: Not in DB ✓
- Uses: PB63904

↓

BACKEND: Creates user in transaction
- Hash password: SecurePass123 → $2b$10$...
- Create user record with userId: PB63904
- Generate email verification token
- Store verification token with 24h expiry

↓

BACKEND: Sends verification email
- To: jane@example.com
- Link: /auth/verify-email/[TOKEN_ABC123]

↓

BACKEND: Returns success
{
  success: true,
  message: "Check your email to verify your account"
}

↓

FRONTEND: Shows success screen
- "Check your email to verify"
- "We sent a link to jane@example.com"
- "Verification link expires in 24 hours"

↓

USER ACTION: Checks email inbox

↓

USER ACTION: Clicks verification link
Browser goes to: /auth/verify-email/TOKEN_ABC123

↓

BACKEND: Processes verification
- Find token: TOKEN_ABC123
- Find user: Jane Smith (PB63904)
- Check expiry: Not expired ✓
- Mark: emailVerified = true
- Clear: emailVerificationToken = null

↓

FRONTEND: Shows verification success
- "Email verified successfully!"
- "You can now login"
- Redirect to login page

↓

USER ACTION: Logs in
- Email: jane@example.com
- Password: SecurePass123

↓

BACKEND: Authenticates
- Find user by email ✓
- Check password hash ✓
- Check email verified ✓
- Create session
- Return user with PB63904 revealed

↓

FRONTEND: Login successful
- Display: "Welcome! Your User ID: PB63904"
- Store: Session cookies
- Redirect: /user/dashboard

↓

USER: Now has:
✓ Account created
✓ Email verified
✓ Logged in
✓ Can see User ID: PB63904
✓ Binary placement set up (sponsor: PB10000, leg: left)
⏱ Awaiting: Profile completion + Activation
```

---

## Next Steps After Registration

1. **Complete Profile** → Update payment details, security code
2. **Start Activation** → Make 8 activation payments
3. **Confirm Payments** → Verify each payment
4. **Activation Complete** → Join network, receive income

---

Generated: 2025-12-01 | PAYBACK247 Platform
