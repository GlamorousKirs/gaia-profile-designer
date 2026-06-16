import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

// Source directory containing config presets
const SRC_PRESETS_DIR = path.join(process.cwd(), 'app', 'presets');
// Static directory where the client browser reads file tracks from
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
                
                // Determine destination mirror paths
                const relativePathFromSrc = path.relative(SRC_PRESETS_DIR, fullPath);
                const targetPublicOutputPath = path.join(
                    PUBLIC_OUTPUT_DIR, 
                    path.dirname(relativePathFromSrc), 
                    `${path.basename(file.name, ext)}.webp`
                );

                try {
                    // Make sure the destination directories exist inside the public folder
                    await fs.promises.mkdir(path.dirname(targetPublicOutputPath), { recursive: true });
                    
                    console.log(`⚡ Optimizing (Lossless): app/presets/.../${file.name} -> public/presets/.../${path.basename(file.name, ext)}.webp`);
                    
                    const isGif = ext === '.gif';

                    // Read file directly into a buffer to prevent Windows EBUSY locking issues
                    const inputBuffer = await fs.promises.readFile(fullPath);

                    let pipeline = sharp(inputBuffer, { 
                        animated: isGif,
                        pages: isGif ? -1 : 1 
                    });

                    // Proportional resize
                    pipeline = pipeline.resize({ 
                        width: 800,              
                        withoutEnlargement: true  
                    });

                    // Apply Lossless settings
                    if (isGif) {
                        pipeline = pipeline.webp({ 
                            lossless: true, // 100% quality preservation, no pixel degradation
                            effort: 6,      // Maximum compression CPU effort for smaller files
                            loop: 0         // Infinite playback loop for the animation
                        });
                    } else {
                        pipeline = pipeline.webp({ 
                            lossless: true,
                            effort: 6 
                        });
                    }

                    // Save out the new file
                    await pipeline.toFile(targetPublicOutputPath);

                    // Safely wipe out the raw source file
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