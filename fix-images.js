// Quick script to fix image URLs in all JSX files
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const files = [
  'src/pages/Teachers.jsx',
  'src/pages/Groups.jsx',
  'src/pages/GroupLesson.jsx',
  'src/pages/SUPER ADMIN 2/TeacherStudents.jsx',
  'src/pages/SUPER ADMIN 2/TeacherGroups.jsx',
  'src/pages/SUPER ADMIN 2/TeacherGroupLesson.jsx',
  'src/components/StudentInfoModal.jsx',
  'src/components/HomeworkResultsPanel.jsx',
];

const oldUrl = 'https://najot-edu.softwareengineer.uz/files/';

files.forEach(filePath => {
  try {
    let content = readFileSync(filePath, 'utf8');
    
    if (content.includes(oldUrl)) {
      // Replace old URL pattern with getImageUrl helper
      content = content.replace(
        /https:\/\/najot-edu\.softwareengineer\.uz\/files\/\$\{.*?\.split\('\/'\)\.pop\(\)\}/g,
        match => {
          // Extract variable name (photo, photoUrl, rawPhoto, etc.)
          const varMatch = match.match(/\$\{(.*?)\.split/);
          if (varMatch) {
            const varName = varMatch[1];
            return `\${getImageUrl(${varName})}`;
          }
          return match;
        }
      );
      
      // Add import if not exists
      if (!content.includes("from '../utils/imageUrl'") && !content.includes("from '../../utils/imageUrl'")) {
        const importDepth = filePath.includes('SUPER ADMIN 2') ? '../../' : '../';
        const importLine = `import { getImageUrl } from '${importDepth}utils/imageUrl';\n`;
        content = content.replace(/^(import.*?from.*?;[\s\n]+)/, `$1${importLine}`);
      }
      
      writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
    } else {
      console.log(`⏭️  Skipped (no old URL): ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
});

console.log('\n🎉 Done!');
