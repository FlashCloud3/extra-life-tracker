import fs from 'fs';
import Babel from '@babel/standalone';

function compileTsx(srcPath, destPath) {
  const tsx = fs.readFileSync(srcPath, 'utf8');
  const res = Babel.transform(tsx, {
    presets: [
      ['react', { runtime: 'classic' }],
      'typescript'
    ],
    filename: srcPath
  });
  fs.writeFileSync(destPath, res.code);
  console.log(`Successfully compiled ${srcPath} -> ${destPath} (${res.code.length} bytes)`);
}

compileTsx('overlays.tsx', 'overlays.js');
compileTsx('dashboard-panels.tsx', 'dashboard-panels.js');
