// near api js
import { providers } from 'near-api-js';

// wallet selector
import { distinctUntilChanged, map } from 'rxjs';
import '@near-wallet-selector/modal-ui/styles.css';
import { setupModal } from '@near-wallet-selector/modal-ui';
import { setupWalletSelector } from '@near-wallet-selector/core';
import { setupHereWallet } from '@near-wallet-selector/here-wallet';
import { setupMyNearWallet } from '@near-wallet-selector/my-near-wallet';

const THIRTY_TGAS = '30000000000000';
const NO_DEPOSIT = '0';

export class Wallet {
  constructor({ 
    networkId = process.env.NEXT_PUBLIC_NEAR_NETWORK_ID || 'testnet', 
    createAccessKeyFor = process.env.NEXT_PUBLIC_CONTRACT_NAME || 'finowl.testnet' 
  }) {
    this.createAccessKeyFor = createAccessKeyFor;
    this.networkId = networkId;
  }

  startUp = async (accountChangeHook) => {
    this.selector = setupWalletSelector({
      network: this.networkId,
      modules: [setupMyNearWallet(), setupHereWallet()]
    });

    const walletSelector = await this.selector;
    const isSignedIn = walletSelector.isSignedIn();
    const accountId = isSignedIn ? walletSelector.store.getState().accounts[0].accountId : '';

    walletSelector.store.observable
      .pipe(
        map(state => state.accounts),
        distinctUntilChanged()
      )
      .subscribe(accounts => {
        const signedAccount = accounts.find((account) => account.active)?.accountId;
        accountChangeHook(signedAccount);
      });

    return accountId;
  };

  signIn = async () => {
    const modal = setupModal(await this.selector, { contractId: this.createAccessKeyFor });
    modal.show();
  };

  signOut = async () => {
    const selectedWallet = await (await this.selector).wallet();
    selectedWallet.signOut();
  };

  viewMethod = async ({ contractId, method, args = {} }) => {
    const url = `https://rpc.${this.networkId}.near.org`;
    const provider = new providers.JsonRpcProvider({ url });

    let res = await provider.query({
      request_type: 'call_function',
      account_id: contractId,
      method_name: method,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
      finality: 'optimistic',
    });
    return JSON.parse(Buffer.from(res.result).toString());
  };

  callMethod = async ({ contractId, method, args = {}, gas = THIRTY_TGAS, deposit = NO_DEPOSIT }) => {
    const selectedWallet = await (await this.selector).wallet();
    const outcome = await selectedWallet.signAndSendTransaction({
      receiverId: contractId,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: method,
            args,
            gas,
            deposit,
          },
        },
      ],
    });

    return providers.getTransactionLastResult(outcome);
  };

  getTransactionResult = async (txhash) => {
    const walletSelector = await this.selector;
    const { network } = walletSelector.options;
    const provider = new providers.JsonRpcProvider({ url: network.nodeUrl });

    const transaction = await provider.txStatus(txhash, 'unnused');
    return providers.getTransactionLastResult(transaction);
  };
}

// Create and export a singleton instance
export const wallet = new Wallet({}); 