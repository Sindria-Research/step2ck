import { useState } from 'react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: 'w-7 h-7 text-[0.65rem]',
  md: 'w-8 h-8 text-xs',
};

function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return name[0].toUpperCase();
}

export function UserAvatar({ src, name, size = 'sm', className = '' }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  const base = `${sizeClasses[size]} rounded-full shrink-0 ${className}`;

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name ?? 'User avatar'}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${base} object-cover`}
      />
    );
  }

  return (
    <div
      className={`${base} bg-[var(--color-bg-tertiary)] flex items-center justify-center font-medium text-[var(--color-text-tertiary)]`}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
