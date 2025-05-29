import { AccountDetails } from "@/components/accounts/account-details";

export default async function AccountDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AccountDetails id={id} />;
}
