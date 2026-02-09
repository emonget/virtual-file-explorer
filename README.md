
# ![Virtual File Explorer](/public/favicon.svg) Virtual File Explorer

Browse and search through virtual disk snapshots to locate files before physically connecting external drives.

## 🛠️ Getting Started

### 1. Generate Your Data
To use the explorer, you need to generate a text file representing your directory structure. Use the `tree` command with human-readable sizes and dates:

```bash
tree -Dh your-directory > output.txt
```

### 2. Upload and Browse
- Launch the application.
- Click the **Upload** icon in the sidebar.
- Select your `output.txt`.
- Start browsing!



## 🛠️ Development

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```
