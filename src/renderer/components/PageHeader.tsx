import React from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({ title, description, actions }: PageHeaderProps): React.JSX.Element {
  return (
    <header className="page__header">
      <div>
        <h1 className="page__title">{title}</h1>
        {description && <p className="page__desc">{description}</p>}
      </div>
      {actions && <div className="page__actions">{actions}</div>}
    </header>
  );
}
