
# ![Virtual File Explorer](/public/favicon.svg)  Virtual File Explorer

Browse your virtual disk files to find the file you are looking for before plugging several disks into your computer.

## 🛠️ Getting Started

### 1. Generate Your Data
To use the explorer, you need to generate a text file representing your directory structure. Use the following command in your terminal:

```bash
tree -h /path/to/your/disk > file.txt
```

### 2. Upload and Browse
- Launch the application.
- Click the **Upload** icon in the sidebar.
- Select your `file.txt`.
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
