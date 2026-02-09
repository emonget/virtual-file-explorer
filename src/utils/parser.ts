export interface FileNode {
    id: string;
    name: string;
    size: string;
    type: 'file' | 'directory';
    path: string;
    parentId: string | null;
}

export interface ParseResult {
    nodes: FileNode[];
    childrenByParentId: Record<string, FileNode[]>;
    rootNodes: FileNode[];
    nodesById: Record<string, FileNode>;
    nodesByPath: Record<string, FileNode>;
}

export const parseTreeOutput = (text: string): ParseResult => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const nodes: FileNode[] = [];
    const stack: { depth: number; path: string; id: string }[] = [];
    const childrenByParentId: Record<string, FileNode[]> = {};
    const rootNodes: FileNode[] = [];
    const nodesById: Record<string, FileNode> = {};
    const nodesByPath: Record<string, FileNode> = {};

    for (const line of lines) {
        // Regex to match: optional indentation/tree chars, size in brackets, then name
        // Example: |   `-- [ 4.8M]  UnrealCEFSubProcess
        const match = line.match(/^([| \t`-]*)\s*\[\s*([^\]]+)\]\s+(.+)$/);
        if (!match) continue;

        const [_, prefix, size, name] = match;

        // Depth is based on the prefix length / 4 (as most tree outputs use 4 spaces or equivalent)
        // Actually, tree output indentation is more reliable by looking at where the brackets start
        const depth = prefix.length;

        // Pop from stack until we find the parent (one with less depth)
        while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
            stack.pop();
        }

        const parent = stack.length > 0 ? stack[stack.length - 1] : null;

        // We'll determine if it's a directory by looking ahead or by common patterns
        // Usually tree output marks directories if they have children following them.
        // However, for this tool, we can also infer it if it has trailing slash or just assume
        // Based on the example, folders like '/mnt' or 'EpicGames' don't have special markers
        // BUT in a tree, folders are followed by children. 
        // Let's check for the "type" column in the screenshot. It says "File". 
        // Folders should probably be identified by whether they contain other items.

        const cleanName = name.trim();
        const parentPath = parent ? parent.path : '';
        // Ensure paths always start with / and don't have double //
        const fullPath = parentPath === '' ? `/${cleanName}` : `${parentPath}/${cleanName}`.replace(/\/+/g, '/');

        const id = crypto.randomUUID();
        const newNode: FileNode = {
            id,
            name: cleanName,
            size: size.trim(),
            type: 'file', // Default to file, will refine later
            path: fullPath,
            parentId: parent ? parent.id : null,
        };

        nodes.push(newNode);
        nodesById[id] = newNode;
        nodesByPath[fullPath] = newNode;

        if (parent) {
            if (!childrenByParentId[parent.id]) {
                childrenByParentId[parent.id] = [];
            }
            childrenByParentId[parent.id].push(newNode);

            // Update parent type to directory if it has children
            const parentNodeInArray = nodesById[parent.id];
            if (parentNodeInArray) parentNodeInArray.type = 'directory';
        } else {
            rootNodes.push(newNode);
        }

        stack.push({ depth, path: fullPath, id });
    }

    return { nodes, childrenByParentId, rootNodes, nodesById, nodesByPath };
};
