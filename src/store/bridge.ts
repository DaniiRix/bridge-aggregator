import { createStore } from 'zustand/vanilla'

export interface Token {
    name: string
    symbol: string
    address: string
    decimals: number
    logo: string
}

export interface Chain {
    id: number
    name: string
    iconUrl: string
}

export type BridgeState = {
    isPrivacyEnabled: boolean
    from: {
        chain?: Chain
        token?: Token
        amount?: string
    }
    to: {
        chain?: Chain
        token?: Token
        amount?: string
    }
}

export type BridgeActions = {
    togglePrivacy: (checked: boolean) => void
    setFromChain: (chain: Chain) => void
    setFromToken: (token: Token) => void
    setFromAmount: (amount: string) => void
    setToChain: (chain: Chain) => void
    setToToken: (token: Token) => void
    setToAmount: (amount: string) => void
}

export type BridgeStore = BridgeState & BridgeActions

export const defaultInitState: BridgeState = {
    isPrivacyEnabled: false,
    from: {},
    to: {},
}

export const createBridgeStore = (
    initState: BridgeState = defaultInitState,
) => {
    return createStore<BridgeStore>()((set) => ({
        ...initState,
        togglePrivacy: (checked) => set(() => ({ isPrivacyEnabled: checked })),
        setFromChain: (chain) => set((state) => ({ from: { ...state.from, chain } })),
        setFromToken: (token) => set((state) => ({ from: { ...state.from, token } })),
        setFromAmount: (amount) => set((state) => ({ from: { ...state.from, amount } })),
        setToChain: (chain) => set((state) => ({ to: { ...state.to, chain } })),
        setToToken: (token) => set((state) => ({ to: { ...state.to, token } })),
        setToAmount: (amount) => set((state) => ({ to: { ...state.to, amount } })),
    }))
}
