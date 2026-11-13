import { useMemo } from "react";
import { createPortal } from "react-dom";

export type MessageAction = {
  id: string;
  label: string;
  icon: string;
  danger?: boolean;
  onSelect: () => void;
};

type MessageActionMenuProps = {
  rect: DOMRect;
  actions: MessageAction[];
  onClose: () => void;
};

const MENU_WIDTH = 176;
const ITEM_HEIGHT = 40;

export default function MessageActionMenu({ rect, actions, onClose }: MessageActionMenuProps) {
  const position = useMemo(() => {
    const viewportWidth = typeof window === "undefined" ? 1024 : window.innerWidth;
    const left = Math.min(
      Math.max(12, rect.left + rect.width / 2 - MENU_WIDTH / 2),
      Math.max(12, viewportWidth - MENU_WIDTH - 12),
    );
    const menuHeight = actions.length * ITEM_HEIGHT;
    const above = rect.top - menuHeight - 14;
    const top = above > 12 ? above : Math.min(rect.bottom + 14, window.innerHeight - menuHeight - 12);
    return { left, top };
  }, [rect, actions.length]);

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60]"
        onClick={onClose}
        onContextMenu={(event) => {
          event.preventDefault();
          onClose();
        }}
        aria-hidden="true"
      ></div>
      <div
        className="wx-pop-in fixed z-[61] rounded-lg bg-foreground-800 text-background-50 overflow-hidden"
        style={{ left: position.left, top: position.top, width: MENU_WIDTH }}
      >
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => {
              onClose();
              action.onSelect();
            }}
            className={`w-full px-3.5 flex items-center gap-2.5 text-[12.5px] text-left whitespace-nowrap hover:bg-foreground-700 transition-colors cursor-pointer ${
              action.danger ? "text-accent-200" : "text-background-50"
            }`}
            style={{ height: ITEM_HEIGHT }}
          >
            <i className={`${action.icon} text-[15px]`}></i>
            {action.label}
          </button>
        ))}
      </div>
    </>,
    document.body,
  );
}