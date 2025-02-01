import { Palette } from "lucide-react";
import { updateNodeColor } from "@/app/actions/tree";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ColorPickerProps {
  nodeId: string;
  backgroundColor: string | null | undefined;
  onColorChange?: (id: string, color: string | null) => void;
}

const COLORS = [
  '#ffcdd2', '#f8bbd0', '#e1bee7', '#d1c4e9', '#c5cae9',
  '#bbdefb', '#b3e5fc', '#b2ebf2', '#b2dfdb', '#c8e6c9',
  '#dcedc8', '#f0f4c3', '#fff9c4', '#ffecb3', '#ffe0b2'
];

export function ColorPicker({ nodeId, backgroundColor, onColorChange }: ColorPickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div onClick={(e) => e.stopPropagation()}>
          <Palette className="h-3.5 w-3.5 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onClick={async (e) => {
            e.stopPropagation();
            await updateNodeColor(Number(nodeId), null);
            onColorChange?.(nodeId, null);
          }}
        >
          色をクリア
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
          }}
          className="flex items-center gap-2"
        >
          <Popover modal={true}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-2 cursor-pointer w-full"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <div className="w-4 h-4 rounded border" style={{ backgroundColor: backgroundColor || 'white' }} />
                色を選択
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-48"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map((color) => (
                  <div
                    key={color}
                    className="w-6 h-6 rounded cursor-pointer hover:ring-2 ring-primary"
                    style={{ backgroundColor: color }}
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      await updateNodeColor(Number(nodeId), color);
                      onColorChange?.(nodeId, color);
                    }}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
