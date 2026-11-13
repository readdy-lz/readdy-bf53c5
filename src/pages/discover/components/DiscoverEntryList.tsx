type DiscoverItem = { id: string; label: string; icon: string; badge?: string };

type DiscoverEntryListProps = {
  items: DiscoverItem[];
  onSelect: (id: string) => void;
};

const groups: string[][] = [
  ["moments", "channels", "live", "scan", "shake"],
  ["look", "search"],
  ["nearby", "mini"],
];

export default function DiscoverEntryList({ items, onSelect }: DiscoverEntryListProps) {
  const renderRow = (item: DiscoverItem, isLast: boolean) => (
    <button
      key={item.id}
      type="button"
      onClick={() => onSelect(item.id)}
      className="w-full h-[52px] flex items-center gap-3 pl-4 pr-3 bg-background-50 text-left cursor-pointer active:bg-background-100 transition-colors"
    >
      <span className="w-[26px] h-[26px] rounded-[5px] bg-primary-500 text-background-50 flex items-center justify-center shrink-0">
        <i className={`${item.icon} text-[15px]`}></i>
      </span>
      <span
        className={`flex-1 min-w-0 h-full flex items-center gap-2 ${
          isLast ? "" : "border-b border-background-200/70"
        }`}
      >
        <span className="text-[15px] text-foreground-950 truncate">{item.label}</span>
        {item.id === "channels" && (
          <span className="text-[11px] text-foreground-400">直播中</span>
        )}
        {item.id === "moments" && <span className="w-2 h-2 rounded-full bg-accent-500"></span>}
      </span>
      <i className="ri-arrow-right-s-line text-[19px] text-foreground-300 shrink-0"></i>
    </button>
  );

  return (
    <div>
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className={groupIndex === 0 ? "" : "mt-2"}>
          {group
            .map((id) => items.find((item) => item.id === id))
            .filter((item): item is DiscoverItem => Boolean(item))
            .map((item, index, list) => renderRow(item, index === list.length - 1))}
        </div>
      ))}
    </div>
  );
}