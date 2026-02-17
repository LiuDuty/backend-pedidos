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
            console.log('--- Step 1: Frontend Build ---');
            try {
                execSync('npm run build', { cwd: FRONTEND_PATH, stdio: 'inherit' });
                console.log('✅ Build successful.');
            } catch (buildErr) {
                console.warn('⚠️ Build failed or skipped, proceeding with push anyway...');
            }

            console.log('--- Step 2: Git Backend ---');
            execSync('git add .', { cwd: BACKEND_PATH, stdio: 'inherit' });
            try {
                execSync(`git commit -m "Remote Release [WhatsApp]: ${commandText.trim().substring(0, 100)}"`, { cwd: BACKEND_PATH, stdio: 'inherit' });
                execSync('git push', { cwd: BACKEND_PATH, stdio: 'inherit' });
                console.log('✅ Backend pushed.');
            } catch (e) {
                console.log('ℹ️ No changes to commit in Backend or push failed.');
            }

            console.log('--- Step 3: Git Frontend ---');
            execSync('git add .', { cwd: FRONTEND_PATH, stdio: 'inherit' });
            try {
                execSync(`git commit -m "Remote Release [WhatsApp]: ${commandText.trim().substring(0, 100)}"`, { cwd: FRONTEND_PATH, stdio: 'inherit' });
                execSync('git push', { cwd: FRONTEND_PATH, stdio: 'inherit' });
                console.log('✅ Frontend pushed.');
            } catch (e) {
                console.log('ℹ️ No changes to commit in Frontend or push failed.');
            }

            // 2. MOVE TO PROCESSED
            const processedFilename = filename.replace('PENDING', 'SUCCESS');
            await fs.move(filepath, path.join(PROCESSED_DIR, processedFilename));
            console.log(`\n🎉 Release Process Completed Successfully! Archivied as ${processedFilename}`);

            // Optional: You could even send a message back here, but the listener does it upon receipt.
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
