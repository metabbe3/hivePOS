"use client";

import Link from "next/link";
import { CustomerCard } from "./customer-card";
import type { CustomerListItem } from "./types";

interface CustomerListProps {
  customers: CustomerListItem[];
  /** When true, cards are NOT wrapped in a Link (employees can't open detail). */
  isEmployee?: boolean;
  onEdit: (customer: CustomerListItem) => void;
  onDelete: (customer: CustomerListItem) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export function CustomerList({
  customers,
  isEmployee = false,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}: CustomerListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {customers.map((c) =>
        isEmployee ? (
          <CustomerCard
            key={c.id}
            customer={c}
            onEdit={onEdit}
            onDelete={onDelete}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        ) : (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            className="block h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 rounded-xl"
          >
            <CustomerCard
              customer={c}
              onEdit={onEdit}
              onDelete={onDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          </Link>
        ),
      )}
    </div>
  );
}
