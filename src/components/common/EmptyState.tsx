import { Trophy } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
        {icon ?? <Trophy className="w-9 h-9 text-green-500" />}
      </div>
      <h3 className="text-app font-bold text-xl mb-2">{title}</h3>
      <p className="text-app-secondary text-sm max-w-xs mb-6">{description}</p>
      {action}
    </div>
  );
}
