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

// Generate static folder manifests so GitHub Pages and static servers can list folder assets
function generateStaticManifests() {
  try {
    if (fs.existsSync('sponsors')) {
      const sponsors = fs.readdirSync('sponsors').filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f)).sort();
      fs.writeFileSync('sponsors/sponsors.json', JSON.stringify(sponsors, null, 2) + '\n');
      console.log(`Generated sponsors/sponsors.json (${sponsors.length} files)`);
    }
    if (fs.existsSync('sounds')) {
      const sounds = fs.readdirSync('sounds').filter(f => /\.(mp3|wav|ogg)$/i.test(f)).sort();
      fs.writeFileSync('sounds/sounds.json', JSON.stringify(sounds, null, 2) + '\n');
      console.log(`Generated sounds/sounds.json (${sounds.length} files)`);
    }
    if (fs.existsSync('text_files')) {
      const textFiles = fs.readdirSync('text_files').filter(f => /\.(txt|md|log)$/i.test(f)).sort();
      fs.writeFileSync('text_files/text_files.json', JSON.stringify(textFiles, null, 2) + '\n');
      console.log(`Generated text_files/text_files.json (${textFiles.length} files)`);
    }
  } catch (e) {
    console.warn('Warning generating static manifests:', e);
  }
}

generateStaticManifests();
