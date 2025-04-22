import React, { useState, useContext, useEffect } from "react";
import { toast } from "react-hot-toast";
import { CrowdFundContext } from "../Context/CrowdFund";
import { ethers } from "ethers";

const PopUp = ({ setOpenModel, donateCampaign }) => {
  const { donateToCampaign, getDonations, currentAccount, isLoading: contextLoading } = useContext(CrowdFundContext);
  const [amount, setAmount] = useState("");
  const [allDonation, setAllDonation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDonations, setShowDonations] = useState(donateCampaign?.showDonationsList || false);
  const [donationsError, setDonationsError] = useState(null);
  const [donationSuccess, setDonationSuccess] = useState(false);

  // Langsung menampilkan daftar donatur jika showDonationsList true
  useEffect(() => {
    if (donateCampaign?.showDonationsList) {
      getAllDonations();
    }
    setShowDonations(donateCampaign?.showDonationsList || false);
  }, [donateCampaign]);

  // Reset status saat modal dibuka
  useEffect(() => {
    setDonationSuccess(false);
    setDonationsError(null);
  }, []);

  // Function untuk mengecek apakah kampanye sudah berakhir
  const isCampaignEnded = () => {
    if (!donateCampaign) return true;
    
    // Cek deadline
    const deadlineTimestamp = Number(donateCampaign.deadline);
    const deadlineMs = deadlineTimestamp * 1000;
    const currentTime = Date.now();
    const isDeadlinePassed = deadlineMs < currentTime;
    
    // Cek target tercapai
    const amountCollected = parseFloat(donateCampaign.amountCollected);
    const targetAmount = parseFloat(donateCampaign.target);
    const isTargetReached = !isNaN(amountCollected) && !isNaN(targetAmount) && amountCollected >= targetAmount;
    
    return isDeadlinePassed || isTargetReached;
  };

  const createDonation = async () => {
    if (!currentAccount) {
      toast.error("Harap sambungkan wallet Anda terlebih dahulu");
      return;
    }

    // Validasi jumlah donasi
    if (!amount || amount.trim() === '') {
      toast.error("Silakan masukkan jumlah donasi");
      return;
    }

    const donationAmount = parseFloat(amount);
    if (isNaN(donationAmount) || donationAmount <= 0) {
      toast.error("Jumlah donasi harus lebih dari 0");
      return;
    }

    // Validasi campaign
    if (!donateCampaign || (donateCampaign.pId !== 0 && !donateCampaign.pId)) {
      toast.error("Data kampanye tidak valid");
      return;
    }

    // Cek batas waktu kampanye
    const deadlineTimestamp = Number(donateCampaign.deadline);
    const deadlineMs = deadlineTimestamp * 1000;
    const currentTime = Date.now();
    if (deadlineMs < currentTime) {
      toast.error("Kampanye ini telah berakhir");
      return;
    }

    // Cek target tercapai
    const targetReached = parseFloat(donateCampaign.amountCollected) >= parseFloat(donateCampaign.target);
    if (targetReached) {
      toast.error("Target kampanye sudah tercapai");
      return;
    }

    // Cek jumlah donasi yang terlalu kecil (terkait dengan gas fees)
    if (donationAmount < 0.0001) {
      toast.error("Jumlah donasi terlalu kecil, minimum 0.0001 ETH");
      return;
    }

    // Cek saldo pengguna (jika tersedia)
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const balance = await provider.getBalance(currentAccount);
        const balanceInEth = ethers.formatEther(balance);
        
        if (parseFloat(balanceInEth) < donationAmount) {
          toast.error("Saldo ETH Anda tidak mencukupi untuk donasi ini");
          return;
        }
      }
    } catch (error) {
      console.error("Error saat memeriksa saldo:", error);
      // Lanjutkan proses donasi meskipun gagal memeriksa saldo
    }

    setIsLoading(true);
    setDonationSuccess(false);
    
    try {
      // Panggil donateToCampaign dari context
      const receipt = await donateToCampaign(donateCampaign.pId, amount);
      
      if (receipt) {
        setDonationSuccess(true);
        setAmount('');
        
        // Tampilkan sukses
        toast.success(`Berhasil mendonasikan ${amount} ETH!`);
        
        // Tutup modal setelah beberapa detik
        setTimeout(() => {
          setOpenModel(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error dalam createDonation:", error);
      
      // Berikan pesan error yang spesifik
      if (error.message && error.message.includes("insufficient funds")) {
        toast.error("Saldo ETH tidak mencukupi untuk donasi ini");
      } else if (error.message && error.message.includes("user rejected")) {
        toast.error("Transaksi dibatalkan");
      } else {
        toast.error("Gagal melakukan donasi. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getAllDonations = async () => {
    try {
      setDonationsError(null);
      setIsLoading(true);
      
      if (donateCampaign?.pId === undefined || donateCampaign?.pId === null) {
        setDonationsError("ID Campaign tidak valid");
        setIsLoading(false);
        return;
      }

      setShowDonations(true);
      
      console.log("Mengambil data donasi untuk kampanye ID:", donateCampaign.pId);
      toast.loading("Memuat data donasi...", { id: "load-donations" });
      
      const donations = await getDonations(donateCampaign.pId);
      
      if (Array.isArray(donations)) {
        console.log("Data donasi diterima:", donations.length, "donasi");
        setAllDonation(donations);
        toast.success("Data donasi berhasil dimuat", { id: "load-donations" });
      } else {
        console.error("Format data donasi tidak valid:", donations);
        setAllDonation([]);
        setDonationsError("Format data donasi tidak valid");
        toast.error("Format data donasi tidak valid", { id: "load-donations" });
      }
    } catch (error) {
      console.error("Error getAllDonations:", error);
      setDonationsError("Terjadi kesalahan saat memuat donatur");
      setAllDonation([]);
      toast.error("Gagal memuat data donasi", { id: "load-donations" });
    } finally {
      setIsLoading(false);
    }
  };

  const retryGetDonations = () => {
    setDonationsError(null);
    getAllDonations();
  };

  // Fungsi untuk menutup modal dengan konfirmasi jika sedang loading
  const handleCloseModal = () => {
    if (isLoading) {
      const confirmClose = window.confirm("Proses sedang berjalan. Yakin ingin menutup?");
      if (!confirmClose) return;
    }
    setOpenModel(false);
  };

  return (
    <>
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="fixed inset-0 w-full h-full bg-black opacity-70" onClick={handleCloseModal}></div>
        <div className="flex items-center min-h-screen px-4 py-8">
          <div className="relative w-full max-w-lg mx-auto bg-gray-800 rounded-lg shadow-xl border border-gray-700">
            <div className="flex items-start justify-between p-4 border-b border-gray-700 rounded-t">
              <h3 className="text-xl font-semibold text-white">
                {showDonations 
                  ? "Daftar Donatur" 
                  : `Donasi untuk ${donateCampaign?.title || 'Campaign'}`}
              </h3>
              <button 
                className="text-gray-400 bg-transparent hover:bg-gray-700 hover:text-white rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                onClick={handleCloseModal}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </button>
            </div>

            {showDonations ? (
              <div className="p-6">
                {isLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-600"></div>
                    <p className="ml-2 text-gray-300">Memuat donatur...</p>
                  </div>
                ) : donationsError ? (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                    <p className="text-center text-gray-400 mb-4">{donationsError}</p>
                    <button
                      onClick={retryGetDonations}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                    >
                      Coba Lagi
                    </button>
                  </div>
                ) : allDonation.length === 0 ? (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path>
                    </svg>
                    <p className="text-center text-gray-400 py-4">Belum ada donasi untuk campaign ini</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allDonation.map((donation, i) => (
                      <div key={i + 1} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                        <div className="flex items-center gap-3 text-sm truncate max-w-[200px]">
                          <span className="font-bold text-purple-400 min-w-[24px] flex items-center justify-center bg-gray-800 rounded-full h-6 w-6">
                            {i + 1}
                          </span>
                          <span className="font-medium text-white">
                            {donation.donator.slice(0, 6)}...{donation.donator.slice(-4)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-purple-400 font-bold">{donation.donation} ETH</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!isCampaignEnded() && (
                  <button
                    onClick={() => setShowDonations(false)}
                    className="w-full mt-6 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    Lakukan Donasi
                  </button>
                )}

                <button
                  onClick={handleCloseModal}
                  className={`w-full mt-2 px-4 py-2 text-sm font-medium text-purple-400 border border-purple-500 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
                >
                  Tutup
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {donationSuccess ? (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12 text-green-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <h3 className="text-xl font-bold text-white mb-2">Donasi Berhasil!</h3>
                    <p className="text-gray-400 mb-6">Terima kasih atas donasi Anda untuk kampanye ini.</p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setShowDonations(true);
                          getAllDonations();
                        }}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        Lihat Donatur
                      </button>
                      <button
                        onClick={handleCloseModal}
                        className="flex-1 px-4 py-2 text-purple-400 border border-purple-500 rounded-lg hover:bg-gray-700"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-gray-400 mb-2">
                        Terkumpul:{" "}
                        <span className="font-bold text-white">
                          {donateCampaign?.amountCollected} ETH
                        </span>
                        {" "}dari{" "}
                        <span className="font-bold text-white">
                          {donateCampaign?.target} ETH
                        </span>
                      </p>
                      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{
                            width: `${Math.min(
                              (parseFloat(donateCampaign?.amountCollected || 0) / parseFloat(donateCampaign?.target || 1)) * 100,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
                        Jumlah Donasi (ETH)
                      </label>
                      <input
                        type="number"
                        id="amount"
                        placeholder="0.01 ETH"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        disabled={isLoading}
                      />
                      
                      {isCampaignEnded() && (
                        <div className="text-sm text-red-400 mt-1">
                          Kampanye ini telah berakhir atau target sudah tercapai
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <button
                        onClick={createDonation}
                        disabled={isLoading || !currentAccount || isCampaignEnded()}
                        className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                          isLoading ? "bg-purple-400 cursor-not-allowed" : 
                          !currentAccount ? "bg-gray-500 cursor-not-allowed" : 
                          isCampaignEnded() ? "bg-gray-500 cursor-not-allowed" :
                          "bg-purple-600 hover:bg-purple-700"
                        }`}
                      >
                        {isLoading ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Memproses...
                          </div>
                        ) : !currentAccount ? (
                          "Sambungkan Dompet Dulu"
                        ) : isCampaignEnded() ? (
                          "Kampanye Berakhir"
                        ) : (
                          "Kirim Donasi"
                        )}
                      </button>
                      <button
                        onClick={getAllDonations}
                        disabled={isLoading}
                        className={`flex-1 px-4 py-2 text-sm font-medium text-purple-400 border border-purple-500 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                          isLoading ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        Lihat Donasi
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PopUp;
