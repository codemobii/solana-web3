// getOrCreateAssociatedTokenAccount.ts
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { Transaction } from "@solana/web3.js";
import { createAssociatedTokenAccountInstruction } from "./createAssociatedTokenAccountInstruction";
import { getAccountInfo } from "./getAccountInfo";
import { getAssociatedTokenAddress } from "./getAssociatedTokerAddress";

export async function getOrCreateAssociatedTokenAccount(
  connection,
  payer,
  mint,
  owner,
  signTransaction,
  allowOwnerOffCurve = false,
  commitment,
  programId = TOKEN_PROGRAM_ID,
  associatedTokenProgramId = ASSOCIATED_TOKEN_PROGRAM_ID
) {
  const associatedToken = await getAssociatedTokenAddress(
    mint,
    owner,
    allowOwnerOffCurve,
    programId,
    associatedTokenProgramId
  );

  let account;
  try {
    account = await getAccountInfo(
      connection,
      associatedToken,
      commitment,
      programId
    );
  } catch (error) {
    // TokenAccountNotFoundError can be possible if the associated address has already received some lamports,
    // becoming a system account. Assuming program derived addressing is safe, this is the only case for the
    // TokenInvalidAccountOwnerError in this code path.
    if (
      error.message === "TokenAccountNotFoundError" ||
      error.message === "TokenInvalidAccountOwnerError"
    ) {
      // As this isn't atomic, it's possible others can create associated accounts meanwhile.
      try {
        const transaction = new Transaction().add(
          createAssociatedTokenAccountInstruction(
            payer,
            associatedToken,
            owner,
            mint,
            programId,
            associatedTokenProgramId
          )
        );

        const blockHash = await connection.getRecentBlockhash();
        transaction.feePayer = await payer;
        transaction.recentBlockhash = await blockHash.blockhash;
        const signed = await signTransaction(transaction);

        const signature = await connection.sendRawTransaction(
          signed.serialize()
        );

        await connection.confirmTransaction(signature);
      } catch (error) {
        // Ignore all errors; for now there is no API-compatible way to selectively ignore the expected
        // instruction error if the associated account exists already.
      }

      // Now this should always succeed
      account = await getAccountInfo(
        connection,
        associatedToken,
        commitment,
        programId
      );
    } else {
      throw error;
    }
  }

  if (!account.mint.equals(mint.toBuffer()))
    throw Error("TokenInvalidMintError");
  if (!account.owner.equals(owner.toBuffer()))
    throw new Error("TokenInvalidOwnerError");
}
