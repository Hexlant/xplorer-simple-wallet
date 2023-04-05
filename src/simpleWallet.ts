import Web3 from "web3";
import {
  WalletBase,
  EncryptedKeystoreV3Json,
  TransactionReceipt,
} from "web3-core";
import { STORAGE_KEY } from "./constant";
import { setLocalStorage, getLocalStorage } from "./helper";

export default class SimpleWallet {
  private readonly web3: Web3;
  private readonly ADDRESS_LIST =
    getLocalStorage<string[]>(STORAGE_KEY.ADDRESS) || [];
  private getWallet: WalletBase;

  constructor(rpc: string) {
    if (!rpc) {
      console.error("require key");
      return;
    }

    this.web3 = new Web3(new Web3.providers.HttpProvider(rpc));
  }

  async getBalance(address?: string): Promise<string> {
    try {
      const balanceWei = await this.web3.eth.getBalance(
        address || this.ADDRESS_LIST[0]
      );
      const balance = this.web3.utils.fromWei(balanceWei, "ether");
      return balance;
    } catch {
      return "-";
    }
  }

  async createWallet() {
    const { address, privateKey } = this.web3.eth.accounts.create();

    this.web3.eth.accounts.wallet.add({
      address: address,
      privateKey: privateKey,
    });

    this.getWallet = this.web3.eth.accounts.wallet;

    // accounts.wallet에 등록된 지갑 조회 후 퍼블릭 주소 추출
    const pickPublicAddress = this.getWallet[this.getWallet.length - 1].address;

    setLocalStorage(STORAGE_KEY.ADDRESS, pickPublicAddress);

    this.createAndEncryptKey();
    return pickPublicAddress;
  }

  async sendTransaction(
    fromAddress: string,
    toAddress: string,
    sendAmount: string,
    privateKeyToStringfy: string | ArrayBuffer | EncryptedKeystoreV3Json
  ): Promise<TransactionReceipt> {
    const nonce = await this.web3.eth.getTransactionCount(fromAddress);

    // 네트워크 평균 가스 가격 조회
    const gasPrice = await this.web3.eth.getGasPrice();

    const tx = {
      nonce: parseInt(this.web3.utils.toHex(nonce), 16),
      from: fromAddress,
      to: toAddress,
      value: this.web3.utils.toWei(sendAmount, "ether"),
      gasPrice,
      gas: "21000",
      data: "",
    };

    const { privateKey } = this.web3.eth.accounts.decrypt(
      privateKeyToStringfy as EncryptedKeystoreV3Json,
      STORAGE_KEY.PASSWORD
    );

    let txReceipt: TransactionReceipt;

    try {
      // 전송 거래 서명
      const signedTx = await this.web3.eth.accounts.signTransaction(
        tx,
        privateKey
      );
      // 전송 거래 발송
      txReceipt = await this.web3.eth.sendSignedTransaction(
        signedTx.rawTransaction
      );
    } catch (e) {
      console.error("failed transaction", e);
      alert(e);
    }

    console.log(":::SUCCESS:::", txReceipt);

    return txReceipt;
  }

  private createAndEncryptKey() {
    // private key 암호화
    const keystore = this.web3.eth.accounts.encrypt(
      this.getWallet[this.getWallet.length - 1].privateKey,
      STORAGE_KEY.PASSWORD
    );

    // 암호화된 지갑 파일 다운로드
    const blob = new Blob([JSON.stringify(keystore)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `key-${new Date().getMilliseconds()}.json`;
    link.click();
  }

  getAllAddress() {
    return this.ADDRESS_LIST;
  }
}
