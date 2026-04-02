'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  emoji: string;
}

const PARENT_NAV: NavItem[] = [
  { href: '/parent', label: '홈', emoji: '🏠' },
  { href: '/parent/missions', label: '미션', emoji: '⚔️' },
  { href: '/parent/approvals', label: '승인', emoji: '✅' },
  { href: '/parent/wallet', label: '용돈', emoji: '💰' },
  { href: '/settings', label: '설정', emoji: '⚙️' },
];

const CHILD_NAV: NavItem[] = [
  { href: '/child', label: '홈', emoji: '🏠' },
  { href: '/child/missions', label: '퀘스트', emoji: '⚔️' },
  { href: '/child/wallet', label: '지갑', emoji: '💰' },
  { href: '/settings', label: '설정', emoji: '⚙️' },
];

interface BottomNavProps {
  role: 'parent' | 'child';
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = role === 'parent' ? PARENT_NAV : CHILD_NAV;

  const activeText = role === 'parent' ? 'text-quest-coral' : 'text-quest-purple';
  const activeBg = role === 'parent' ? 'bg-quest-coral/10' : 'bg-quest-purple/10';

  function isActive(href: string): boolean {
    if (href === '/parent' || href === '/child') return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-2 pb-safe z-50">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-2 px-3 rounded-xl text-xs transition-all ${
                active
                  ? `${activeText} ${activeBg} font-semibold`
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="text-lg mb-0.5">{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
