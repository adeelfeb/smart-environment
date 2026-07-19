# How to Create Users Using the Terminal

This guide shows you how to create users with different roles using the terminal.

## 📋 Default Users Setup

We'll create these users:
- **Admin**: `a@a.com` (password: `temp123`)
- **HR**: `h@h.com` (password: `temp123`)
- **Superadmin**: `s@s.com` (password: `temp123`)

---

## 🪟 Windows PowerShell Commands

**Make sure your server is running on `http://localhost:3000`**

### Create Admin User:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/setup/create-user" -Method POST -Body (@{name="admin";email="a@a.com";password="temp123";role="admin"} | ConvertTo-Json) -ContentType "application/json"
```

### Create HR User:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/setup/create-user" -Method POST -Body (@{name="hr";email="h@h.com";password="temp123";role="hr"} | ConvertTo-Json) -ContentType "application/json"
```

### Create Superadmin User:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/setup/create-user" -Method POST -Body (@{name="super admin";email="s@s.com";password="temp123";role="superadmin"} | ConvertTo-Json) -ContentType "application/json"
```

### Create All Users at Once:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/setup/create-user" -Method POST -Body (@{name="admin";email="a@a.com";password="temp123";role="admin"} | ConvertTo-Json) -ContentType "application/json"; Invoke-RestMethod -Uri "http://localhost:3000/api/setup/create-user" -Method POST -Body (@{name="hr";email="h@h.com";password="temp123";role="hr"} | ConvertTo-Json) -ContentType "application/json"; Invoke-RestMethod -Uri "http://localhost:3000/api/setup/create-user" -Method POST -Body (@{name="super admin";email="s@s.com";password="temp123";role="superadmin"} | ConvertTo-Json) -ContentType "application/json"
```

---

## 🐧 Ubuntu/Droplet Local Endpoint

When you SSH into the droplet, you can call the `/api/setup/internal-create-user` endpoint. It only accepts requests from `localhost`, so it cannot be triggered externally.

**Make sure your server is running on port `8000`**

### Create Admin User:
```bash
curl -X POST http://localhost:8000/api/setup/internal-create-user \
  -H "Content-Type: application/json" \
  -d '{"name":"admin","email":"a@a.com","password":"temp123","role":"admin"}'
```

### Create HR User:
```bash
curl -X POST http://localhost:8000/api/setup/internal-create-user \
  -H "Content-Type: application/json" \
  -d '{"name":"hr","email":"h@h.com","password":"temp123","role":"hr"}'
```

### Create Superadmin User:
```bash
curl -X POST http://localhost:8000/api/setup/internal-create-user \
  -H "Content-Type: application/json" \
  -d '{"name":"super admin","email":"s@s.com","password":"temp123","role":"superadmin"}'
```

### Create All Users at Once:
```bash
curl -X POST http://localhost:8000/api/setup/internal-create-user \
  -H "Content-Type: application/json" \
  -d '{"name":"admin","email":"a@a.com","password":"temp123","role":"admin"}' && \
curl -X POST http://localhost:8000/api/setup/internal-create-user \
  -H "Content-Type: application/json" \
  -d '{"name":"hr","email":"h@h.com","password":"temp123","role":"hr"}' && \
curl -X POST http://localhost:8000/api/setup/internal-create-user \
  -H "Content-Type: application/json" \
  -d '{"name":"super admin","email":"s@s.com","password":"temp123","role":"superadmin"}'
```

---

## 🔧 Create User with Any Role

You can create users with any role by changing the `role` field:

### Windows:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/setup/create-user" -Method POST -Body (@{name="Your Name";email="user@example.com";password="yourpassword";role="your_role"} | ConvertTo-Json) -ContentType "application/json"
```

### Ubuntu/Droplet:
```bash
curl -X POST http://localhost:8000/api/setup/internal-create-user \
  -H "Content-Type: application/json" \
  -d '{"name":"Your Name","email":"user@example.com","password":"yourpassword","role":"your_role"}'
```

---

## 📜 Automated Script (Droplet)

Run the helper script to create the default HR user (`Hr`, `h@h.com`, `temp123`). Execute from the project root:

```bash
bash scripts/createUser.sh
```

---

## ✅ Verify Users Were Created

After running the commands, you should see a JSON response like:
```json
{
  "success": true,
  "message": "User created with role: admin",
  "data": {
    "user": {
      "id": "...",
      "name": "admin",
      "email": "a@a.com",
      "role": "admin",
      "createdAt": "..."
    }
  }
}
```

---

## 📝 Notes

- **Local only**: The `/api/setup/internal-create-user` endpoint rejects non-localhost requests.
- **Port**: 
  - Windows local: `3000`
  - Ubuntu/Droplet: `8000`
- **Password**: Must be at least 6 characters long
- **Email**: Must be a valid email format
- **Role**: Will be created automatically if it doesn't exist

---

## 🔐 Production: Automatic Super Admin Seed

In production, `npm start` runs `server.start.js` which **automatically creates the super admin user** before launching the server. You do not need to run any curl commands after deploying.

### Default credentials

| Variable | Default |
|---|---|
| `SEED_ADMIN_EMAIL` | `admin@admin.com` |
| `SEED_ADMIN_PASSWORD` | `Admin@12345` |
| `SEED_ADMIN_ROLE` | `super_admin` |

### Override for production

Set these environment variables on your server or hosting dashboard:

```env
SEED_ADMIN_EMAIL=admin@yourdomain.com
SEED_ADMIN_PASSWORD=YourStrongPasswordHere!
```

### How it works

- `npm start` → `node server.start.js` → seeds admin → starts Next.js
- The seed is **idempotent**: if the admin email already exists, it skips creation
- The seed disconnects before the server starts, so there's no connection conflict
- If MongoDB is unreachable, the seed logs a warning and the server still starts

### Manual seed only (no server start)

```bash
npm run seed:admin
```

