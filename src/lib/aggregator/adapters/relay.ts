// get api key from here: https://docs.relay.link/references/api/api-keys
// ref: https://docs.relay.link/references/api/get-quote-v2

import { estimateGas } from "wagmi/actions";
import { detectWalletType } from "@/hooks/use-eoa";
import { wagmiConfig } from "@/lib/config";
import { BaseAdapter, type Quote, type QuoteRequest } from "./base";

const SUPPORTED_CHAINS = [
  1, // ethereum
  10, // optimism
  25, // cronos
  56, // bsc
  100, // gnosis
  130, // unichain
  137, // polygon
  143, // monad
  146, // sonic
  169, // manta-pacific
  288, // boba
  324, // zksync
  360, // shape
  466, // appchain
  480, // world-chain
  690, // redstone
  747, // flow-evm
  988, // stable
  999, // hyperevm
  1088, // metis
  1101, // polygon-zkevm
  1135, // lisk
  1329, // sei
  1337, // hyperliquid
  1424, // perennial
  1514, // story
  1625, // gravity
  1868, // soneium
  1923, // swellchain
  1996, // sanko
  2020, // ronin
  2741, // abstract
  2818, // morph
  5000, // mantle
  5031, // somnia
  5330, // superseed
  7560, // cyber
  7869, // powerloom-v2
  7897, // arena-z
  8333, // B3
  8453, // base
  9745, // plasma
  33139, // apechain
  33979, // funki
  34443, // mode
  42018, // mythos
  42161, // arbitrum
  42170, // arbitrum-nova
  42220, // celo
  43111, // hemi
  43114, // avalanche
  43419, // gunz
  48900, // zircuit
  55244, // superposition
  57073, // ink
  59144, // linea
  60808, // bob
  69000, // animechain
  80094, // berachain
  81457, // blast
  98866, // plume
  167000, // taiko
  510003, // syndicate
  534352, // scroll
  543210, // zero-network
  660279, // xai
  747474, // katana
  984122, // forma
  5064014, // ethereal
  7777777, // zora
  8253038, // bitcoin
  9286185, // eclipse
  9286186, // soon
  21000000, // corn
  666666666, // degen
  728126428, // tron
  792703809, // solana
  888888888, // ancient8
  1380012617, // rari
];

export class RelayAdapter extends BaseAdapter {
  apiEndpoint = "https://api.relay.link";
  apiKey = ""; // @todo: add api key
  referrer = "defillama.com";

  constructor() {
    super(
      "relay",
      "https://icons.llamao.fi/icons/protocols/relay?w=48&q=75",
      true,
    );
  }

  async supportsRoute(request: QuoteRequest): Promise<boolean> {
    const { srcChainId, dstChainId } = request;
    if (
      !SUPPORTED_CHAINS.includes(srcChainId) ||
      !SUPPORTED_CHAINS.includes(dstChainId)
    )
      return false;

    return true;
  }

  async getQuote(request: QuoteRequest): Promise<Quote> {
    const {
      slippagePercent,
      srcChainId,
      dstChainId,
      inputToken,
      outputToken,
      sender,
      recipient,
      amount,
    } = request;

    const { isEOA, isEIP7702Delegated } = await detectWalletType(
      sender,
      srcChainId,
    );

    const res = await fetch(`${this.apiEndpoint}/quote/v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "x-api-key": this.apiKey, // @todo: add api key
      },
      body: JSON.stringify({
        tradeType: "EXACT_INPUT",
        amount: amount,
        originCurrency: inputToken.address,
        originChainId: srcChainId,
        destinationCurrency: outputToken.address,
        destinationChainId: dstChainId,
        user: sender,
        recipient,
        referrer: this.referrer,
        explicitDeposit: !isEOA || isEIP7702Delegated,
        slippageTolerance: Math.round(slippagePercent * 100),
      }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(
        `[Relay] Error fetching quote: ${errorData.message || res.statusText}`,
      );
    }

    const data = await res.json();
    const dataTx = data.steps[0]?.items[0]?.data;
    if (!dataTx) throw new Error("No data found");

    let estimatedGas = BigInt(0);
    try {
      estimatedGas = await estimateGas(wagmiConfig, {
        chainId: srcChainId,
        account: sender,
        to: dataTx.to,
        data: dataTx.data,
        value: dataTx.value ? BigInt(dataTx.value) : undefined,
      });
    } catch (error) {
      console.warn("[Relay] Failed to estimate gas", error);
    }

    return {
      adapter: { name: this.name, logo: this.logo },
      tokenSpenderAddress: isEOA ? undefined : dataTx.to,
      estimatedTime: data?.details?.timeEstimate || 0,
      estimatedAmount: data?.details?.currencyOut?.amount || "0",
      gasEstimate: estimatedGas?.toString() || "0",
      txRequest: {
        to: dataTx.to,
        data: dataTx.data,
        value: dataTx.value ? BigInt(dataTx.value) : undefined,
      },
    };
  }
}
