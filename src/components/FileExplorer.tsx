import { useState, useMemo, useDeferredValue } from 'react';
import {
    Folder,
    File,
    ChevronRight,
    ChevronLeft,
    Search,
    Upload,
    HardDrive,
    LayoutGrid,
    List as ListIcon,
    X
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { parseTreeOutput, type FileNode } from '../utils/parser';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Disk {
    id: string;
    name: string;
    nodes: FileNode[];
    childrenByParentId: Record<string, FileNode[]>;
    rootNodes: FileNode[];
    nodesById: Record<string, FileNode>;
    nodesByPath: Record<string, FileNode>;
}

export default function FileExplorer() {
    const [disks, setDisks] = useState<Disk[]>([]);
    const [activeDiskId, setActiveDiskId] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState<string>('');
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

    const deferredSearchQuery = useDeferredValue(searchQuery);

    const activeDisk = useMemo(() =>
        disks.find(d => d.id === activeDiskId),
        [disks, activeDiskId]
    );

    const currentNodes = useMemo(() => {
        if (!activeDisk) return [];

        if (deferredSearchQuery) {
            const q = deferredSearchQuery.toLowerCase();
            // Only search top 1000 results if the list is massive to keep it fast
            // or just filter everything if it's reasonably sized.
            return activeDisk.nodes.filter(node =>
                node.name.toLowerCase().includes(q) ||
                node.path.toLowerCase().includes(q)
            ).slice(0, 500);
        }

        if (!currentFolderId) {
            return activeDisk.rootNodes;
        }

        return activeDisk.childrenByParentId[currentFolderId] || [];
    }, [activeDisk, currentFolderId, deferredSearchQuery]);


    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const content = event.target?.result as string;
            const result = parseTreeOutput(content);
            const newDisk: Disk = {
                id: crypto.randomUUID(),
                name: file.name.replace('.txt', ''),
                ...result
            };
            setDisks(prev => [...prev, newDisk]);

            // Auto-select and navigate if first disk
            if (!activeDiskId) {
                setActiveDiskId(newDisk.id);
                // If only one root folder, go inside it automatically
                if (newDisk.rootNodes.length === 1 && newDisk.rootNodes[0].type === 'directory') {
                    setCurrentPath(newDisk.rootNodes[0].path);
                    setCurrentFolderId(newDisk.rootNodes[0].id);
                } else {
                    setCurrentPath('');
                    setCurrentFolderId(null);
                }
            }
        };
        reader.readAsText(file);
    };

    const navigateTo = (node: FileNode | null) => {
        if (!node) {
            // If we have a single root folder, we should go back to IT instead of the empty root
            if (activeDisk && activeDisk.rootNodes.length === 1 && activeDisk.rootNodes[0].type === 'directory') {
                setCurrentPath(activeDisk.rootNodes[0].path);
                setCurrentFolderId(activeDisk.rootNodes[0].id);
            } else {
                setCurrentPath('');
                setCurrentFolderId(null);
            }
        } else {
            setCurrentPath(node.path);
            setCurrentFolderId(node.id);
        }
        setSearchQuery('');
    };

    const navigateByPath = (path: string) => {
        if (!activeDisk) return;
        if (!path) {
            navigateTo(null);
            return;
        }
        // Normalize path to ensure it starts with / for lookup
        const normalizedPath = path.startsWith('/') ? path : '/' + path;
        const node = activeDisk.nodesByPath[normalizedPath];
        if (node && node.type === 'directory') navigateTo(node);
    };

    const goBack = () => {
        if (!activeDisk || !currentFolderId) return;

        const currentNode = activeDisk.nodesById[currentFolderId];
        if (!currentNode || !currentNode.parentId) {
            navigateTo(null);
            return;
        }

        const parentNode = activeDisk.nodesById[currentNode.parentId];
        if (parentNode) navigateTo(parentNode);
    };

    return (
        <div className="flex h-screen w-screen bg-white overflow-hidden font-sans text-slate-700">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-100 flex flex-col shrink-0">
                <div className="h-14 px-4 border-b border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3 font-bold text-slate-800 text-lg">
                        <HardDrive className="w-5 h-5 text-blue-600" />
                        <span>Disks</span>
                    </div>
                    <label className="cursor-pointer p-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-white transition-colors shadow-sm">
                        <Upload className="w-4 h-4" />
                        <input type="file" className="hidden" onChange={handleUpload} accept=".txt" />
                    </label>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                    {disks.length === 0 && (
                        <div className="p-4 text-center text-sm text-slate-300">
                            No disks uploaded.
                        </div>
                    )}
                    {disks.map(disk => (
                        <button
                            key={disk.id}
                            onClick={() => {
                                setActiveDiskId(disk.id);
                                if (disk.rootNodes.length === 1 && disk.rootNodes[0].type === 'directory') {
                                    setCurrentPath(disk.rootNodes[0].path);
                                    setCurrentFolderId(disk.rootNodes[0].id);
                                } else {
                                    setCurrentPath('');
                                    setCurrentFolderId(null);
                                }
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-3",
                                activeDiskId === disk.id
                                    ? "bg-blue-50 text-blue-600 font-semibold"
                                    : "hover:bg-slate-50 text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <HardDrive className={cn("w-4 h-4", activeDiskId === disk.id ? "text-blue-600" : "text-slate-400")} />
                            <span className="truncate">{disk.name}</span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#F9FAFB] overflow-hidden">
                {/* Header */}
                <header className="h-14 border-b border-slate-100 flex items-center px-4 gap-4 bg-white/90 backdrop-blur-md sticky top-0 z-10">
                    <button
                        onClick={() => {
                            setSearchQuery('');
                            setCurrentPath('');
                            setCurrentFolderId(null);
                            setActiveDiskId(null);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>

                    <div className="flex-1 relative flex items-center">
                        <div className="relative w-full max-w-5xl">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <input
                                type="text"
                                placeholder="Search files and folders..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white transition-all placeholder:text-slate-300"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center border border-slate-100 rounded-lg bg-white overflow-hidden p-0.5 shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn(
                                "p-1.5 rounded-md transition-all flex items-center justify-center min-w-[32px]",
                                viewMode === 'grid' ? "bg-slate-50 text-blue-600 shadow-inner" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "p-1.5 rounded-md transition-all flex items-center justify-center min-w-[32px]",
                                viewMode === 'list' ? "bg-slate-50 text-blue-600 shadow-inner" : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            <ListIcon className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Breadcrumbs */}
                <div className="h-12 border-b border-slate-100 bg-white flex items-center px-6 gap-2 text-[13px] text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <button
                        onClick={goBack}
                        disabled={!currentPath}
                        className="p-2 hover:bg-slate-50 rounded-md disabled:opacity-20 disabled:hover:bg-transparent transition-all group"
                    >
                        <ChevronLeft className="w-4 h-4 text-slate-900 group-hover:text-blue-600" />
                    </button>

                    <div className="w-[1px] h-6 bg-slate-200 mx-2" />

                    <button
                        onClick={() => navigateTo(null)}
                        className={cn("hover:text-blue-600 transition-colors flex items-center gap-2", !currentPath && "text-blue-600 font-semibold")}
                    >
                        <HardDrive className="w-4 h-4 text-slate-400" />
                        <span>{activeDisk?.name || 'Disk'}</span>
                    </button>
                    {(() => {
                        const fullSegments = currentPath.split('/').filter(Boolean);
                        let displaySegments = [...fullSegments];
                        let offset = 0;

                        if (activeDisk && activeDisk.rootNodes.length === 1 &&
                            activeDisk.rootNodes[0].type === 'directory') {
                            const rootName = activeDisk.rootNodes[0].name.replace(/^\//, '');
                            if (fullSegments[0] === rootName) {
                                displaySegments = displaySegments.slice(1);
                                offset = 1;
                            }
                        }

                        return displaySegments.map((crumb, i) => {
                            const actualIndex = i + offset;
                            const breadcrumbPath = '/' + fullSegments.slice(0, actualIndex + 1).join('/');
                            return (
                                <div key={i} className="flex items-center gap-2">
                                    <ChevronRight className="w-3 h-3 text-slate-300" />
                                    <button
                                        onClick={() => navigateByPath(breadcrumbPath)}
                                        className={cn(
                                            "hover:text-blue-600 transition-colors max-w-[200px] truncate px-2 py-1 rounded-md",
                                            i === displaySegments.length - 1 && "text-blue-600 font-semibold bg-blue-50"
                                        )}
                                    >
                                        {crumb}
                                    </button>
                                </div>
                            );
                        });
                    })()}
                </div>

                {/* File List / Grid */}
                <div className="flex-1 overflow-y-auto px-4 py-3">
                    {!activeDisk ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                            <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm">
                                <Upload className="w-8 h-8 text-slate-200" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-medium">Upload or select a disk to browse</p>
                                <div className="mt-6 p-4 border border-slate-100 rounded-xl bg-slate-50/50 max-w-xs mx-auto">
                                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-2">How to generate data</p>
                                    <code className="text-[11px] font-mono text-slate-600">tree -h disk &gt; file.txt</code>
                                </div>
                            </div>
                        </div>
                    ) : viewMode === 'list' ? (
                        <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-50 text-[10px] uppercase tracking-widest text-slate-400 font-bold bg-slate-50/30">
                                        <th className="px-6 py-2.5 w-[40%]">Name</th>
                                        <th className="px-4 py-2.5 w-[12%]">Size</th>
                                        <th className="px-4 py-2.5 w-[12%]">Type</th>
                                        <th className="px-6 py-2.5 w-[36%]">Path</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {currentNodes.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-16 text-center text-slate-300 italic text-sm">
                                                No files or folders found
                                            </td>
                                        </tr>
                                    )}
                                    {currentNodes.map(node => (
                                        <tr
                                            key={node.id}
                                            className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
                                            onClick={() => node.type === 'directory' && navigateTo(node)}
                                        >
                                            <td className="px-6 py-1.5">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "p-1 rounded-lg transition-colors border",
                                                        node.type === 'directory'
                                                            ? "bg-blue-50 border-blue-100 text-blue-500"
                                                            : "bg-white border-slate-100 text-slate-400"
                                                    )}>
                                                        {node.type === 'directory' ? <Folder className="w-3.5 h-3.5 fill-current" /> : <File className="w-3.5 h-3.5" />}
                                                    </div>
                                                    <span className="text-[13px] font-semibold text-slate-800 group-hover:text-blue-600 truncate">
                                                        {node.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-1.5">
                                                <span className="text-[11.5px] text-slate-500 font-medium">{node.size}</span>
                                            </td>
                                            <td className="px-4 py-1.5">
                                                <span className="text-[11.5px] text-slate-400 capitalize">{node.type}</span>
                                            </td>
                                            <td className="px-6 py-1.5">
                                                <span className="text-[10px] text-slate-400 font-mono truncate block max-w-sm">{node.path}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                            {currentNodes.map(node => (
                                <div
                                    key={node.id}
                                    onClick={() => node.type === 'directory' && navigateTo(node)}
                                    className="group bg-white border border-slate-100 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer flex flex-col items-center text-center gap-3"
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors border",
                                        node.type === 'directory'
                                            ? "bg-blue-50 border-blue-100 text-blue-500 group-hover:bg-blue-100"
                                            : "bg-slate-50 border-slate-100 text-slate-300 group-hover:bg-slate-100"
                                    )}>
                                        {node.type === 'directory' ? <Folder className="w-6 h-6 fill-current" /> : <File className="w-6 h-6" />}
                                    </div>
                                    <div className="flex flex-col gap-0.5 w-full">
                                        <span className="text-xs font-bold text-slate-700 truncate group-hover:text-blue-600">{node.name}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">{node.size}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Status Bar */}
                {activeDisk && (
                    <footer className="h-8 border-t border-slate-100 bg-white flex items-center px-6 gap-4 text-[10px] text-slate-400 font-medium">
                        <div className="flex items-center gap-2">
                            <span>{currentNodes.length} items</span>
                        </div>
                        <div className="w-[1px] h-3 bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <span>Free Space: Virtual</span>
                        </div>
                        <div className="w-[1px] h-3 bg-slate-200" />
                        <div className="flex items-center gap-2">
                            <span>Disk created on 03/01/2026</span>
                        </div>
                    </footer>
                )}
            </main>
        </div>
    );
}
