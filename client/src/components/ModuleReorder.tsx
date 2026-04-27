import { useState } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Module {
  id: number;
  title: string;
  completed?: boolean;
}

interface ModuleReorderProps {
  modules: Module[];
  onReorder: (modules: Module[]) => void;
  disabled?: boolean;
}

function SortableModule({ module, completed }: { module: Module; completed?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 bg-background border rounded-lg cursor-grab active:cursor-grabbing",
        isDragging && "shadow-lg border-primary"
      )}
    >
      <button {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground">
        <GripVertical className="h-5 w-5" />
      </button>
      <div className="flex-1">
        <p className="font-medium text-sm">{module.title}</p>
      </div>
      {completed ? (
        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
      ) : (
        <Circle className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
}

export function ModuleReorder({ modules, onReorder, disabled = false }: ModuleReorderProps) {
  const [items, setItems] = useState(modules);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(m => m.id === active.id);
      const newIndex = items.findIndex(m => m.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      setItems(newItems);
      onReorder(newItems);
    }
  };

  if (disabled || modules.length === 0) {
    return (
      <div className="space-y-2">
        {modules.map(module => (
          <SortableModule key={module.id} module={module} completed={module.completed} />
        ))}
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map(m => m.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map(module => (
            <SortableModule key={module.id} module={module} completed={module.completed} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
