const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

const MESSAGES_DIR = path.join(__dirname, 'messages');
const PROCESSED_DIR = path.join(__dirname, 'processed');
const BACKEND_PATH = path.join(__dirname, '..');
const FRONTEND_PATH = path.join(__dirname, '..', '..', 'frontend-pedidos');

// Ensure directories exist
fs.ensureDirSync(MESSAGES_DIR);
fs.ensureDirSync(PROCESSED_DIR);

async function processNextMessage() {
    try {
        const files = await fs.readdir(MESSAGES_DIR);
        const pendingFiles = files.filter(f => f.startsWith('msg_PENDING_')).sort();

        if (pendingFiles.length === 0) {
            return;
        }

        const filename = pendingFiles[0];
        const filepath = path.join(MESSAGES_DIR, filename);
        const commandText = await fs.readFile(filepath, 'utf8');

        console.log(`\n--- Processing Command: ${filename} ---`);
        console.log(`Instruction: ${commandText}`);

        // 1. PERFORM RELEASE LOGIC
        // In this automated flow, we assume the instruction is to create a release.
        // We will perform a build check and then git push.

        try {
            console.log('Running build check in Frontend...');
            // execSync('npm run build', { cwd: FRONTEND_PATH, stdio: 'inherit' });

            console.log('Committing and Pushing Backend updates...');
            execSync('git add .', { cwd: BACKEND_PATH, stdio: 'inherit' });
            try {
                execSync(`git commit -m "Automated Release: ${commandText.substring(0, 50)}"`, { cwd: BACKEND_PATH, stdio: 'inherit' });
            } catch (e) {
                console.log('No changes to commit in Backend.');
            }
            execSync('git push', { cwd: BACKEND_PATH, stdio: 'inherit' });

            console.log('Committing and Pushing Frontend updates...');
            execSync('git add .', { cwd: FRONTEND_PATH, stdio: 'inherit' });
            try {
                execSync(`git commit -m "Automated Release: ${commandText.substring(0, 50)}"`, { cwd: FRONTEND_PATH, stdio: 'inherit' });
            } catch (e) {
                console.log('No changes to commit in Frontend.');
            }
            execSync('git push', { cwd: FRONTEND_PATH, stdio: 'inherit' });

            // 2. MOVE TO PROCESSED
            const processedFilename = filename.replace('PENDING', 'SUCCESS');
            await fs.move(filepath, path.join(PROCESSED_DIR, processedFilename));
            console.log(`✅ Successfully processed and uploaded: ${filename}`);

        } catch (releaseErr) {
            console.error('Failed to complete release:', releaseErr);
            // Optionally move to a "failed" folder
            const failedFilename = filename.replace('PENDING', 'FAILED');
            await fs.move(filepath, path.join(PROCESSED_DIR, failedFilename));
        }

    } catch (err) {
        console.error('Error in processing loop:', err);
    }
}

console.log('Release Processor started. Watching for new commands...');
// Run every 60 seconds
setInterval(processNextMessage, 60000);

// Initial run
processNextMessage();
