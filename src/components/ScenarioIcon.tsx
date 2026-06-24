'use client';

import {
  Siren,
  Clock,
  Stethoscope,
  UserRoundSearch,
  Pill,
  ClipboardList,
  BookOpen,
  MapPin,
  FileX,
  HelpCircle,
  type LucideIcon,
} from 'lucide-react';

const MAP: Record<string, LucideIcon> = {
  siren: Siren,
  clock: Clock,
  stethoscope: Stethoscope,
  'user-round-search': UserRoundSearch,
  pill: Pill,
  'clipboard-list': ClipboardList,
  'book-open': BookOpen,
  'map-pin': MapPin,
  'file-x': FileX,
  'help-circle': HelpCircle,
};

export function ScenarioIcon({ name, size = 22 }: { name: string; size?: number }) {
  const Icon = MAP[name] ?? HelpCircle;
  return <Icon size={size} aria-hidden />;
}
