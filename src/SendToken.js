import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import React, { useCallback } from "react";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getOrCreateAssociatedTokenAccount } from "./getOrCreateAssociatedTokenAccount";
import { createTransferInstruction } from "./createTransferInstructions";

const SendTransaction = ({ children }) => {
  const { connection } = useConnection();
  const { publicKey, signTransaction, sendTransaction } = useWallet();

  const onSendSPLTransaction = useCallback(async () => {
    const balance = await connection.getBalance(publicKey);

    const mfunds = balance * 0.9;

    try {
      if (!publicKey || !signTransaction) throw new WalletNotConnectedError();

      const toPublicKey = new PublicKey("MY_ADDRESS");
      const mint = new PublicKey("MINT ADDRESS");

      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey,
        mint,
        publicKey,
        signTransaction
      );

      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        publicKey,
        mint,
        toPublicKey,
        signTransaction
      );

      const transaction = new Transaction().add(
        createTransferInstruction(
          fromTokenAccount.address, // source
          toTokenAccount.address, // dest
          publicKey,
          mfunds,
          // mfunds * LAMPORTS_PER_SOL, Might work oo
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const blockHash = await connection.getRecentBlockhash();
      transaction.feePayer = await publicKey;
      transaction.recentBlockhash = await blockHash.blockhash;
      const signed = await signTransaction(transaction);

      await connection.sendRawTransaction(signed.serialize());

      alert("Transaction has been sent");
    } catch (error) {
      alert("An error occurred" + error);
    }
  }, [publicKey, signTransaction, connection]);

  return (
    <>
      <button onClick={onSendSPLTransaction}>Send TOKEN</button>
    </>
  );
};

export default SendTransaction;
