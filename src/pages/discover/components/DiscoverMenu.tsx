type DiscoverItem = { id: string; label: string; icon: string; badge?: string };

type DiscoverMenuProps = {
  items: DiscoverItem[];
  activeId: string;
  onSelect: (id: string) => void;
};

export default function DiscoverMenu({ items, activeId, onSelect }: DiscoverMenuProps) {
  return (
    <div className="flex-1 overflow-y-auto wx-scroll px-1.5 pb-4">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            className={`w-full px-2 py-2 mb-0.5 flex items-center gap-3 rounded text-left transition-colors cursor-pointer ${
              active ? "bg-background-300" : "hover:bg-background-200"
            }`}
          >
            <span
              className={`w-8 h-8 flex items-center justify-center rounded shrink-0 text-background-50 ${
                active ? "bg-primary-600" : "bg-primary-500"
              }`}
            >
              <i className={`${item.icon} text-[16px]`}></i>
            </span>
            <span className="text-[13px] text-foreground-950">{item.label}</span>
            {item.badge && (
              <span className="ml-auto text-[11px] text-foreground-500 whitespace-nowrap">
                {item.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}