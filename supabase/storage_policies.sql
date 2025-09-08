-- Supabase Storage 설정 가이드
-- SQL로 Storage 정책을 직접 생성할 수 없습니다. 대시보드를 사용해야 합니다.

/* 
================================
🔧 Supabase Storage 설정 방법
================================

1. 📁 버킷 생성:
   - Supabase Dashboard > Storage 이동
   - "New bucket" 클릭
   - Bucket name: food-images
   - Public bucket: ✅ 체크 (중요!)
   - "Create bucket" 클릭

2. 🔐 정책 설정:
   - Storage > food-images 버킷 클릭
   - "Policies" 탭 이동
   - "New policy" 클릭
   - "Get started quickly" 섹션에서 "Enable read access for all users" 선택
   - "Save policy" 클릭
   
   또는 "Custom" 옵션으로:
   - Policy name: food-images-public-read
   - Allowed operation: SELECT
   - Target roles: public
   - USING expression: true

3. 🎯 업로드 권한 추가:
   - "New policy" 다시 클릭
   - Policy name: food-images-public-insert  
   - Allowed operation: INSERT
   - Target roles: public
   - WITH CHECK expression: true

4. ✅ 확인:
   - food-images 버킷에 2개의 정책이 있어야 함:
     ✓ SELECT 정책 (읽기)
     ✓ INSERT 정책 (업로드)

================================
⚠️  중요 사항
================================
- 버킷을 생성할 때 반드시 "Public bucket"을 체크해야 합니다
- 정책 없이는 이미지 업로드/읽기가 불가능합니다
- 설정 후 앱을 새로고침하여 테스트해보세요

================================
🧪 테스트 방법
================================
1. 음식 사진 업로드 및 저장
2. 브라우저 새로고침
3. 히스토리에서 사진이 정상 표시되는지 확인
*/