import { useState } from "react";
import { myServices } from "@/mocks/wechat";

type ServiceItem = { id: string; label: string; icon: string };

const stats = [
  { label: "零钱", value: "¥ 1,286.40", tone: "primary" },
  { label: "优惠券", value: "3 张", tone: "accent" },
  { label: "积分", value: "520", tone: "secondary" },
];

export default function ServicesPanel() {
  const services = myServices as ServiceItem[];
  const [notice, setNotice] = useState("");

  const flash = (label: string) => {
    setNotice(`${label} 为演示占位`);
    window.setTimeout(() => setNotice(""), 1800);
  };

  return (
    <div className="mx-auto max-w-[680px] space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {stats.map((item) => (
          <div key={item.label} className="wx-fade-up rounded bg-background-50 p-4">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  item.tone === "primary"
                    ? "bg-primary-500"
                    : item.tone === "accent"
                      ? "bg-accent-500"
                      : "bg-secondary-500"
                }`}
              ></span>
              <p className="text-[11.5px] text-foreground-500">{item.label}</p>
            </div>
            <p className="mt-1.5 text-[18px] text-foreground-950">{item.value}</p>
          </div>
        ))}
      </div>

      {notice && (
        <div className="wx-pop-in inline-flex px-3 py-1.5 rounded-md bg-accent-100 text-accent-800 text-[11.5px]">
          {notice}
        </div>
      )}

      <div className="wx-fade-up rounded bg-background-50 overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <h4 className="text-[13px] text-foreground-700">我的服务</h4>
          <span className="text-[11.5px] text-foreground-400">共 {services.length} 项</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 border-t border-background-100">
          {services.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => flash(item.label)}
              className="py-5 flex flex-col items-center gap-2 hover:bg-background-100 transition-colors cursor-pointer"
            >
              <span className="w-10 h-10 flex items-center justify-center rounded bg-primary-50 text-primary-700">
                <i className={`${item.icon} text-[19px]`}></i>
              </span>
              <span className="text-[12.5px] text-foreground-700">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="wx-fade-up rounded bg-background-50 p-4">
        <h4 className="text-[13px] text-foreground-700">本月账单</h4>
        <div className="mt-3 space-y-2.5">
          {[
            { name: "coffee lab 咖啡", time: "今天 09:12", amount: "- 32.00" },
            { name: "地铁出行", time: "今天 08:40", amount: "- 5.00" },
            { name: "设计稿打款", time: "昨天 18:20", amount: "+ 2,400.00" },
          ].map((bill) => (
            <div key={bill.name} className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-background-400"></span>
              <div className="min-w-0">
                <p className="text-[12.5px] text-foreground-800 truncate">{bill.name}</p>
                <p className="text-[11px] text-foreground-400">{bill.time}</p>
              </div>
              <span
                className={`ml-auto text-[13px] ${
                  bill.amount.startsWith("+") ? "text-primary-600" : "text-foreground-700"
                }`}
              >
                {bill.amount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}