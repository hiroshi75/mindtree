import { Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ColorPicker } from "./ColorPicker";

interface NodeContentProps {
  text: string;
  isEditing: boolean;
  isSelected: boolean;
  isHovered: boolean;
  backgroundColor: string | null | undefined;
  editText: string;
  nodeId: string;
  searchResults?: string[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  onTextChange: (text: string) => void;
  // onEditKeyDown removed as event processing is handled in TreeNode component.
  onTextClick: (e: React.MouseEvent) => void;
  onDelete?: (id: string) => void;
  onColorChange?: (id: string, color: string | null) => void;
}

export function NodeContent({
  text,
  isEditing,
  isSelected,
  isHovered,
  backgroundColor,
  editText,
  nodeId,
  searchResults,
  inputRef,
  onTextChange,
  onTextClick,
  onDelete,
  onColorChange
}: NodeContentProps) {

  return (
    <Card
      className={`p-3 w-full hover:bg-accent/50 cursor-pointer transition-colors group ${backgroundColor ? "bg-opacity-10" : ""} ${isSelected ? "hover:bg-accent/30" : ""}`}
      style={{
        backgroundColor: searchResults?.includes(nodeId) ? "#fef9c3" : backgroundColor || undefined,
      }}
    >
      <div className="flex items-center justify-between">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => onTextChange(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            autoFocus
          />
        ) : (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onTextClick(e);
            }}
            className="cursor-text outline-none"
            role="textbox"
            aria-label={`ノードのテキスト: ${text}`}
          >
            {text}
          </span>
        )}
        {isHovered && (
          <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-2">
            <ColorPicker nodeId={nodeId} backgroundColor={backgroundColor} onColorChange={onColorChange} />
            <Trash2
              className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(nodeId);
              }}
            />
          </div>
        )}
      </div>
    </Card>
  );
}
