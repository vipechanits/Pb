# PAYBACK247 - Complete Application Workflows

## 🔐 1. User Registration & Login Flow

```
START
  ↓
User visits Landing Page
  ↓
[New User]                    [Existing User]
  ↓                              ↓
Enter Email & Password    →   Enter Email & Password
  ↓                              ↓
Create Account                 Login
  ↓                              ↓
Assign User ID (PB1, PB2...)   Load User Profile
  ↓                              ↓
                            Check Activation Status
                                 ↓
                    [Not Activated] → Go to Activation Page
                    [Activated] → Go to Dashboard
```

---

## 💰 2. User Activation Flow (8-Payment System)

```
START: User Dashboard
  ↓
Click "Activate Account"
  ↓
View 8-Payment Checklist
  │
  ├─ Payment 0: Direct Sponsor (₹500)
  ├─ Payment 1: Binary Match (₹500)
  ├─ Payment 2: Creator Fee (₹200)
  ├─ Payment 3: Matrix Level 1 (₹100)
  ├─ Payment 4: Matrix Level 2 (₹100)
  ├─ Payment 5: Matrix Level 3 (₹100)
  ├─ Payment 6: Matrix Level 4 (₹100)
  └─ Payment 7: Matrix Level 5 (₹100)
  
TOTAL: ₹1,700

For EACH Payment:
  ↓
Click "Pay Now"
  ↓
View Payment Dialog
  ↓
Enter UTR/Transaction ID
  ↓
Upload Proof (Optional)
  - Image/PDF (max 10MB)
  - Stored in Object Storage
  ↓
Submit Payment
  ↓
Status: "Pending Admin Approval" ⚠️
  ↓
[ADMIN APPROVES] → Status: "Completed" ✅
[ADMIN REJECTS]  → Status: "Rejected" ❌ (User can retry)

When ALL 8 Payments Approved:
  ↓
Account Status: ACTIVATED ✅
  ↓
User enters Binary Tree & Matrix System
```

---

## 🌳 3. Binary Tree Matching Flow (3:3 Pairing)

```
New Activated User Joins
  ↓
System checks Global Binary Queue (FIFO)
  ↓
Find Next Available Position
  ↓
[Left Side Available]     [Right Side Available]
  ↓                          ↓
Place User in Left       Place User in Right
  ↓                          ↓
Check Parent's Status
  ↓
[Parent has 3 Left + 3 Right = COMPLETE SET]
  ↓
Parent Earns Binary Match Income (₹500)
  ↓
System creates NEW Binary Match Payment
  ↓
Next User pays ₹500 to this Parent

Cycle Continues...
```

### Binary Tree Visual:
```
                    Sponsor
                   /       \
              Left           Right
             /    \         /    \
          L1      L2     R1      R2
         / \     / \    / \     / \
       L1L L1R L2L L2R R1L R1R R2L R2R

3 Left + 3 Right = Complete Binary Set = Income
```

---

## 📊 4. Matrix Income Flow (5 Levels)

```
New User Activates
  ↓
System assigns Matrix Position under Sponsor
  ↓
User becomes part of 5-Level Matrix

Level 1: Direct referrals (₹100 per person)
Level 2: Referrals of Level 1 (₹100 per person)
Level 3: Referrals of Level 2 (₹100 per person)
Level 4: Referrals of Level 3 (₹100 per person)
Level 5: Referrals of Level 4 (₹100 per person)

When User's Downline Activates:
  ↓
System calculates which Matrix Level they belong to
  ↓
User earns ₹100 income
  ↓
Income tracked in user's Matrix Income Dashboard
```

### Matrix Visual:
```
                    YOU (Level 0)
                      |
        ┌─────────────┼─────────────┐
        |             |             |
     Level 1       Level 1       Level 1
     (₹100)        (₹100)        (₹100)
        |             |             |
    ┌───┼───┐     ┌───┼───┐     ┌───┼───┐
    |   |   |     |   |   |     |   |   |
   L2  L2  L2    L2  L2  L2    L2  L2  L2
  (₹100 each from 9 people at Level 2)
        |
     Continues to Level 5...
```

---

## 🔄 5. Admin Payment Approval Flow

```
Admin Dashboard
  ↓
View "Payment Confirmations" Tab
  ↓
See List of Pending Payments
  │
  ├─ User ID
  ├─ Payment Type (Sponsor/Binary/Matrix/etc)
  ├─ Amount (₹)
  ├─ UTR Number
  ├─ Proof Image/PDF
  └─ Timestamp
  
For EACH Payment:
  ↓
Click "Review Payment"
  ↓
View Full Details + Proof
  ↓
[APPROVE]                  [REJECT]
  ↓                          ↓
Mark as "Completed"      Mark as "Rejected"
  ↓                          ↓
Update User's             Notify User
Activation Progress       to Retry
  ↓
Check if All 8 Payments Complete
  ↓
[YES] → Activate User Account
[NO]  → Wait for remaining payments
```

---

## 🔁 6. Re-Entry Flow

