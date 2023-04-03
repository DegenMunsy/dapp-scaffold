import { FC, useCallback, useState } from "react";
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

  const [voteBank, setVoteBank] = useState(null);

  const getProvider = () => {
    const provider = new AnchorProvider(
      connection,
      ourWallet,
      AnchorProvider.defaultOptions()
    );
    return provider;
  };

  const [voteBanks, setVoteBanks] = useState([]);

  const getVoteBanks = useCallback(async () => {
    const anchProvider = getProvider();
    const program = new Program(idl_object, programID, anchProvider);

    try {
      Promise.all(
        (await connection.getProgramAccounts(programID)).map(async (voteBank) => ({
          ...(await program.account.voteBank.fetch(voteBank.pubkey)),
          pubkey: voteBank.pubkey,
        }))
      ).then((voteBanks) => {
        console.log(voteBanks);
        setVoteBanks(voteBanks);
      });
    } catch (error) {
      console.error("error getting vote banks" + error);
    }
  }, [connection, programID]);

  const initVoteBank = async () => {
    try {
      const anchProvider = getProvider();
      const program = new Program(idl_object, programID, anchProvider);
  
      const seeds = ["vote_account"];
      const [voteAccount] = await PublicKey.findProgramAddress(seeds, program.programId);
  
      await program.rpc.initVoteBank({
        accounts: {
          voteAccount,
          signer: anchProvider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
      });
  
      const fetchedVoteBank = await program.account.voteBank.fetch(voteAccount);
  
      console.log("Vote bank initialized.");
      setVoteBank(fetchedVoteBank);
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
      {voteBank && (
        <div className="md:hero-content flex flex-col">
          <h1>Vote Bank {voteBank.pubkey.toBase58()}</h1>
          <span>GM votes: {voteBank.gm.toString()}</span>
          <span>GN votes: {voteBank.gn.toString()}</span>
        </div>
      )}
    </>
  );
  
}