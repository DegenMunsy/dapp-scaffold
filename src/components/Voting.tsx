import { FC, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";

import {
  Program,
  AnchorProvider,
  web3,
  BN,
} from "@project-serum/anchor";
import idl from "./onchain_voting.json";
import { PublicKey } from "@solana/web3.js";

const idl_string = JSON.stringify(idl);
const idl_object = JSON.parse(idl_string);
const programID = new PublicKey(idl.metadata.address);

export const Voting: FC = () => {
  const ourWallet = useWallet();
  const { connection } = useConnection();

  const getProvider = () => {
    const provider = new AnchorProvider(
      connection,
      ourWallet,
      AnchorProvider.defaultOptions()
    );
    return provider;
  };

  const initVoteBank = async () => {
    try {
      const anchProvider = getProvider();
      const program = new Program(idl_object, programID, anchProvider);

      await program.rpc.initVoteBank({
        accounts: {
          voteAccount: anchProvider.wallet.publicKey,
          signer: anchProvider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
      });

      console.log("Vote bank initialized.");
    } catch (error) {
      console.error("Error initializing vote bank: " + error);
    }
  };

  const voteForGM = async () => {
    gibVote(0);
  };

  const voteForGN = async () => {
    gibVote(1);
  };

  const gibVote = async (voteTypeIndex) => {
    try {
      const anchProvider = getProvider();
      const program = new Program(idl, programID, anchProvider);
  
      // Pass VoteType as argument
      const voteType = {
        __variant__: voteTypeIndex === 0 ? "GM" : "GN",
      };
  
      await program.rpc.gibVote(voteType, {
        accounts: {
          voteAccount: anchProvider.wallet.publicKey,
          signer: anchProvider.wallet.publicKey,
        },
      });
  
      console.log("Voted for " + (voteTypeIndex === 0 ? "GM" : "GN"));
    } catch (error) {
      console.error("Error voting: " + error);
    }
  };
  
  
  

  return (
    <>
      <div className="flex flex-row justify-center">
        <button
          className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
          onClick={initVoteBank}
        >
          <span>Initialize Vote Bank</span>
        </button>
        <button
          className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
          onClick={voteForGM}
        >
          <span>Vote GM</span>
        </button>
        <button
          className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
          onClick={voteForGN}
        >
          <span>Vote GN</span>
        </button>
      </div>
    </>
  );
};
