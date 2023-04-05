import { RPC_API } from "./constant";
import {
  EncryptedKeystoreV3Json,
  TransactionReceipt,
} from "../node_modules/web3-core/types";
import SimpleWallet from "./simpleWallet";
import { getLocalStorage, setLocalStorage } from "./helper";

document.addEventListener("DOMContentLoaded", async () => {
  const walletListSelect = document.getElementById(
    "wallet-select"
  ) as HTMLSelectElement;

  const createWalletBtn = document.getElementById(
    "create-wallet-btn"
  ) as HTMLButtonElement;

  const balanceSpan = document.getElementById("balance");

  const toAddressInput = document.getElementById(
    "toAddress"
  ) as HTMLInputElement;
  const sendAmountInput = document.getElementById(
    "send-amount"
  ) as HTMLInputElement;

  const privateKeyInput = document.getElementById("privateKeyUpload");

  const sendBtn = document.getElementById("transfer-submit");

  const showLoadingDiv = document.getElementsByClassName(
    "display-none"
  )[0] as HTMLDivElement;

  const transactionLi = document.getElementById("detail-view-container");

  const wallet = new SimpleWallet(RPC_API);
  let sendAmount = "";
  let toAddress = "";
  let privateKeyToStringfy: string | ArrayBuffer | EncryptedKeystoreV3Json;

  // 페이지 랜더링 후 기본 지갑의 잔액 조회
  const renderDefaultWalletBalance = async () => {
    const balance = await wallet.getBalance(
      walletListSelect.options[walletListSelect.selectedIndex || 0]?.textContent
    );
    balanceSpan.innerHTML = balance;
  };
  renderDefaultWalletBalance();

  // 지갑 리스트 변경시 잔액 최신화
  walletListSelect.addEventListener("change", async () => {
    const balance = await wallet.getBalance(
      walletListSelect.options[walletListSelect.selectedIndex || 0]?.textContent
    );
    balanceSpan.innerHTML = balance;
  });

  toAddressInput.addEventListener("change", (e: Event) => {
    const { value } = e.target as HTMLInputElement;
    toAddress = value;
  });

  sendAmountInput.addEventListener("change", (e: Event) => {
    const { value } = e.target as HTMLInputElement;
    sendAmount = value;
  });

  // 지갑 생성
  createWalletBtn.addEventListener("click", async () => {
    alert("암호화 된 private key 파일을 다운로드 합니다.");

    const address = await wallet.createWallet();
    addAddressToList(address);
    renderDefaultWalletBalance();
  });

  // 지갑 주소 리스트 랜더링
  const addAddressToList = (addreess: string) => {
    //
    const option = document.createElement("option");
    option.value = addreess;
    option.text = addreess;
    walletListSelect.add(option);
  };

  // 전체 지갑주소 리스트 랜더링
  const loadAddressLost = (lists: string[]) => {
    lists.forEach((list) => {
      const option = document.createElement("option");
      option.value = list;
      option.text = list;
      walletListSelect.add(option);
    });
  };
  loadAddressLost(wallet.getAllAddress());

  // 전송된 트랜잭션 li 생성
  const createTransactionLiTag = (txReceipt: TransactionReceipt) => {
    const link = document.createElement("a");
    link.href = `https://goerli.etherscan.io/tx/${txReceipt.transactionHash}`;
    link.target = "_blank";
    const linkText = document.createTextNode(`${txReceipt.transactionHash}`);
    link.appendChild(linkText);

    const listItem = document.createElement("li");
    listItem.appendChild(link);
    transactionLi.appendChild(listItem);
  };

  // 전체 트랜잭션 기록 로드
  const loadTransactionList = () => {
    const txList = getLocalStorage<TransactionReceipt[]>("tx");
    if (txList) {
      txList.forEach((list) => {
        createTransactionLiTag(list);
      });
    }
  };
  loadTransactionList();

  // 트랜잭션 전송
  sendBtn.addEventListener("submit", async (e: Event) => {
    e.preventDefault();

    if (!toAddress || !sendAmount) {
      alert("전송 정보를 다시 확인해주세요");
      return;
    }

    try {
      showLoadingDiv.className = "lds-ring";
      const txHash = await wallet.sendTransaction(
        walletListSelect[walletListSelect.selectedIndex].textContent,
        toAddress,
        sendAmount,
        privateKeyToStringfy
      );

      createTransactionLiTag(txHash);
      setLocalStorage("tx", txHash);
      renderDefaultWalletBalance();
    } catch {
    } finally {
      showLoadingDiv.className = "display-none";
    }
  });

  // private key 파일 업로드
  privateKeyInput.addEventListener("change", (e) => {
    const target = e.target as HTMLInputElement;
    const privateKeyFile = target.files[0];

    // 프라이빗키 파일 텍스트로 변환
    const reader = new FileReader();

    if (privateKeyFile) {
      reader.readAsText(privateKeyFile);
    }

    reader.addEventListener("load", () => {
      privateKeyToStringfy = reader.result;
    });
  });
});
