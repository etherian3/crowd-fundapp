import React, { useState, useContext } from "react";
import { toast } from "react-hot-toast";
import { CrowdFundContext } from "../Context/CrowdFund";

const PopUp = ({ setOpenModel, donateCampaign }) => {
  const { donate, getDonations } = useContext(CrowdFundContext);
  const [amount, setAmount] = useState("");
  const [allDonation, setAllDonation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDonations, setShowDonations] = useState(false);

  const createDonation = async () => {
    try {
      if (!amount || amount === "0" || isNaN(amount)) {
        toast.error("Masukkan jumlah donasi yang valid");
        return;
      }

      setIsLoading(true);
      
      await donate(donateCampaign.pId, amount);
      toast.success(`Donasi ${amount} ETH berhasil dikirim!`);
      setAmount("");
    } catch (error) {
      // Error sudah diformat oleh Context
      toast.error(error.message || "Terjadi kesalahan saat melakukan donasi");
    } finally {
      setIsLoading(false);
    }
  };

  const getAllDonations = async () => {
    try {
      setIsLoading(true);
      const donations = await getDonations(donateCampaign.pId);
      setAllDonation(donations);
      setShowDonations(true);
    } catch (error) {
      // Error sudah diformat oleh Context
      toast.error(error.message || "Gagal memuat daftar donatur");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="fixed inset-0 w-full h-full bg-black opacity-70" onClick={() => setOpenModel(false)}></div>
        <div className="flex items-center min-h-screen px-4 py-8">
          <div className="relative w-full max-w-lg mx-auto bg-gray-800 rounded-lg shadow-xl border border-gray-700">
            <div className="flex items-start justify-between p-4 border-b border-gray-700 rounded-t">
              <h3 className="text-xl font-semibold text-white">
                {showDonations 
                  ? "Daftar Donatur" 
                  : `Donasi untuk ${donateCampaign?.title}`}
              </h3>
              <button 
                className="text-gray-400 bg-transparent hover:bg-gray-700 hover:text-white rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                onClick={() => setOpenModel(false)}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                </svg>
              </button>
            </div>

            {showDonations ? (
              <div className="p-6">
                {allDonation.length === 0 ? (
                  <p className="text-center text-gray-400 py-4">Belum ada donasi untuk campaign ini</p>
                ) : (
                  <div className="space-y-4">
                    {allDonation.map((donation, i) => (
                      <div key={i + 1} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                        <div className="text-sm truncate max-w-[200px]">
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
                <button
                  onClick={() => setShowDonations(false)}
                  className="w-full mt-6 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                >
                  Kembali
                </button>
              </div>
            ) : (
              <div className="p-6 space-y-6">
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
                          (parseFloat(donateCampaign?.amountCollected) / parseFloat(donateCampaign?.target)) * 100,
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
                  />
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    onClick={createDonation}
                    disabled={isLoading}
                    className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                      isLoading ? "bg-purple-400 cursor-not-allowed" : "bg-purple-600 hover:bg-purple-700"
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
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default PopUp;
