import React, { useState, useContext } from "react";
import { toast } from "react-hot-toast";
import { CrowdFundContext } from "../Context/CrowdFund";

const Hero = ({ titleData, createCampaign }) => {
  const { currentAccount } = useContext(CrowdFundContext);
  const [isLoading, setIsLoading] = useState(false);
  const [campaign, setCampaign] = useState({
    title: "",
    description: "",
    amount: "",
    deadline: "",
  });

  const createNewCampaign = async (e) => {
    e.preventDefault();

    try {
      if (!currentAccount) {
        toast.error("Silakan hubungkan wallet Anda terlebih dahulu");
        return;
      }

      if (
        !campaign.title ||
        !campaign.description ||
        !campaign.amount ||
        !campaign.deadline
      ) {
        toast.error("Semua field harus diisi");
        return;
      }

      setIsLoading(true);

      await createCampaign({
        ...campaign,
        target: campaign.amount, // Menambahkan target amount yang akan digunakan smart contract
      });

      toast.success("Campaign berhasil dibuat!");
      setCampaign({ title: "", description: "", amount: "", deadline: "" });
    } catch (error) {
      // Error sudah diformat oleh Context
      toast.error(error.message || "Gagal membuat campaign");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative h-screen flex items-center">
      <div className="absolute inset-0">
        <img
          src="https://images.pexels.com/photos/3228766/pexels-photo-3228766.jpeg?auto=compress&cs=tinysrgb&amp;dpr=2&amp;h=750&amp;w=1260"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-75"></div>
      </div>

      <div className="relative w-full max-w-6xl mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="w-full lg:w-5/12 flex flex-col justify-center -mt-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
              FUNDY <br />
              Web3 Platform
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Fundy adalah platform crowdfunding terdesentralisasi yang
              menggunakan blockchain untuk transparansi dan keamanan yang lebih
              baik.
            </p>
            <a
              href="#campaigns"
              className="inline-flex items-center text-lg font-medium text-purple-400 hover:text-purple-300 transition-colors"
            >
              Lihat Campaign
              <svg
                className="w-5 h-5 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </a>
          </div>

          <div className="w-full lg:w-5/12 -mt-20">
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Buat Campaign
              </h3>
              <form onSubmit={createNewCampaign} className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Judul
                  </label>
                  <input
                    value={campaign.title}
                    onChange={(e) =>
                      setCampaign({ ...campaign, title: e.target.value })
                    }
                    placeholder="Judul campaign"
                    required
                    type="text"
                    className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    id="title"
                  />
                </div>
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Deskripsi
                  </label>
                  <textarea
                    value={campaign.description}
                    onChange={(e) =>
                      setCampaign({ ...campaign, description: e.target.value })
                    }
                    placeholder="Deskripsi campaign"
                    required
                    rows="2"
                    className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    id="description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="amount"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Target Dana (ETH)
                    </label>
                    <input
                      value={campaign.amount}
                      onChange={(e) =>
                        setCampaign({ ...campaign, amount: e.target.value })
                      }
                      placeholder="0.5"
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      id="amount"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="deadline"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Batas Waktu
                    </label>
                    <input
                      value={campaign.deadline}
                      onChange={(e) =>
                        setCampaign({ ...campaign, deadline: e.target.value })
                      }
                      required
                      type="date"
                      className="w-full px-4 py-2 text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      id="deadline"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-2.5 text-sm font-medium cursor-pointer text-white bg-purple-600 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200 disabled:bg-purple-300 disabled:cursor-not-allowed mt-2"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Membuat Campaign...
                    </div>
                  ) : (
                    "Buat Campaign"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