```
Fully Activated User
  ↓
Views Re-Entry Dashboard
  ↓
Checks Completion Status:
  - Binary Tree: 3 Left + 3 Right = Complete
  - Matrix: All 5 Levels filled
  
[COMPLETE CYCLE]
  ↓
Click "Re-Enter Program"
  ↓
System creates NEW Activation
  ↓
Repeat 8-Payment Process
  ↓
New Position in Binary Tree
  ↓
New Matrix Network
  ↓
Earn Again from Fresh Network
```

---

## 👤 7. User Dashboard Navigation

```
User Login
  ↓
Main Dashboard
  ├─ Activation Status
  ├─ Total Earnings
  ├─ Binary Match Count
  └─ Matrix Income Summary
  
Navigation Menu:
  ├─ Direct Sponsoring
  │   └─ View referrals you've sponsored
  │
  ├─ Binary Matching
  │   └─ See your binary tree position
  │   └─ Left/Right team counts
  │
  ├─ Matrix Income
  │   └─ View 5-level downline
  │   └─ Income per level
  │
  ├─ Re-entry Cycles
  │   └─ View completion status
  │   └─ Re-activate when ready
  │
  └─ Profile
      └─ Update personal info
      └─ View payment history
```

---

## 🛡️ 8. Admin Dashboard Workflow

```
Admin Login
  ↓
Admin Dashboard
  ├─ Total Users
  ├─ Active Users
  ├─ Pending Payments
  └─ Total Revenue
  
Navigation Menu:
  ├─ Payment Confirmations
  │   └─ Approve/Reject user payments
  │   └─ View payment proofs
  │
  ├─ User Management
  │   └─ View all users
  │   └─ Search by ID/Email
  │   └─ View user activation status
  │
  └─ Settings
      └─ Configure activation fees
      └─ Set matrix/binary parameters
      └─ Manage admin accounts
```

---

## 💸 9. Payment Receiver Logic (Admin Fallback)

```
User Makes Payment
  ↓
System Determines Receiver:

Payment Type 0 (Direct Sponsor):
  [Has Sponsor?]
    YES → Pay to Sponsor
    NO  → Pay to Admin Wallet

Payment Type 1 (Binary Match):
  [Binary Match Available?]
    YES → Pay to Matched User
    NO  → Pay to Admin Wallet

Payment Type 2 (Creator Fee):
  → Always Pay to Admin Wallet

Payment Types 3-7 (Matrix Levels 1-5):
  [Matrix Upline Exists at Level?]
    YES → Pay to Upline
    NO  → Pay to Admin Wallet

Admin Fallback ensures:
  ✅ Every payment has a valid receiver
  ✅ No payments are lost
  ✅ System works even for first users
```

---

## 📈 10. Income Tracking Flow

```
User Receives Payment
  ↓
System Updates Database:
  ├─ User's total earnings
  ├─ Payment type (Binary/Matrix/Sponsor)
  ├─ Amount (₹)
  └─ Timestamp
  
User Dashboard Updates:
  ├─ Total Income
  ├─ Binary Match Income
  ├─ Matrix Income by Level
  ├─ Direct Sponsoring Income
  └─ Payment History
  
User can:
  ├─ View detailed earnings report
  ├─ Filter by date range
  ├─ Export payment history
  └─ Track re-entry cycles
```

---

## 🔍 11. Confirmation Page Workflow

```
User Receives Payment from Others
  ↓
Payment appears in "Confirmation" Page
  ↓
Shows:
  ├─ Payer User ID
  ├─ Payment Amount
  ├─ Payment Type
  ├─ UTR Number
  └─ Proof (if uploaded)
  
User Reviews Payment:
  ↓
[CONFIRM]                 [DISPUTE]
  ↓                         ↓
Mark as Received       Contact Admin
  ↓                         ↓
Payment Completes      Admin Reviews
  ↓
Payer's activation
progresses
```

---

## 📱 Current Implementation Status

### ✅ Working (Database Ready):
- Schema for users, activations, payments
- Object storage for payment proofs
- Session management setup

### ⚠️ Stubbed (Need Implementation):
- All dashboard pages
- Payment submission forms
- Admin approval interface
- Binary tree visualization
- Matrix income tracking
- Re-entry system

### 🔄 Next Phase:
1. Implement authentication (email/password)
2. Build activation page with 8-payment UI
3. Create admin approval dashboard
4. Add binary tree logic
5. Implement matrix calculations
6. Build user dashboards

---

## 🎯 Key Business Rules

1. **8 Payments Required**: Users must complete all 8 payments to activate
2. **Admin Approval**: All manual payments need admin verification
3. **Binary 3:3**: Each user can have max 3 left + 3 right for one cycle
4. **Matrix 5-Level**: Income flows through 5 levels of downline
5. **Re-Entry**: Users can re-enter after completing a full cycle
6. **Admin Fallback**: Unclaimed payments go to admin wallet
7. **INR Currency**: All payments in Indian Rupees (₹)
8. **Manual Payments**: UTR-based tracking with proof upload

