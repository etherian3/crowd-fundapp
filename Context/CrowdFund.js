import React, { useEffect, useState } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import { toast } from "react-hot-toast";

// INTERNAL IMPORTS
import { CrowdFundABI, CrowdFundAddress } from "./constants";

// Helper function untuk memastikan nilai BigInt dikonversi dengan benar ke hex
// ethers v6 memiliki utils.toQuantity tetapi beberapa versi mungkin tidak
if (!ethers.toQuantity) {
  ethers.toQuantity = function(value) {
    if (typeof value === 'bigint') {
      return '0x' + value.toString(16);
    }
    // Jika sudah string dengan 0x prefix
    if (typeof value === 'string' && value.startsWith('0x')) {
      return value;
    }
    // Konversi number ke hex string
    if (typeof value === 'number') {
      return '0x' + value.toString(16);
    }
    // Default fallback
    return '0x' + BigInt(value).toString(16);
  };
}

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

  // Fungsi untuk mendapatkan provider non-signer
  const getProvider = () => {
    try {
      if (window.ethereum) {
        return new ethers.BrowserProvider(window.ethereum);
      }
      return ethers.getDefaultProvider("goerli");
    } catch (error) {
      console.error("Error mendapatkan provider:", error);
      return ethers.getDefaultProvider("goerli");
    }
  };
  
  // Fungsi untuk mendapatkan contract read-only (tidak perlu signer)
  const getContractReadOnly = async () => {
    try {
      // Gunakan public provider jika tidak ada signer
      let provider;
      
      try {
        // Coba gunakan provider dari window.ethereum jika tersedia
        if (window.ethereum) {
          provider = new ethers.BrowserProvider(window.ethereum);
          console.log("Menggunakan provider dari window.ethereum");
        } else {
          // Fallback ke provider public
          provider = ethers.getDefaultProvider("goerli");
          console.log("Menggunakan public provider");
        }
      } catch (error) {
        console.error("Error mendapatkan provider:", error);
        provider = ethers.getDefaultProvider("goerli");
        console.log("Fallback ke public provider setelah error");
      }
      
      // Buat contract instance yang read-only
      const contract = new ethers.Contract(
        CrowdFundAddress,
        CrowdFundABI,
        provider
      );
      
      console.log("Contract read-only berhasil dibuat");
      return contract;
    } catch (error) {
      console.error("Error dalam getContractReadOnly:", error);
      return null;
    }
  };

  const createCampaign = async (campaign) => {
    setIsLoading(true);

    try {
      if (!currentAccount) {
        setIsLoading(false);
        toast.error("Silakan hubungkan wallet Anda terlebih dahulu");
        return null;
      }

      // Validasi input yang lebih komprehensif
      if (!campaign.title || !campaign.description || !campaign.target || !campaign.deadline) {
        setIsLoading(false);
        toast.error("Semua field harus diisi");
        return null;
      }

      // Validasi target amount
      const targetAmount = parseFloat(campaign.target);
      if (isNaN(targetAmount) || targetAmount <= 0) {
        setIsLoading(false);
        toast.error("Target donasi harus lebih dari 0 ETH");
        return null;
      }

      console.log("Membuat kampanye dengan data:", campaign);

      // Validasi dan konversi deadline dengan benar
      // Pastikan deadline adalah objek Date yang valid
      const deadlineDate = new Date(campaign.deadline);
      if (!(deadlineDate instanceof Date && !isNaN(deadlineDate))) {
        setIsLoading(false);
        toast.error("Format tanggal deadline tidak valid");
        return null;
      }

      // Set waktu ke 23:59:59 untuk tanggal yang dipilih (akhir hari)
      deadlineDate.setHours(23, 59, 59, 999);
      
      const now = new Date();
      // Pastikan deadline lebih dari hari ini
      if (deadlineDate <= now) {
        setIsLoading(false);
        toast.error("Deadline harus setelah hari ini");
        return null;
      }
      
      // Konversi deadline ke Unix timestamp (detik)
      const deadlineUnix = Math.floor(deadlineDate.getTime() / 1000);
      console.log(
        "Deadline Unix timestamp:",
        deadlineUnix,
        "Date:",
        deadlineDate.toISOString()
      );

      try {
        if (!window.ethereum) {
          setIsLoading(false);
          toast.error("Silakan install MetaMask untuk membuat kampanye");
          return null;
        }

        // Pastikan terhubung ke wallet
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (!accounts || accounts.length === 0) {
          setIsLoading(false);
          toast.error("Tidak dapat terhubung ke wallet");
          return null;
        }

        console.log("Membuat kampanye dengan parameter berikut:");
        console.log("- Pemilik:", currentAccount);
        console.log("- Judul:", campaign.title);
        console.log("- Deskripsi:", campaign.description);
        console.log("- Target:", campaign.target, "ETH");
        console.log("- Deadline:", deadlineUnix, "timestamp");
        console.log("- Tanggal deadline:", new Date(deadlineUnix * 1000).toLocaleString());

        toast.loading("Memproses pembuatan kampanye...", { id: "create-campaign" });

        // Konversi target amount ke wei
        const parsedAmount = ethers.parseEther(campaign.target);
        
        // Buat provider untuk mendapatkan informasi network dan menunggu transaksi
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Buat interface kontrak untuk encode fungsi
        const iface = new ethers.Interface(CrowdFundABI);
        const data = iface.encodeFunctionData("createCampaign", [
          currentAccount,
          campaign.title,
          campaign.description,
          parsedAmount,
          deadlineUnix
        ]);
        
        console.log("=== PENDEKATAN SEDERHANA ===");
        console.log("Mengirim transaksi langsung ke ethereum provider...");
        
        try {
          // Kirim transaksi langsung melalui ethereum provider
          const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [
              {
                from: currentAccount,
                to: CrowdFundAddress,
                data: data,
              },
            ],
          });
          
          console.log("Transaksi terkirim:", txHash);
          toast.loading("Menunggu konfirmasi transaksi...", { id: "create-campaign" });
          
          // Tunggu transaksi dikonfirmasi (timeout 60 detik)
          console.log("Menunggu konfirmasi transaksi...");
          const receipt = await provider.waitForTransaction(txHash, 1, 60000);
          console.log("Transaksi berhasil:", receipt);
          
          toast.success("Kampanye berhasil dibuat!", { id: "create-campaign" });
          
          // Refresh data
          await loadCampaigns();
          
          setIsLoading(false);
          return receipt;
        } catch (error) {
          console.error("Error saat membuat kampanye:", error);
          
          if (error.code === 4001 || 
              error.code === "ACTION_REJECTED" || 
              (error.message && (
                error.message.includes("rejected") || 
                error.message.includes("denied") || 
                error.message.includes("canceled")
              ))
          ) {
            toast.error("Transaksi dibatalkan oleh pengguna", { id: "create-campaign" });
          } else {
            console.error("Detail error lengkap:", error);
            toast.error("Gagal membuat kampanye. Silakan coba lagi atau restart browser.", { id: "create-campaign" });
          }
          
          setIsLoading(false);
          return null;
        }
      } catch (error) {
        console.error("Error saat membuat kampanye:", error);
        toast.error("Terjadi kesalahan saat membuat kampanye", { id: "create-campaign" });
        setIsLoading(false);
        return null;
      }
    } catch (error) {
      console.error("Error dalam createCampaign:", error);
      toast.error("Terjadi kesalahan saat membuat kampanye", { id: "create-campaign" });
      setIsLoading(false);
      return null;
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

  const donateToCampaign = async (pId, amount) => {
    setIsLoading(true);
    
    try {
      if (!currentAccount) {
        setIsLoading(false);
        toast.error("Harap sambungkan dompet Anda terlebih dahulu");
        return null;
      }
      
      console.log(`Memulai donasi ke kampanye ID: ${pId} dengan jumlah: ${amount} ETH`);
      
      // Validasi amount
      if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
        setIsLoading(false);
        toast.error("Jumlah donasi tidak valid");
        return null;
      }
      
      // Verifikasi pId adalah integer
      const campaignId = parseInt(pId);
      if (isNaN(campaignId)) {
        setIsLoading(false);
        toast.error("ID kampanye tidak valid");
        return null;
      }
      
      try {
        if (!window.ethereum) {
          toast.error("MetaMask tidak terdeteksi");
          setIsLoading(false);
          return null;
        }
        
        // Koneksi ke MetaMask
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (!accounts || accounts.length === 0) {
          toast.error("Tidak dapat terhubung ke MetaMask");
          setIsLoading(false);
          return null;
        }
        
        // Buat provider untuk menunggu transaksi
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Konversi jumlah ETH ke wei
        const amountInWei = ethers.parseEther(amount.toString());
        
        console.log(`Donasi ke kampanye ID ${campaignId} dengan ${amount} ETH...`);
        toast.loading("Memproses donasi...", { id: "donation-process" });
        
        // Siapkan data untuk pemanggilan fungsi
        const iface = new ethers.Interface(CrowdFundABI);
        const data = iface.encodeFunctionData("donateToCampaign", [campaignId]);
        
        console.log("=== PENDEKATAN SEDERHANA DONASI ===");
        console.log("Mengirim transaksi donasi langsung ke provider...");
        
        try {
          // Kirim transaksi langsung ke provider
          const txHash = await window.ethereum.request({
            method: 'eth_sendTransaction',
            params: [
              {
                from: currentAccount,
                to: CrowdFundAddress,
                data: data,
                value: ethers.toQuantity(amountInWei), // Penting: konversi BigInt ke hex
              },
            ],
          });
          
          console.log("Transaksi donasi terkirim:", txHash);
          toast.loading("Menunggu konfirmasi donasi...", { id: "donation-process" });
          
          // Tunggu konfirmasi dengan timeout 60 detik
          const receipt = await provider.waitForTransaction(txHash, 1, 60000);
          console.log("Transaksi donasi berhasil:", receipt);
          
          toast.success("Donasi berhasil terkirim!", { id: "donation-process" });
          
          // Perbarui data kampanye
          await loadCampaigns();
          
          setIsLoading(false);
          return receipt;
        } catch (error) {
          console.error("Error saat mengirim donasi:", error);
          
          // Cek apakah user membatalkan transaksi
          if (error.code === 4001 || 
              error.code === "ACTION_REJECTED" || 
              (error.message && (
                error.message.includes("rejected") || 
                error.message.includes("denied") || 
                error.message.includes("canceled")
              ))
          ) {
            toast.error("Transaksi dibatalkan", { id: "donation-process" });
          } else if (error.message && error.message.includes("insufficient funds")) {
            toast.error("Saldo tidak mencukupi", { id: "donation-process" });
          } else {
            console.error("Detail error lengkap:", error);
            toast.error("Gagal melakukan donasi. Silakan coba lagi atau restart browser.", { id: "donation-process" });
          }
          
          setIsLoading(false);
          return null;
        }
      } catch (error) {
        console.error("Error dalam donasi:", error);
        toast.error("Terjadi kesalahan saat donasi", { id: "donation-process" });
        setIsLoading(false);
        return null;
      }
    } catch (error) {
      console.error("Error dalam donateToCampaign:", error);
      toast.error("Terjadi kesalahan saat donasi", { id: "donation-process" });
      setIsLoading(false);
      return null;
    }
  };

  const getDonations = async (pId) => {
    try {
      console.log(`Mengambil data donasi untuk campaign ID: ${pId}`);
      
      // Validasi dasar
      if (pId === undefined || pId === null) {
        console.warn("Campaign ID tidak valid");
        return [];
      }
      
      // Gunakan window.ethereum jika tersedia, atau fallback ke allCampaigns jika tidak
      let provider;
      
      if (window.ethereum) {
        // Gunakan BrowserProvider untuk kompatibilitas terbaik
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        console.warn("window.ethereum tidak tersedia, fallback ke kampanye yang sudah dimuat");
        
        // Langsung periksa data dari allCampaigns
        if (allCampaigns && allCampaigns.length > 0) {
          const campaign = allCampaigns.find(c => Number(c.pId) === Number(pId));
          
          if (campaign && parseFloat(campaign.amountCollected) > 0) {
            console.log("Menggunakan data kampanye dari state");
            
            // Fallback - minimal kembalikan donasi 'default' oleh pemilik
            return [{
              donator: campaign.owner.toLowerCase(),
              donation: campaign.amountCollected
            }];
          }
        }
        
        return [];
      }
      
      try {
        // Buat kontrak read-only
        const contract = new ethers.Contract(
          CrowdFundAddress,
          CrowdFundABI,
          provider
        );
        
        // Pastikan campaign ada
        let campaigns;
        try {
          campaigns = await contract.getCampaigns();
        } catch (error) {
          console.warn("Error saat mendapatkan kampanye:", error);
          return [];
        }
        
        const campaignId = Number(pId);
        
        if (!campaigns || campaignId >= campaigns.length) {
          console.warn(`Campaign dengan ID ${campaignId} tidak ditemukan`);
          return [];
        }
        
        // Buat try-catch terpisah untuk getDonator untuk menangani error dengan lebih baik
        let donatorData = null;
        
        try {
          donatorData = await contract.getDonator(campaignId);
          console.log("Data donator berhasil didapatkan:", donatorData);
        } catch (error) {
          console.warn("Error saat memanggil getDonator:", error);
          // Fallback ke campaign data
        }
        
        // Jika berhasil mendapatkan data donator
        if (donatorData && Array.isArray(donatorData) && donatorData.length >= 2) {
          const donators = donatorData[0] || [];
          const amounts = donatorData[1] || [];
          
          console.log(`Berhasil mendapatkan ${donators.length} donator`);
          
          if (donators.length === 0) {
            return [];
          }
          
          const parsedDonations = [];
          
          for (let i = 0; i < donators.length; i++) {
            if (donators[i]) {
              try {
                const donator = donators[i].toLowerCase();
                const amount = ethers.formatEther(amounts[i] || 0);
                
                parsedDonations.push({
                  donator: donator,
                  donation: amount
                });
              } catch (err) {
                console.warn(`Error saat parsing donasi #${i}:`, err);
              }
            }
          }
          
          return parsedDonations;
        }
        
        // Jika tidak berhasil mendapatkan data melalui getDonator, coba ekstrak dari kampanye
        const campaign = campaigns[campaignId];
        
        if (campaign && campaign.amountRaised && campaign.amountRaised.toString() !== "0") {
          console.log("Campaign memiliki donasi berdasarkan amountRaised");
          
          // Kembalikan minimal donasi 'default' oleh pemilik
          return [{
            donator: campaign.owner.toLowerCase(),
            donation: ethers.formatEther(campaign.amountRaised)
          }];
        }
        
        return [];
      } catch (error) {
        console.warn("Error umum saat mendapatkan donator:", error);
        
        // Fallback ke allCampaigns
        if (allCampaigns && allCampaigns.length > 0) {
          const campaign = allCampaigns.find(c => Number(c.pId) === Number(pId));
          
          if (campaign && parseFloat(campaign.amountCollected) > 0) {
            return [{
              donator: campaign.owner.toLowerCase(),
              donation: campaign.amountCollected
            }];
          }
        }
        
        return [];
      }
    } catch (error) {
      console.error("Error dalam getDonations:", error);
      return []; // Selalu kembalikan array kosong
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
        donateToCampaign,
        getDonations,
        connectWallet,
        loadCampaigns, // Expose loadCampaigns for manual refresh
      }}
    >
      {children}
    </CrowdFundContext.Provider>
  );
};
