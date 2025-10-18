# Push to GitHub Instructions

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `autochat` (or your preferred name)
3. Description: "Chrome extension for automated message sending"
4. Choose Public or Private
5. **DO NOT** initialize with README, .gitignore, or license (we already have these)
6. Click "Create repository"

## Step 2: Add Your SSH Key to GitHub (if not already done)

1. Go to https://github.com/settings/keys
2. Click "New SSH key"
3. Title: "Desktop Computer" (or any name)
4. Key: Paste the following:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIPBpZXvuD4UVO7EKB5IpXD3F8u8JN4zIyI0xPjUSJ6Uv dennis@DESKTOP-JFM7AN4
```

5. Click "Add SSH key"

## Step 3: Push to GitHub

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username and run:

```bash
cd /home/dennis/autochat
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/autochat.git
git branch -M main
git push -u origin main
```

## Alternative: If you get "repository not found" error

You might need to accept the GitHub SSH key first:

```bash
ssh -T git@github.com
```

Type "yes" when prompted, then retry the push commands above.

## Quick Commands (after replacing username)

```bash
cd /home/dennis/autochat
git remote add origin git@github.com:YOUR_GITHUB_USERNAME/autochat.git
git branch -M main
git push -u origin main
```

## Verify

After pushing, visit: `https://github.com/YOUR_GITHUB_USERNAME/autochat`

You should see your repository with all files!
