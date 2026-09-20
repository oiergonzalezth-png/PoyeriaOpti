import React from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body: string;
}

export default function EmptyState({ icon: Icon, title, body }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="empty">
      <div className="empty__icon">
        <Icon size={22} aria-hidden="true" />
      </div>
      <h2 className="empty__title">{title}</h2>
      <p className="empty__body">{body}</p>
    </div>
  );
}
