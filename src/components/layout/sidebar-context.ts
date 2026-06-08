import { createContext } from 'react';

export interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);
