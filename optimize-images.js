import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const SRC_PRESETS_DIR = path.join(process.cwd(), 'app', 'presets');
const PUBLIC_OUTPUT_DIR = path.join(process.cwd(), 'public', 'presets');

async function processDirectory(currentDir) {
    const files = await fs.promises.readdir(currentDir, { withFileTypes: true });

    for (const file of files) {
        const fullPath = path.join(currentDir, file.name);

        if (file.isDirectory()) {
            await processDirectory(fullPath);
        } else {
            const ext = path.extname(file.name).toLowerCase();
            
            if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
                
                const relativePathFromSrc = path.relative(SRC_PRESETS_DIR, fullPath);
                const targetPublicOutputPath = path.join(
                    PUBLIC_OUTPUT_DIR, 
                    path.dirname(relativePathFromSrc), 
                    `${path.basename(file.name, ext)}.webp`
                );

                try {
                    await fs.promises.mkdir(path.dirname(targetPublicOutputPath), { recursive: true });
                    
                    console.log(`⚡ Optimizing (Lossless): app/premade/.../${file.name} -> public/premade/.../${path.basename(file.name, ext)}.webp`);
                    
                    const isGif = ext === '.gif';
                    const inputBuffer = await fs.promises.readFile(fullPath);

                    let pipeline = sharp(inputBuffer, { 
                        animated: isGif,
                        pages: isGif ? -1 : 1 
                    });

                    pipeline = pipeline.resize({ 
                        width: 800,              
                        withoutEnlargement: true  
                    });

                    if (isGif) {
                        pipeline = pipeline.webp({ 
                            lossless: true,
                            effort: 6,
                            loop: 0
                        });
                    } else {
                        pipeline = pipeline.webp({ 
                            lossless: true,
                            effort: 6 
                        });
                    }

                    await pipeline.toFile(targetPublicOutputPath);
                    await fs.promises.unlink(fullPath);
                    
                } catch (err) {
                    console.error(`❌ Failed processing output for ${file.name}:`, err);
                }
            }
        }
    }
}

if (fs.existsSync(SRC_PRESETS_DIR)) {
    console.log('🚀 Starting batch Sharp LOSSLESS image synchronization to public folder...');
    processDirectory(SRC_PRESETS_DIR)
        .then(() => console.log('🎉 All assets synced and losslessly optimized into public/presets successfully!'))
        .catch(err => console.error('Error running conversion pipeline:', err));
} else {
    console.error(`Directory missing: ${SRC_PRESETS_DIR}`);
}