"use client";

import { useState, useMemo } from "react";
import {
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import { Category, CategoryNode } from "@/components/category/types";

interface UseCategoryTreeProps {
  categories: Category[];
  onMove: (categoryId: string, newParentId: string | null) => Promise<void>;
}

export function useCategoryTree({ categories, onMove }: UseCategoryTreeProps) {
  // Initialize with all categories expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(categories.map((c) => c.id))
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Build tree structure
  const { tree, flatList, nodeMap } = useMemo(() => {
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    // First pass: create all nodes
    categories.forEach((cat) => {
      map.set(cat.id, { ...cat, children: [], depth: 0 });
    });

    // Second pass: build tree and calculate depths
    const calculateDepth = (node: CategoryNode, depth: number) => {
      node.depth = depth;
      node.children.forEach((child) => calculateDepth(child, depth + 1));
    };

    categories.forEach((cat) => {
      const node = map.get(cat.id)!;
      if (cat.parent_id && map.has(cat.parent_id)) {
        map.get(cat.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    roots.forEach((root) => calculateDepth(root, 0));

    // Flatten tree for rendering
    const flat: CategoryNode[] = [];
    const flatten = (nodes: CategoryNode[]) => {
      nodes.forEach((node) => {
        flat.push(node);
        if (expandedIds.has(node.id)) {
          flatten(node.children);
        }
      });
    };
    flatten(roots);

    return { tree: roots, flatList: flat, nodeMap: map };
  }, [categories, expandedIds]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(categories.map((c) => c.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    const draggedId = active.id as string;

    // If dropped outside any target, make it a root category
    if (!over) {
      await onMove(draggedId, null);
      return;
    }

    if (active.id === over.id) return;

    const targetId = over.id as string;

    // Get the target node
    const targetNode = nodeMap.get(targetId);
    if (!targetNode) return;

    // Check if we're trying to drop into a descendant (invalid)
    const isDescendant = (parentId: string, childId: string): boolean => {
      const parent = nodeMap.get(parentId);
      if (!parent) return false;
      for (const child of parent.children) {
        if (child.id === childId || isDescendant(child.id, childId)) {
          return true;
        }
      }
      return false;
    };

    if (isDescendant(draggedId, targetId)) {
      return; // Can't drop parent into its own child
    }

    // Move to be a child of the target (unlimited depth)
    await onMove(draggedId, targetId);

    // Auto-expand the target
    setExpandedIds((prev) => new Set([...prev, targetId]));
  };

  const getVisibleNodes = (node: CategoryNode): CategoryNode[] => {
    const nodes = [node];
    if (expandedIds.has(node.id)) {
      node.children.forEach((child) => {
        nodes.push(...getVisibleNodes(child));
      });
    }
    return nodes;
  };

  const getTotalDescendants = (node: CategoryNode): number => {
    let count = node.children.length;
    node.children.forEach((child) => {
      count += getTotalDescendants(child);
    });
    return count;
  };

  const activeNode = activeId ? nodeMap.get(activeId) : null;

  return {
    sensors,
    tree,
    flatList,
    expandedIds,
    activeId,
    overId,
    activeNode,
    toggleExpand,
    expandAll,
    collapseAll,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    getVisibleNodes,
    getTotalDescendants,
  };
}
