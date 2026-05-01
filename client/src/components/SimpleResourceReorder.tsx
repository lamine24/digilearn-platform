import React, { useState, useEffect } from "react";
import { GripVertical, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Resource {
  id: number;
  title: string;
  type: string;
  order: number;
}

interface SimpleResourceReorderProps {
  resources: Resource[];
  onReorder: (orderedIds: number[]) => void;
  onEdit?: (resource: Resource) => void;
  onDelete?: (resourceId: number) => void;
}

export function SimpleResourceReorder({
  resources,
  onReorder,
  onEdit,
  onDelete,
}: SimpleResourceReorderProps) {
  const [items, setItems] = useState(resources);
  const [draggedItem, setDraggedItem] = useState<number | null>(null);

  useEffect(() => {
    setItems(resources);
  }, [resources]);

  const handleDragStart = (id: number) => {
    setDraggedItem(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: number) => {
    if (draggedItem === null || draggedItem === targetId) return;

    const draggedIndex = items.findIndex((item) => item.id === draggedItem);
    const targetIndex = items.findIndex((item) => item.id === targetId);

    const newItems = [...items];
    [newItems[draggedIndex], newItems[targetIndex]] = [
      newItems[targetIndex],
      newItems[draggedIndex],
    ];

    setItems(newItems);
    setDraggedItem(null);

    // Notify parent with new order
    onReorder(newItems.map((item) => item.id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
    onReorder(newItems.map((item) => item.id));
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    setItems(newItems);
    onReorder(newItems.map((item) => item.id));
  };

  if (!items || items.length === 0) {
    return (
      <div className="p-8 text-center border-2 border-dashed rounded-lg">
        <p className="text-sm text-muted-foreground">
          Aucune ressource à réorganiser
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((resource, index) => (
        <div
          key={resource.id}
          draggable
          onDragStart={() => handleDragStart(resource.id)}
          onDragOver={handleDragOver}
          onDrop={() => handleDrop(resource.id)}
          className={cn(
            "flex items-center gap-3 p-3 bg-card border rounded-lg cursor-move transition-all",
            draggedItem === resource.id && "opacity-50 bg-muted"
          )}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{resource.title}</p>
            <p className="text-xs text-muted-foreground">{resource.type}</p>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => moveUp(index)}
              disabled={index === 0}
              className="h-8 w-8 p-0"
              title="Monter"
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => moveDown(index)}
              disabled={index === items.length - 1}
              className="h-8 w-8 p-0"
              title="Descendre"
            >
              ↓
            </Button>
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(resource)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(resource.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
