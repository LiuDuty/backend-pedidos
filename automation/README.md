# Antigravity Remote Control (WhatsApp)

This system allows you to control the release process of the Pedidos project via WhatsApp.

## Components

1.  **WhatsApp Listener (`whatsapp_listener.js`)**: 
    - Connects to WhatsApp.
    - Listens for messages from `+5511975040117`.
    - Saves messages as pending commands in the `messages/` folder.
    - Responds to the sender when a command is received.

2.  **Release Processor (`release_processor.js`)**:
    - Monitors the `messages/` folder every 60 seconds.
    - Reads pending commands.
    - Performs `git add .`, `git commit`, and `git push` for both **Backend** and **Frontend** projects.
    - Moves processed commands to the `processed/` folder.

## How to use

### 1. Initial Setup
Make sure you are in the `automation` folder:
```bash
cd c:\Pedidos\backend-pedidos\automation
npm install
```

### 2. Run the WhatsApp Listener
In a terminal, run:
```bash
npm run start:listener
```
- A **QR Code** will appear.
- Scan it with your WhatsApp (Settings > Linked Devices > Link a Device).
- Once connected, it will stay listening.

### 3. Run the Release Processor
In **another** terminal, run:
```bash
npm run start:processor
```
- This will check for new messages every minute.

### 4. Sending Commands
Send a message from `+5511975040117` to the connected account.
Example: `"Nova release com correções do PDF"`

The system will:
- Receive the message.
- Save it.
- Commit all changes in both projects with that message.
- Push to GitHub.
- Archive the command.

## Important Notes
- Ensure your Git credentials are configured (no password prompt required for `git push`).
- The scripts run independently and can be kept running in the background.
