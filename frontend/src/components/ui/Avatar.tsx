import { cn, getInitials } from '../../lib/utils';

interface AvatarProps {
  name: string;
  avatar?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { xs: 'w-5 h-5 text-[10px]', sm: 'w-7 h-7 text-xs', md: 'w-8 h-8 text-sm', lg: 'w-10 h-10 text-sm' };
const emojiSizes = { xs: 'text-[10px]', sm: 'text-sm', md: 'text-base', lg: 'text-xl' };

function isEmoji(str: string) {
  return str.length <= 2 && !/^https?:\/\/|^\//.test(str);
}

export function Avatar({ name, avatar, size = 'sm', className }: AvatarProps) {
  if (avatar && isEmoji(avatar)) {
    return (
      <div
        className={cn('rounded-full flex items-center justify-center flex-shrink-0 bg-gray-100', sizes[size], className)}
        title={name}
      >
        <span className={emojiSizes[size]}>{avatar}</span>
      </div>
    );
  }
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={cn('rounded-full object-cover flex-shrink-0', sizes[size], className)}
      />
    );
  }
  const colors = ['bg-primary-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500', 'bg-emerald-500', 'bg-orange-500'];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-medium text-white flex-shrink-0', sizes[size], color, className)}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}
