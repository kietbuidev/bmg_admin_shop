import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";
import { ContactsSkeleton } from "@/components/Tables/contacts/skeleton";
import { ContactsTable } from "@/components/Tables/contacts";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Contacts",
};

export default function ContactsPage() {
  return (
    <>
      <Breadcrumb pageName="Contacts" />

      <Suspense fallback={<ContactsSkeleton />}>
        {/* Contact data will come from backend later */}
        <ContactsTable />
      </Suspense>
    </>
  );
}
