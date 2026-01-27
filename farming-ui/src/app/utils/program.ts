import { AnchorProvider, Program, Idl, setProvider } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { FARMING_GAME_PROGRAM_ID } from "./gameHelpers";
import idl from "./farming_game.json";

export { idl };

export const getProgram = (connection: Connection, wallet: any) => {
    const provider = new AnchorProvider(connection, wallet, {
        commitment: "processed",
    });
    setProvider(provider);
    return new Program(idl as Idl, provider);
};
