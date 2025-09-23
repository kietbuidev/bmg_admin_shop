import { getContacts } from "../fetch";
import { ContactsTableClient } from "./client";

const DEFAULT_PAGE_SIZE = 10;

export async function ContactsTable({
  className,
}: {
  className?: string;
}) {
  const initialData = await getContacts({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
  });

  return (
    <ContactsTableClient
      className={className}
      initialData={initialData}
      pageSize={initialData.pagination.per_page || DEFAULT_PAGE_SIZE}
    />
  );
}
