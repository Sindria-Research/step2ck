import { FlaskConical } from 'lucide-react';
import { EmptyState } from '../components/common';

export function LabValues() {
  return (
    <div className="flex-1 overflow-y-auto bg-[var(--color-bg-secondary)]">
      <div className="max-w-[1200px] mx-auto p-6 md:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] font-display tracking-tight">
            Lab Values
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Reference ranges for common labs
          </p>
        </div>
        <div className="panel animate-fade-in">
          <EmptyState
            icon={FlaskConical}
            title="Coming soon"
            description="Lab value reference tables will be available here for quick lookup during practice."
          />
        </div>
      </div>
    </div>
  );
}
