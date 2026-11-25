const assert = require('assert')
const bcrypt = require('bcryptjs')
const { db, initDatabase } = require('./database')

async function runTests() {
  console.log('🧪 Đang chạy kiểm thử tự động CRE-HINT Backend...')
  
  // Test 1: Init Database
  await initDatabase()
  console.log('✅ [PASSED] Test 1: Khởi tạo schema cơ sở dữ liệu thành công')

  // Test 2: Password hashing & verify
  const rawPw = '123456'
  const hashed = await bcrypt.hash(rawPw, 10)
  const isMatch = await bcrypt.compare(rawPw, hashed)
  assert.strictEqual(isMatch, true, 'Mật khẩu băm phải khớp')
  console.log('✅ [PASSED] Test 2: Thuật toán mã hóa bcrypt hoạt động chính xác')

  // Test 3: Check demo templates
  const templates = await db.prepare('SELECT COUNT(*) AS count FROM result_templates').get()
  assert.ok(templates.count > 0, 'Phải có mẫu kết luận khám')
  console.log(`✅ [PASSED] Test 3: Có sẵn ${templates.count} mẫu chẩn đoán lâm sàng`)

  console.log('\n🎉 Toàn bộ bài kiểm thử backend hoàn thành thành công!')
}

runTests().catch(err => {
  console.error('❌ Kiểm thử thất bại:', err)
  process.exit(1)
})
