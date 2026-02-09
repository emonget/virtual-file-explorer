import { useState, useMemo } from 'react';
import {
    Folder,
    File,
    ChevronRight,
    Search,
    Upload,
    HardDrive,
    Grid,
    List as ListIcon,
    ArrowLeft
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

    const activeDisk = useMemo(() =>
        disks.find(d => d.id === activeDiskId),
        [disks, activeDiskId]
    );

    const currentNodes = useMemo(() => {
        if (!activeDisk) return [];

        // If there's a search query, show all matching nodes across the disk
        if (searchQuery) {
            return activeDisk.nodes.filter(node =>
                node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                node.path.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (!currentFolderId) {
            return activeDisk.rootNodes;
        }

        return activeDisk.childrenByParentId[currentFolderId] || [];
    }, [activeDisk, currentFolderId, searchQuery]);

    const breadcrumbs = useMemo(() => {
        if (!currentPath) return [];
        return currentPath.split('/').filter(Boolean);
    }, [currentPath]);

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
            if (!activeDiskId) {
                setActiveDiskId(newDisk.id);
                setCurrentPath('');
                setCurrentFolderId(null);
            }
        };
        reader.readAsText(file);
    };

    const navigateTo = (node: FileNode | null) => {
        if (!node) {
            setCurrentPath('');
            setCurrentFolderId(null);
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
        const node = activeDisk.nodesByPath[path];
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
        <div className="flex h-screen w-screen bg-[#F8FAFC] overflow-hidden font-sans text-slate-700">
            {/* Sidebar */}
            <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0">
                <div className="p-4 border-bottom border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                        <HardDrive className="w-5 h-5 text-blue-600" />
                        <span>Disks</span>
                    </div>
                    <label className="cursor-pointer p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 transition-colors">
                        <Upload className="w-4 h-4" />
                        <input type="file" className="hidden" onChange={handleUpload} accept=".txt" />
                    </label>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {disks.length === 0 && (
                        <div className="p-4 text-center text-sm text-slate-400">
                            No disks uploaded.
                        </div>
                    )}
                    {disks.map(disk => (
                        <button
                            key={disk.id}
                            onClick={() => {
                                setActiveDiskId(disk.id);
                                setCurrentPath('');
                            }}
                            className={cn(
                                "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2",
                                activeDiskId === disk.id
                                    ? "bg-blue-50 text-blue-700 font-medium"
                                    : "hover:bg-slate-50 text-slate-600"
                            )}
                        >
                            <HardDrive className={cn("w-4 h-4", activeDiskId === disk.id ? "text-blue-600" : "text-slate-400")} />
                            <span className="truncate">{disk.name}</span>
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-white shadow-sm m-4 rounded-xl border border-slate-200 overflow-hidden">
                {/* Header */}
                <header className="h-14 border-b border-slate-100 flex items-center px-4 gap-4 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                    <button
                        onClick={goBack}
                        disabled={!currentPath}
                        className="p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search files and folders..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-1 border-l border-slate-200 pl-4">
                        <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><Grid className="w-4 h-4" /></button>
                        <button className="p-1.5 bg-slate-100 rounded-lg text-slate-900"><ListIcon className="w-4 h-4" /></button>
                    </div>
                </header>

                {/* Breadcrumbs */}
                <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2 text-sm text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <button
                        onClick={() => navigateTo(null)}
                        className={cn("hover:text-blue-600 transition-colors flex items-center gap-2", !currentPath && "text-blue-600 font-medium")}
                    >
                        <HardDrive className="w-4 h-4" />
                        {activeDisk?.name || 'Disk'}
                    </button>
                    {breadcrumbs.map((crumb, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <ChevronRight className="w-3 h-3 text-slate-300" />
                            <button
                                onClick={() => navigateByPath('/' + breadcrumbs.slice(0, i + 1).join('/'))}
                                className={cn(
                                    "hover:text-blue-600 transition-colors max-w-[150px] truncate",
                                    i === breadcrumbs.length - 1 && "text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md"
                                )}
                            >
                                {crumb}
                            </button>
                        </div>
                    ))}
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto">
                    {!activeDisk ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                            <Upload className="w-12 h-12 text-slate-200" />
                            <p>Upload or select a disk to browse</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-white z-[5]">
                                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                                    <th className="px-6 py-3 w-[45%]">Name</th>
                                    <th className="px-4 py-3 w-[10%]">Size</th>
                                    <th className="px-4 py-3 w-[10%]">Type</th>
                                    <th className="px-6 py-3 w-[35%]">Path</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {currentNodes.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                            This directory is empty
                                        </td>
                                    </tr>
                                )}
                                {currentNodes.map(node => (
                                    <tr
                                        key={node.id}
                                        className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                                        onClick={() => node.type === 'directory' && navigateTo(node)}
                                    >
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    node.type === 'directory' ? "bg-amber-50 text-amber-600 group-hover:bg-amber-100" : "bg-slate-50 text-slate-400 group-hover:bg-slate-100"
                                                )}>
                                                    {node.type === 'directory' ? <Folder className="w-4 h-4 fill-current" /> : <File className="w-4 h-4" />}
                                                </div>
                                                <span className="text-sm font-medium text-slate-700 group-hover:text-blue-600 truncate">
                                                    {node.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-slate-500">{node.size}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-slate-500 capitalize">{node.type}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-[11px] text-slate-400 font-mono truncate block max-w-xs">{node.path}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>
        </div>
    );
}
