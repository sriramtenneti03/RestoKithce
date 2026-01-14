
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  loading, 
  className = '', 
  ...props 
}) => {
  const base = "inline-flex items-center justify-center font-medium rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none gap-2";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200",
    danger: "bg-rose-500 text-white hover:bg-rose-600",
    outline: "border-2 border-slate-200 text-slate-600 hover:bg-slate-50",
    ghost: "text-slate-500 hover:bg-slate-100"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base"
  };

  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : children}
    </button>
  );
};

export const Badge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    OPEN: "bg-amber-100 text-amber-700 border-amber-200",
    CLOSED: "bg-slate-100 text-slate-600 border-slate-200",
    ORDERED: "bg-sky-100 text-sky-700 border-sky-200",
    PREPARING: "bg-orange-100 text-orange-700 border-orange-200 animate-pulse",
    FINISHED: "bg-emerald-100 text-emerald-700 border-emerald-200",
    READY: "bg-indigo-100 text-indigo-700 border-indigo-200"
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${styles[status] || 'bg-slate-100'}`}>
      {status}
    </span>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
    {children}
  </div>
);
