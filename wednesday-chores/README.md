# 🕷 Wednesday Chores — บันทึกงานบ้าน

## Deploy บน Cloudflare Pages

### 1. Push ขึ้น GitHub
```bash
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/wednesday-chores.git
git push -u origin main
```

### 2. Cloudflare Pages
1. ไปที่ https://pages.cloudflare.com
2. กด **Create a project** → **Connect to Git**
3. เลือก repo ที่เพิ่ง push
4. ตั้งค่า Build:
   - Framework: **Vite**
   - Build command: `npm run build`
   - Build output: `dist`
5. เพิ่ม Environment variable:
   - `VITE_ANTHROPIC_KEY` = API key ของคุณ
6. กด **Save and Deploy**

### รหัสผ่าน Admin
ค่าเริ่มต้น: `wednesday`
แก้ได้ที่ `src/App.jsx` บรรทัด `const ADMIN_PASS = "wednesday";`
