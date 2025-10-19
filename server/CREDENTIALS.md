# Credential Management Tools

## Problem: Lost Client Credentials

When you create a new client, the system generates a random password and displays it **only once**. If you didn't save it, you cannot retrieve it (since passwords are properly hashed in the database).

## Solution: Credential Management Tool

We've created an interactive tool to help manage user credentials.

### Quick Reset (Recommended)

To quickly reset a client password:

```bash
cd server
node manage-credentials.cjs
```

Then select option 2 (Reset client password) and follow the prompts.

### Current Credentials

After running the reset tool, the client can now login with:

```
Username: recrutingdepartment-drew
Password: TempPass123!
```

**⚠️ Important: Change this password after first login!**

## Available Tools

### 1. Interactive Credential Manager (Recommended)

```bash
node manage-credentials.cjs
```

Features:
- List all users
- Reset client passwords
- Reset admin password
- Test passwords

### 2. Quick Client Password Reset

```bash
node reset-client-password.cjs [username]
```

Without username, it lists all client users.
With username, it resets to default: `TempPass123!`

### 3. Debug Users

```bash
node debug-users.cjs
```

Shows all users and their password hash details.

### 4. Test Password

```bash
node test-password.cjs <password>
```

Tests if a password matches any client user.

## Best Practices

### For Production

1. **Save Generated Passwords Immediately**: When creating a client, the password is shown once - copy it immediately!

2. **Use Strong Passwords**: When resetting passwords, use strong passwords with:
   - At least 8 characters
   - Mix of uppercase and lowercase
   - Numbers and special characters

3. **Secure Password Delivery**: Share credentials securely:
   - Use encrypted communication
   - Don't send via plain email
   - Consider using a password manager

4. **Force Password Change**: The system doesn't currently force clients to change temporary passwords, but they should!

### Admin Password

The default admin password is `admin123` and must be changed on first login. If you've locked yourself out:

```bash
node manage-credentials.cjs
# Select option 3: Reset admin password
```

## Troubleshooting Login Issues

### "Invalid Credentials" Error

If you're getting this error, check:

1. **Username Format**: Client usernames are lowercase with no spaces
   - Example: "Recruting Department - Drew" → `recrutingdepartment-drew`
   - The system removes spaces and hyphens, converts to lowercase

2. **Password**: Make sure you're using the exact password generated (case-sensitive!)

3. **Database Connection**: Verify the server is running and connected to the database

4. **Reset Password**: Use the credential management tool to reset and try again

### Testing a Login

To verify credentials work:

```bash
node manage-credentials.cjs
# Select option 4: Test a password against a user
```

This will tell you if the password matches without actually logging in.

## Technical Details

### Password Generation (in admin.js:42-52)

```javascript
const username = clientName.toLowerCase().replace(/\s+/g, '');
const password = crypto.randomBytes(12).toString('base64').slice(0, 12);
const hashedPassword = bcrypt.hashSync(password, 10);
```

- Username: Client name, lowercase, no spaces
- Password: 12-character random base64 string
- Hash: bcrypt with 10 salt rounds

### Why You Can't Retrieve Original Passwords

Passwords are hashed using bcrypt, which is a one-way function. This is a security feature! Even database administrators cannot see the original password. The only option is to reset it.

## Future Improvements

Consider implementing:
- [ ] Email password reset functionality
- [ ] Password reset links with expiration
- [ ] Admin panel for credential management
- [ ] Audit log of password changes
- [ ] Force password change on first client login
- [ ] Password strength requirements in UI
- [ ] Option to set custom password during client creation
