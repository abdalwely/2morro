import {
  Globe, Smartphone, Workflow, RefreshCcw, Cloud, ShieldCheck, Blocks, BarChart3,
  BrainCircuit, PenTool, ClipboardList, Lightbulb, Headphones, Wrench, Database,
  Server, Search, ShoppingCart, Users, UserCog, GraduationCap, Bot, Layers,
  Menu, X, ArrowLeft, ChevronDown, ChevronLeft, ExternalLink, Mail, MessageCircle,
  Copy, Check, Eye, Pencil, Trash2, Plus, Upload, ImageIcon, LayoutDashboard,
  Briefcase, Boxes, Settings, LogOut, Clock, ListChecks, Target, Sparkles,
  Shield, Code2, Rocket, Phone, ArrowUp, ArrowDown, Building2, Compass, Award,
  CalendarClock, FileText, Gauge, Handshake, LineChart, Lock, Plug, Route, UsersRound,
} from "lucide-react";

export const ICONS = {
  Globe, Smartphone, Workflow, RefreshCcw, Cloud, ShieldCheck, Blocks, BarChart3,
  BrainCircuit, PenTool, ClipboardList, Lightbulb, Headphones, Wrench, Database,
  Server, Search, ShoppingCart, Users, UserCog, GraduationCap, Bot, Layers,
  Menu, X, ArrowLeft, ChevronDown, ChevronLeft, ExternalLink, Mail, MessageCircle,
  Copy, Check, Eye, Pencil, Trash2, Plus, Upload, ImageIcon, LayoutDashboard,
  Briefcase, Boxes, Settings, LogOut, Clock, ListChecks, Target, Sparkles,
  Shield, Code2, Rocket, Phone, ArrowUp, ArrowDown, Building2, Compass, Award,
  CalendarClock, FileText, Gauge, Handshake, LineChart, Lock, Plug, Route, UsersRound,
};

export function getIcon(name) {
  return ICONS[name] || Layers;
}

export const ICON_NAMES = Object.keys(ICONS);
