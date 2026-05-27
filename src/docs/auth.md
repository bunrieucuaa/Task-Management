# 📚 Auth API Documentation - Hướng Dẫn Tích Hợp FE

## 🔐 Tổng Quan
Hệ thống xác thực sử dụng **JWT (Access Token + Refresh Token)** với cơ chế revoke token bằng `tokenVersion`.

---

## 📌 Base URL
```
http://localhost:3000/api/v1/auth
```

---

## 1️⃣ **GET /me** - Lấy Thông Tin User Hiện Tại

Trả về thông tin người dùng đã đăng nhập.

### Request
```http
GET /api/v1/auth/me
Authorization: Bearer {accessToken}
```

### Response (200 - Success)
```json
{
  "code": 200,
  "success": true,
  "data": {
    "user": {
      "id": "1",
      "name": "Admin",
      "email": "admin@system.local",
      "role": "ADMIN",
      "status": "ACTIVE",
      "createdAt": "2026-05-26T10:00:00Z",
      "updatedAt": "2026-05-26T10:00:00Z"
    }
  },
  "message": null
}
```

### Error Responses
```json
// 401 - Token không được cung cấp hoặc không hợp lệ
{
  "code": 401,
  "success": false,
  "data": null,
  "message": "Authentication required"
}

// 500 - Server error
{
  "code": 500,
  "success": false,
  "data": null,
  "message": "Internal server error"
}
```

### Cách Sử Dụng (Frontend)
```javascript
// JavaScript/TypeScript
const response = await fetch('/api/v1/auth/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
if (data.success) {
  console.log('User:', data.data.user);
} else {
  // Redirect to login hoặc refresh token
}
```

---

## 2️⃣ **POST /refresh** - Làm Mới Access Token

Sử dụng `refreshToken` để lấy `accessToken` mới mà không cần login lại.

### Request
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Response (200 - Success)
```json
{
  "code": 200,
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Access token refreshed"
}
```

### Error Responses
```json
// 400 - refreshToken không hợp lệ
{
  "code": 400,
  "success": false,
  "data": null,
  "message": "Invalid token type. Refresh token required."
}

// 401 - Token đã bị revoke
{
  "code": 401,
  "success": false,
  "data": null,
  "message": "Token has been revoked. Please login again."
}

// 404 - User không tồn tại
{
  "code": 404,
  "success": false,
  "data": null,
  "message": "User not found"
}

// Validation error
{
  "code": 422,
  "success": false,
  "data": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "path": ["refreshToken"],
      "message": "String must contain at least 1 character(s)"
    }
  ],
  "message": "Validation failed"
}
```

### Cách Sử Dụng (Frontend)
```javascript
// Hàm refresh token
async function refreshAccessToken(refreshToken) {
  try {
    const response = await fetch('/api/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    });

    const data = await response.json();
    
    if (data.success) {
      // Lưu accessToken mới
      localStorage.setItem('accessToken', data.data.accessToken);
      return data.data.accessToken;
    } else {
      // Refresh token không hợp lệ => Redirect to login
      localStorage.clear();
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Refresh failed:', error);
  }
}
```

### Middleware Suggestion (FE)
```javascript
// Gọi refresh token khi accessToken hết hạn (401 error)
export async function handleAuthError(error) {
  if (error.response?.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      const newAccessToken = await refreshAccessToken(refreshToken);
      if (newAccessToken) {
        // Retry original request với token mới
        return retryRequest(newAccessToken);
      }
    }
    // Nếu không có refreshToken hoặc refresh thất bại
    window.location.href = '/login';
  }
}
```

---

## 3️⃣ **POST /change-password** - Thay Đổi Mật Khẩu

Thay đổi mật khẩu của user đã đăng nhập. **Sau khi thành công, tất cả token sẽ bị revoke.**

### Request
```http
POST /api/v1/auth/change-password
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "oldPassword": "Admin@123456",
  "newPassword": "NewPassword@123456"
}
```

