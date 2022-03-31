import { TOKEN_PROGRAM_ID, AccountLayout } from "@solana/spl-token";

export async function getAccountInfo(
  connection,
  address,
  commitment,
  programId = TOKEN_PROGRAM_ID
) {
  const info = await connection.getAccountInfo(address, commitment);
  if (!info) throw new Error("TokenAccountNotFoundError");
  if (!info.owner.equals(programId))
    throw new Error("TokenInvalidAccountOwnerError");
  if (info.data.length != AccountLayout.span)
    throw new Error("TokenInvalidAccountSizeError");

  const rawAccount = AccountLayout.decode(Buffer.from(info.data));

  return {
    address,
    mint: rawAccount.mint,
    owner: rawAccount.owner,
    amount: rawAccount.amount,
    delegate: rawAccount.delegateOption ? rawAccount.delegate : null,
    delegatedAmount: rawAccount.delegatedAmount,
    isInitialized: rawAccount.state !== 0,
    isFrozen: rawAccount.state === 2,
    isNative: !!rawAccount.isNativeOption,
    rentExemptReserve: rawAccount.isNativeOption ? rawAccount.isNative : null,
    closeAuthority: rawAccount.closeAuthorityOption
      ? rawAccount.closeAuthority
      : null,
  };
}
