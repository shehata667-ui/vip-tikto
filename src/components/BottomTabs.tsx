import React from 'react';
import { Home, Sliders, ShieldCheck, ListOrdered, Settings } from 'lucide-react';

export type TabType = 'home' | 'studio' | 'inspector' | 'queue' | 'settings';

interface BottomTabsProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  queueCount?: number;
  hasActiveVideo?: boolean;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({
  currentTab,
  onTabChange,
  queueCount = 0,
  hasActiveVideo = false
}) => {
  const tabs = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'studio', label: 'الاستوديو', icon: Sliders, disabled: !hasActiveVideo },
    { id: 'inspector', label: 'الفحص', icon: ShieldCheck, disabled: !hasActiveVideo },
    { id: 'queue', label: 'الطابور', icon: ListOrdered, badge: queueCount },
    { id: 'settings', label: 'الإعدادات', icon: Settings }
  ];

  return (
    <nav
      style={{
        position: 'sticky',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#0c0e17',
        borderTop: '1px solid #1f2438',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: '8px 4px 14px 4px',
        zIndex: 50,
        backdropFilter: 'blur(10px)'
      }}
    >
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        const isDisabled = tab.disabled;

        return (
          <button
            key={tab.id}
            disabled={isDisabled}
            onClick={() => onTabChange(tab.id as TabType)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              background: 'none',
              color: isActive ? '#fe2c55' : isDisabled ? '#475569' : '#94a3b8',
              opacity: isDisabled ? 0.45 : 1,
              position: 'relative',
              padding: '4px 0'
            }}
          >
            {/* Notification Badge for Queue */}
            {tab.badge && tab.badge > 0 ? (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  right: '25%',
                  backgroundColor: '#fe2c55',
                  color: '#fff',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  padding: '1px 5px',
                  minWidth: '16px',
                  textAlign: 'center'
                }}
              >
                {tab.badge}
              </span>
            ) : null}

            <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span
              style={{
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '-0.2px'
              }}
            >
              {tab.label}
            </span>

            {/* Active Indicator dot */}
            {isActive && (
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: '#fe2c55',
                  marginTop: -1
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
};
