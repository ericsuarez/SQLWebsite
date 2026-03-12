const fs = require('fs');
const path = require('path');

const files = [
  'src/components/OS/OSLevelConfig.tsx',
  'src/components/PerfMon/PerfMonVisualizer.tsx',
  'src/components/SQLOS/SQLOSDeepDive.tsx',
  'src/components/Modern/ModernFeatures.tsx'
];

files.forEach(f => {
  const p = path.join(__dirname, f);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');
  if (content.includes('\\`')) {
    content = content.replace(/\\`/g, '`');
    fs.writeFileSync(p, content);
    console.log('Fixed:', f);
  }
});
