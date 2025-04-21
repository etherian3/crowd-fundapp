import React, { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";

// INTERNAL IMPORTS
import { CrowdFundABI, CrowdFundAddress } from "./constants";

// FETCHING THE CONTRACT
const fetchContract = (signerOrProvider) => {
  return new ethers.Contract(CrowdFundAddress, CrowdFundABI, signerOrProvider);
};

export const CrowdFundContext = React.createContext();

export const CrowdFundProvider = ({ children }) => {
  const titleData = "Crowd Fund Contract";
  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [userCampaigns, setUserCampaigns] = useState([]);

  // Fungsi untuk menangani error blockchain dan mengubahnya menjadi pesan user-friendly
  const handleTransactionError = (error) => {
    // Cek kode error untuk 'user rejected action'
    if (
      error.code === 4001 ||
      error.message?.includes("user rejected") ||
      error.message?.includes("User denied") ||
      error.message?.includes("transaction signature")
    ) {
      // Jangan log error lengkap untuk penolakan user
      console.log("Info: Transaksi dibatalkan oleh pengguna");
      return new Error("Transaksi dibatalkan oleh pengguna");
    }

    // Log error lain secara penuh untuk debugging
    console.error("Transaction error:", error);

    // Error gas
    if (error.message?.includes("gas") || error.message?.includes("fee")) {
      return new Error(
        "Biaya gas tidak mencukupi. Coba setel gas lebih tinggi atau tunggu jaringan tidak sibuk."
      );
    }

    // Error kontrak
    if (error.message?.includes("execution reverted")) {
      let reason = "Eksekusi kontrak gagal";
      try {
        // Coba ekstrak pesan error dari kontrak jika ada
        const revertReason =
          error.message.split("execution reverted:")[1]?.trim() || "";
        if (revertReason) reason += `: ${revertReason}`;
      } catch (e) {}
      return new Error(reason);
    }

    // Error jaringan
    if (
      error.message?.includes("network") ||
      error.message?.includes("connection")
    ) {
      return new Error(
        "Masalah koneksi jaringan. Silakan periksa koneksi internet Anda."
      );
    }

    // Error umum lainnya
    return new Error("Terjadi kesalahan. Coba lagi nanti.");
  };

  // Fungsi untuk mendapatkan signer dan contract
  const getContractWithSigner = async () => {
    try {
      const web3Modal = new Web3Modal();
      const connection = await web3Modal.connect();
      const provider = new ethers.BrowserProvider(connection);
      const signer = await provider.getSigner();
      return fetchContract(signer);
    } catch (error) {
      throw handleTransactionError(error);
    }
  };

  // Fungsi untuk mendapatkan contract read-only
  const getContractReadOnly = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      return fetchContract(provider);
    } catch (error) {
      console.error("Error getting read-only contract:", error);
      throw handleTransactionError(error);
    }
  };

  const createCampaign = async (campaign) => {
    if (!currentAccount) {
      return Promise.reject(new Error("Wallet tidak terhubung"));
    }

    setIsLoading(true);

    try {
      const contract = await getContractWithSigner();
      console.log("Creating campaign with data:", campaign);

      // Konversi deadline ke Unix timestamp (detik)
      const deadlineDate = new Date(campaign.deadline);
      const deadlineUnix = Math.floor(deadlineDate.getTime() / 1000);
      console.log(
        "Deadline Unix timestamp:",
        deadlineUnix,
        "Date:",
        deadlineDate.toISOString()
      );

      let tx;
      try {
        tx = await contract.createCampaign(
          currentAccount,
          campaign.title,
          campaign.description,
          ethers.parseEther(campaign.target),
          deadlineUnix
        );
      } catch (error) {
        // Jika terjadi error pada saat memanggil kontrak
        throw handleTransactionError(error);
      }

      console.log("Transaction sent:", tx.hash);

      try {
        await tx.wait();
        console.log("Transaction confirmed");
      } catch (error) {
        // Jika terjadi error pada saat menunggu konfirmasi
        throw handleTransactionError(error);
      }

      // Tunggu beberapa block untuk memastikan data terupdate
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await loadCampaigns();

      return tx;
    } catch (error) {
      // Tangkap semua error yang tidak tertangkap dan dikonversi
      const formattedError =
        error instanceof Error ? error : handleTransactionError(error);
      return Promise.reject(formattedError);
    } finally {
      setIsLoading(false);
    }
  };

  const getCampaigns = async () => {
    try {
      const contract = await getContractReadOnly();
      console.log("Fetching campaigns from:", CrowdFundAddress);

      const campaigns = await contract.getCampaigns();
      console.log("Raw campaigns:", campaigns);

      const parsedCampaigns = campaigns.map((campaign, i) => {
        // Pastikan deadline dalam format Unix timestamp (detik)
        const deadlineTimestamp = Number(campaign.deadline);
        // Konversi jika ternyata deadline adalah dalam milisecond bukan seconds
        const adjustedDeadline =
          deadlineTimestamp > 9999999999
            ? Math.floor(deadlineTimestamp / 1000)
            : deadlineTimestamp;

        console.log(`Campaign ${i} deadline:`, {
          original: campaign.deadline.toString(),
          asNumber: deadlineTimestamp,
          adjusted: adjustedDeadline,
          asDate: new Date(adjustedDeadline * 1000).toISOString(),
        });

        return {
          owner: campaign.owner.toLowerCase(),
          title: campaign.title,
          description: campaign.description,
          target: ethers.formatEther(campaign.target.toString()),
          deadline: adjustedDeadline, // Gunakan deadline yang sudah dikonversi
          amountCollected: ethers.formatEther(campaign.amountRaised.toString()),
          pId: i,
          image: campaign.image || "",
        };
      });

      console.log("Parsed campaigns:", parsedCampaigns);
      return parsedCampaigns;
    } catch (error) {
      console.error("Error in getCampaigns:", error);
      return [];
    }
  };

  const getUserCampaigns = async () => {
    try {
      if (!currentAccount) return [];

      const allCampaigns = await getCampaigns();
      const userCampaigns = allCampaigns.filter(
        (campaign) => campaign.owner === currentAccount.toLowerCase()
      );

      console.log("User campaigns:", userCampaigns);
      return userCampaigns;
    } catch (error) {
      console.error("Error in getUserCampaigns:", error);
      return [];
    }
  };

  const donate = async (pId, amount) => {
    if (!currentAccount) {
      return Promise.reject(new Error("Wallet tidak terhubung"));
    }

    setIsLoading(true);

    try {
      const contract = await getContractWithSigner();

      let tx;
      try {
        tx = await contract.donateToCampaign(pId, {
          value: ethers.parseEther(amount),
        });
      } catch (error) {
        // Jika terjadi error pada saat memanggil kontrak
        throw handleTransactionError(error);
      }

      console.log("Donation transaction sent:", tx.hash);

      try {
        await tx.wait();
        console.log("Donation confirmed");
      } catch (error) {
        // Jika terjadi error pada saat menunggu konfirmasi
        throw handleTransactionError(error);
      }

      await loadCampaigns();
      return tx;
    } catch (error) {
      // Tangkap semua error yang tidak tertangkap dan dikonversi
      const formattedError =
        error instanceof Error ? error : handleTransactionError(error);
      return Promise.reject(formattedError);
    } finally {
      setIsLoading(false);
    }
  };

  const getDonations = async (pId) => {
    try {
      const contract = await getContractReadOnly();
      const donations = await contract.getDonator(pId);

      const parsedDonations = [];
      for (let i = 0; i < donations[0].length; i++) {
        parsedDonations.push({
          donator: donations[0][i].toLowerCase(),
          donation: ethers.formatEther(donations[1][i].toString()),
        });
      }

      return parsedDonations;
    } catch (error) {
      const formattedError = handleTransactionError(error);
      console.error("Error in getDonations:", formattedError.message);
      return [];
    }
  };

  const loadCampaigns = async () => {
    try {
      setIsLoading(true);
      const [allData, userData] = await Promise.all([
        getCampaigns(),
        getUserCampaigns(),
      ]);

      setAllCampaigns(allData);
      setUserCampaigns(userData);
    } catch (error) {
      console.error("Error in loadCampaigns:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) throw new Error("Please install MetaMask");

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length) {
        setCurrentAccount(accounts[0].toLowerCase());
        await loadCampaigns();
      }
    } catch (error) {
      console.error("Error in checkIfWalletIsConnected:", error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) throw new Error("Please install MetaMask");

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0].toLowerCase());
      await loadCampaigns();
    } catch (error) {
      if (error.code === 4001) {
        console.log("Info: Permintaan koneksi wallet ditolak oleh pengguna");
        // return Promise.reject(new Error("Anda menolak untuk menghubungkan wallet"));
      }

      console.error("Error in connectWallet:", error);
      // return Promise.reject(new Error("Gagal menghubungkan wallet"));
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();

    if (window.ethereum) {
      // Listen for account changes
      window.ethereum.on("accountsChanged", async (accounts) => {
        if (accounts.length > 0) {
          setCurrentAccount(accounts[0].toLowerCase());
          await loadCampaigns();
        } else {
          setCurrentAccount("");
          setAllCampaigns([]);
          setUserCampaigns([]);
        }
      });

      // Listen for network changes
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <CrowdFundContext.Provider
      value={{
        titleData,
        currentAccount,
        isLoading,
        allCampaigns,
        userCampaigns,
        createCampaign,
        donate,
        getDonations,
        connectWallet,
        loadCampaigns, // Expose loadCampaigns for manual refresh
      }}
    >
      {children}
    </CrowdFundContext.Provider>
  );
};
