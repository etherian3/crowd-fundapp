import React, { useEffect, useState, useContext } from "react";
import { CrowdFundContext } from "../Context/CrowdFund";
import { toast } from "react-hot-toast";

const Card = ({
  title,
  allcampaign,
  setOpenModel,
  setDonateCampaign,
  isLoading,
  isFinished = false,
}) => {
  const { getDonations } = useContext(CrowdFundContext);
  const [campaigns, setCampaigns] = useState([]);
  const [error, setError] = useState(null);
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    try {
      setLocalLoading(true);
      
      if (allcampaign) {
        // Validasi data campaign dengan logging tambahan
        console.log("Memproses", allcampaign.length, "kampanye");
        
        const validCampaigns = allcampaign.filter(campaign => {
          if (!campaign || typeof campaign !== 'object') {
            console.warn("Campaign tidak valid (bukan object):", campaign);
            return false;
          }
          
          // Cek field penting
          const requiredFields = ['title', 'owner', 'description', 'target', 'deadline', 'amountCollected', 'pId'];
          const missingFields = requiredFields.filter(field => campaign[field] === undefined);
          
          if (missingFields.length > 0) {
            console.warn("Campaign kehilangan field:", missingFields, campaign);
            return false;
          }
          
          // Cek validitas nilai
          const isTargetValid = !isNaN(parseFloat(campaign.target));
          const isAmountValid = !isNaN(parseFloat(campaign.amountCollected));
          const isDeadlineValid = !isNaN(Number(campaign.deadline));
          
          if (!isTargetValid || !isAmountValid || !isDeadlineValid) {
            console.warn("Campaign memiliki nilai tidak valid:", {
              targetValid: isTargetValid,
              amountValid: isAmountValid,
              deadlineValid: isDeadlineValid,
              campaign
            });
            return false;
          }
          
          return true;
        });
        
        console.log(`Filtered ${allcampaign.length} campaigns to ${validCampaigns.length} valid campaigns`);
        
        // Filter lanjutan untuk kampanye aktif/selesai sesuai prop isFinished
        const filteredByStatus = validCampaigns.filter(campaign => {
          const daysLeft = calculateDaysLeft(campaign.deadline);
          const targetReached = isTargetReached(campaign.amountCollected, campaign.target);
          const isEnded = daysLeft <= 0 || targetReached;
          
          // Untuk isFinished=true, tampilkan yang selesai, sebaliknya untuk isFinished=false
          return isFinished ? isEnded : !isEnded;
        });
        
        console.log(`Filtered to ${filteredByStatus.length} campaigns by status (isFinished=${isFinished})`);
        setCampaigns(filteredByStatus);
        
        if (filteredByStatus.length < validCampaigns.length) {
          console.info(`${validCampaigns.length - filteredByStatus.length} campaigns filtered by status`);
        }
      } else {
        console.log("Tidak ada data campaign yang diterima");
        setCampaigns([]);
      }
      
      // Reset error state jika sukses
      setError(null);
    } catch (err) {
      console.error("Error processing campaigns:", err);
      setError("Terjadi kesalahan saat memproses data kampanye");
      setCampaigns([]);
    } finally {
      setLocalLoading(false);
    }
  }, [allcampaign, isFinished]);

  const calculateDaysLeft = (deadline) => {
    try {
      if (!deadline || isNaN(Number(deadline))) {
        console.warn("Invalid deadline value:", deadline);
        return 0;
      }
      
      // Convert deadline dari timestamp dalam detik ke milliseconds
      const deadlineTimestamp = Number(deadline);
      const deadlineMs = deadlineTimestamp * 1000;
      const currentTime = Date.now();

      // Hitung selisih dalam hari
      const diffTime = deadlineMs - currentTime;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Pastikan nilai tidak negatif
      return Math.max(0, diffDays);
    } catch (error) {
      console.error("Error calculating days left:", error, deadline);
      return 0;
    }
  };

  const isTargetReached = (amountCollected, target) => {
    try {
      const amount = parseFloat(amountCollected);
      const targetAmount = parseFloat(target);
      
      if (isNaN(amount) || isNaN(targetAmount)) {
        return false;
      }
      
      return amount >= targetAmount;
    } catch (error) {
      console.error("Error checking if target reached:", error);
      return false;
    }
  };

  // Fungsi untuk langsung menampilkan daftar donatur
  const showDonations = async (campaign) => {
    try {
      if (!campaign || !campaign.pId) {
        console.error("Invalid campaign data for showing donations");
        return;
      }
      
      setDonateCampaign({...campaign, showDonationsList: true});
      setOpenModel(true);
    } catch (error) {
      console.error("Error showing donations:", error);
    }
  };

  // Fungsi untuk menampilkan form donasi
  const showDonationForm = (campaign) => {
    try {
      if (!campaign || !campaign.pId) {
        toast.error("Data kampanye tidak valid");
        return;
      }
      
      // Validasi status kampanye
      const daysRemaining = calculateDaysLeft(campaign.deadline);
      const targetReached = isTargetReached(campaign.amountCollected, campaign.target);
      
      if (daysRemaining <= 0) {
        toast.error("Kampanye ini telah berakhir");
        return;
      }
      
      if (targetReached) {
        toast.error("Target kampanye sudah tercapai");
        return;
      }
      
      // Set data kampanye untuk form donasi
      setDonateCampaign({...campaign, showDonationsList: false});
      setOpenModel(true);
    } catch (error) {
      console.error("Error showing donation form:", error);
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    }
  };

  // Tampilkan loading state dengan skeleton loader yang lebih baik
  if (isLoading || localLoading) {
    return (
      <div className="py-12 bg-gray-900" id="campaigns">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white mb-8">{title}</h2>
          <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
            {[1, 2, 3].map((i) => (
              <div
                key={`skeleton-${i}`}
                className="bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-700 animate-pulse"
              >
                <div className="h-48 bg-gray-700"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-700 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6 mb-6"></div>
                  <div className="h-2 bg-gray-700 rounded-full w-full mb-3"></div>
                  <div className="h-4 bg-gray-700 rounded-full w-full mb-6"></div>
                  <div className="flex space-x-2">
                    <div className="h-10 bg-gray-700 rounded-lg w-1/2"></div>
                    <div className="h-10 bg-gray-700 rounded-lg w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  // Tampilkan error state jika ada error
  if (error) {
    return (
      <div className="py-12 bg-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-12 px-4 bg-gray-800 rounded-xl shadow-sm border border-gray-700">
            <svg
              className="mx-auto h-12 w-12 text-red-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">
              Gagal Memuat Campaign
            </h3>
            <p className="text-gray-400 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="campaigns" className="py-12 bg-gray-900">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
            {title}
          </h2>
          <div className="w-20 h-1 bg-purple-600 mx-auto rounded-full"></div>
        </div>

        {!campaigns || campaigns.length === 0 ? (
          <div className="text-center py-12 px-4 bg-gray-800 rounded-xl shadow-sm border border-gray-700">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isFinished
                ? "Belum ada campaign yang berakhir/tercapai"
                : "Belum ada campaign yang aktif"}
            </h3>
            <p className="text-gray-400">
              {isFinished
                ? "Campaign akan muncul di sini setelah berakhir atau mencapai target"
                : "Jadilah yang pertama membuat campaign!"}
            </p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-3 md:grid-cols-2 sm:grid-cols-1">
            {campaigns.map((campaign, i) => {
              try {
                const daysRemaining = calculateDaysLeft(campaign.deadline);
                const progressPercentage =
                  parseFloat(campaign.target) > 0
                    ? (parseFloat(campaign.amountCollected) /
                        parseFloat(campaign.target)) *
                      100
                    : 0;
                const targetReached = isTargetReached(
                  campaign.amountCollected,
                  campaign.target
                );
                const isCampaignEnded = daysRemaining <= 0 || targetReached;

                return (
                  <div
                    key={`campaign-${campaign.pId}-${i}`}
                    className="bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-700"
                  >
                    <div className="bg-purple-700 text-white py-4 px-6">
                      <h3 className="text-xl font-bold mb-1 line-clamp-1">
                        {campaign.title || "Kampanye Tanpa Judul"}
                      </h3>
                      <p className="text-sm text-purple-100 opacity-80">
                        {campaign.owner?.slice(0, 6)}...{campaign.owner?.slice(-4)}
                      </p>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            targetReached
                              ? "bg-green-900 text-green-300"
                              : daysRemaining <= 0
                              ? "bg-red-900 text-red-300"
                              : daysRemaining <= 3
                              ? "bg-yellow-800 text-yellow-300"
                              : "bg-purple-900 text-purple-300"
                          }`}
                        >
                          {targetReached
                            ? "Target Tercapai!"
                            : daysRemaining <= 0
                            ? "Campaign Berakhir"
                            : `${daysRemaining} Hari Tersisa`}
                        </span>
                      </div>

                      <p className="text-gray-300 mb-6 line-clamp-3 h-18">
                        {campaign.description || "Tidak ada deskripsi"}
                      </p>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-400">
                            Progress
                          </span>
                          <span className="font-bold text-purple-400">
                            {progressPercentage.toFixed(1)}%
                          </span>
                        </div>

                        <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ${
                              targetReached ? "bg-green-500" : "bg-purple-500"
                            }`}
                            style={{
                              width: `${Math.min(progressPercentage, 100)}%`,
                            }}
                          ></div>
                        </div>

                        <div className="flex justify-between items-baseline">
                          <div>
                            <span className="text-2xl font-bold text-white">
                              {campaign.amountCollected}
                            </span>
                            <span className="text-sm text-gray-400 ml-1">
                              ETH
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-white">
                              {campaign.target}
                            </span>
                            <span className="text-sm text-gray-400 ml-1">
                              ETH
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {!isCampaignEnded && (
                            <button
                              onClick={() => showDonationForm(campaign)}
                              className="flex-1 px-4 py-3 text-sm font-medium cursor-pointer text-white transition-colors duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 bg-purple-600 hover:bg-purple-700"
                            >
                              <span className="flex items-center justify-center">
                                Donasi Sekarang
                                <svg
                                  className="w-4 h-4 ml-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                  />
                                </svg>
                              </span>
                            </button>
                          )}

                          <button
                            onClick={() => showDonations(campaign)}
                            className={`${
                              isCampaignEnded ? "flex-1" : "w-auto"
                            } px-4 py-3 text-sm font-medium cursor-pointer text-purple-400 border border-purple-500 transition-colors duration-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 hover:bg-gray-700`}
                          >
                            Lihat Donatur
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } catch (error) {
                console.error(`Error rendering campaign ${i}:`, error, campaign);
                return null; // Skip rendering this campaign
              }
            }).filter(Boolean)} {/* Filter out null campaigns */}
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
