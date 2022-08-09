import type {Dispatch} from "react";
import {createContext} from "react";
import type {AptosAction} from "./AptosContextAction";
import {AptosActionType} from "./AptosContextAction";
import type {Account} from "../aptos";
import type {MachikadoAccount} from "../MachikadoNetwork";

export interface AptosContextData {
    isConnected: boolean
    account: Account | null
    machikadoAccount: MachikadoAccount | null
}


export const AptosContext = createContext<{state: AptosContextData, dispatch: Dispatch<AptosAction>}>({
    state: {
        isConnected: false,
        account: null,
        machikadoAccount: null
    },
    dispatch: () => {}
})

export const aptosReducer = (state: AptosContextData, action: AptosAction) => {
    switch (action.type) {
        case AptosActionType.UpdateIsConnected:
            return {
                ...state,
                isConnected: action.value,
            }
        case AptosActionType.UpdateAccount:
            return {
                ...state,
                account: action.account,
            }
        case AptosActionType.UpdateMachikadoAccount:
            return {
                ...state,
                machikadoAccount: action.account,
            }
    }
    return state
}
