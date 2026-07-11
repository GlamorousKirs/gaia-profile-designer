import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

sharp.concurrency(1);
sharp.cache(false);

const TASKS = [
	{
		src: path.join(process.cwd(), 'app', 'assets'),
		dest: path.join(process.cwd(), 'public', 'optimized-assets')
	},
	{
		src: path.join(process.cwd(), 'app', 'premade'),
		dest: path.join(process.cwd(), 'public', 'optimized-assets')
	}
];

async function processDirectory(currentDir, baseSrc, baseDest) {
	const files = await fs.promises.readdir(currentDir, { withFileTypes: true });

	for (const file of files) {
		const fullPath = path.join(currentDir, file.name);

		if (file.isDirectory()) {
			await processDirectory(fullPath, baseSrc, baseDest);
		} else {
			const ext = path.extname(file.name).toLowerCase();

			if (['.png', '.jpg', '.jpeg', '.gif'].includes(ext)) {
				const relativePathFromSrc = path.relative(baseSrc, fullPath);
				const targetPublicOutputPath = path.join(
					baseDest,
					path.dirname(relativePathFromSrc),
					`${path.basename(file.name, ext)}.webp`
				);

				try {
					await fs.promises.mkdir(path.dirname(targetPublicOutputPath), { recursive: true });

					const isGif = ext === '.gif';

					let pipeline = sharp(fullPath, {
						animated: isGif,
						pages: isGif ? -1 : 1,
						limitInputPixels: 0
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
				} catch (err) {
					console.error(`❌ Failed processing output for ${file.name}:`, err);
					process.exit(1);
				}
			}
		}
	}
}

async function run() {
	const destDir = path.join(process.cwd(), 'public', 'optimized-assets');
	if (fs.existsSync(destDir)) {
		await fs.promises.rm(destDir, { recursive: true, force: true });
	}

	for (const task of TASKS) {
		if (fs.existsSync(task.src)) {
			await processDirectory(task.src, task.src, task.dest);
		}
	}
}

run().catch(err => {
	console.error('Error:', err);
	process.exit(1);
});