### Password Requirements
- Tối thiểu 8 ký tự
- Chứa chữ hoa (A-Z)
- Chứa chữ thường (a-z)
- Chứa số (0-9)
- Chứa ký tự đặc biệt (!@#$%^&*)
- **Mật khẩu mới phải khác mật khẩu cũ**

### Response (200 - Success)
```json
{
  "code": 200,
  "success": true,
  "data": null,
  "message": "Password changed successfully"
}
```

### Error Responses
```json
// 401 - Không có token hoặc token không hợp lệ
{
  "code": 401,
  "success": false,
  "data": null,
  "message": "Authentication required"
}

// 422 - Validation error
{
  "code": 422,
  "success": false,
  "data": null,
  "message": "Invalid username or password"
}

// 400 - Business logic error
{
  "code": 400,
  "success": false,
  "data": null,
  "message": "New password must be different from old password"
}

// 400 - Password không đủ mạnh
{
  "code": 400,
  "success": false,
  "data": null,
  "message": "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
}
```

### Cách Sử Dụng (Frontend)
```javascript
async function changePassword(oldPassword, newPassword) {
  try {
    const response = await fetch('/api/v1/auth/change-password', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        oldPassword,
        newPassword
      })
    });

    const data = await response.json();
    
    if (data.success) {
      alert('Password changed successfully!');
      // Redirect to login vì tất cả token đã bị revoke
      localStorage.clear();
      window.location.href = '/login';
    } else {
      alert(`Error: ${data.message}`);
    }
  } catch (error) {
    console.error('Change password failed:', error);
  }
}

// Validation ở frontend (trước khi gửi)
function validatePassword(password) {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*]/.test(password);

  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    errors: {
      minLength: !minLength ? 'Tối thiểu 8 ký tự' : null,
      hasUpperCase: !hasUpperCase ? 'Chứa ít nhất 1 chữ hoa' : null,
      hasLowerCase: !hasLowerCase ? 'Chứa ít nhất 1 chữ thường' : null,
      hasNumber: !hasNumber ? 'Chứa ít nhất 1 số' : null,
      hasSpecialChar: !hasSpecialChar ? 'Chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*)' : null
    }
  };
}
```

---

## 4️⃣ **POST /logout** - Đăng Xuất

Vô hiệu hóa tất cả token của user bằng cách tăng `tokenVersion`.

### Request
```http
POST /api/v1/auth/logout
Authorization: Bearer {accessToken}
```

### Response (200 - Success)
```json
{
  "code": 200,
  "success": true,
  "data": null,
  "message": "Logged out successfully"
}
```

### Error Responses
```json
// 401 - Không có token hoặc token không hợp lệ
{
  "code": 401,
  "success": false,
  "data": null,
  "message": "Authentication required"
}

// 500 - Server error
{
  "code": 500,
  "success": false,
  "data": null,
  "message": "Internal server error"
}
```

### Cách Sử Dụng (Frontend)
```javascript
async function logout() {
  try {
    const response = await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    if (data.success) {
      // Xóa token và user info
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      // Redirect to login
      window.location.href = '/login';
    } else {
      console.error('Logout failed:', data.message);
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Vẫn redirect về login ngay cả khi có lỗi
    window.location.href = '/login';
  }
}
```

---

## 🔄 Complete Flow Diagram

```
┌─────────────┐
│  Login      │  (Email + Password)
└──────┬──────┘
       │ success: accessToken + refreshToken
       ▼
┌──────────────────────────────────┐
│ Call API with accessToken        │
│ (GET /me, POST /logout, etc)     │
└──────┬───────────────────────────┘
       │
       ├─ 200 ✅ Success
       │
       └─ 401 ❌ Token expired
         │
         ▼
    ┌─────────────────────────────┐
    │ POST /refresh               │
    │ (refreshToken)              │
    └──────┬──────────────────────┘
           │
           ├─ 200 ✅ Get new accessToken
           │         │ Retry original API
           │         ▼ Success
           │
           └─ 401 ❌ Refresh failed
                     │ Redirect to /login
```

---

## 📦 Postman Collection Example

```json
{
  "info": {
    "name": "Auth API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get Me",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/api/v1/auth/me",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "auth", "me"]
        }
      }
    },
    {
      "name": "Refresh Token",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"refreshToken\": \"{{refreshToken}}\"}"
        },
        "url": {
          "raw": "http://localhost:3000/api/v1/auth/refresh",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "auth", "refresh"]
        }
      }
    },
    {
      "name": "Change Password",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"oldPassword\": \"Admin@123456\", \"newPassword\": \"NewPassword@123456\"}"
        },
        "url": {
          "raw": "http://localhost:3000/api/v1/auth/change-password",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "auth", "change-password"]
        }
      }
    },
    {
      "name": "Logout",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{accessToken}}"
          }
        ],
        "url": {
          "raw": "http://localhost:3000/api/v1/auth/logout",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3000",
          "path": ["api", "v1", "auth", "logout"]
        }
      }
    }
  ]
}
```

---

## ⚙️ HTTP Status Codes

| Status | Meaning | Action |
|--------|---------|--------|
| 200 | Success | Tiếp tục |
| 307 | Temporary Redirect | Phải đổi password trước (login) |
| 400 | Bad Request | Kiểm tra lại request body |
| 401 | Unauthorized | Refresh token hoặc redirect login |
| 404 | Not Found | User không tồn tại |
| 422 | Validation Error | Kiểm tra lại input |
| 500 | Server Error | Liên hệ BE |

---

## 🚀 Quick Start (Frontend)

```javascript
// 1. Login (đã làm)
const loginResponse = await login(email, password);
localStorage.setItem('accessToken', loginResponse.accessToken);
localStorage.setItem('refreshToken', loginResponse.refreshToken);

// 2. Get user info
const userResponse = await fetch('/api/v1/auth/me', {
  headers: { 'Authorization': `Bearer ${accessToken}` }
});

// 3. Refresh token khi hết hạn
const newAccessToken = await refreshToken(refreshToken);

// 4. Change password
await changePassword(oldPassword, newPassword);

// 5. Logout
await logout();
```

---

## ❓ FAQ

**Q: Token hết hạn bao lâu?**
A: Access Token hết hạn trong **15 phút**, Refresh Token trong **7 ngày**

**Q: Khi nào cần gọi /refresh?**
A: Khi API trả về 401 error, thay vì redirect login, gọi refresh trước

**Q: Có thể logout từ tất cả device không?**
A: Logout revoke tất cả token của user trên mọi device

**Q: Tại sao phải đổi password sau login lần đầu?**
A: Vì admin account có mật khẩu mặc định, cần đổi để bảo mật

---

📧 **Liên hệ BE nếu có thắc mắc!**
