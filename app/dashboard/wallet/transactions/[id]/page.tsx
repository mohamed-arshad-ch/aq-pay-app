import { TransactionDetails } from "@/components/transactions/transaction-details";

export default function WalletTransactionDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  return <TransactionDetails id={params.id} isWalletTransaction={true} />;
}
